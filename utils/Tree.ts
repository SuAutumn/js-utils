abstract class Tree<T, K> {
    // 迭代tree
    abstract iterator(cb: (item: T) => void): void

    // 根据标记 获取item
    abstract getItem(uniqueId: K): T | undefined

    // 根据标记 获取到达item path
    abstract getItemPath(uniqueId: K): T[]

    // 插入子item
    abstract insertItem(uniqueId: K, index: number, item: T): boolean

    // 删除子item
    abstract deleteByUniqueId(uniqueId: K): boolean

    // 删除子item
    abstract deleteByItem(item: T): boolean

    // 根据子 获取父
    abstract getPItemBySubItem(item: T): T | undefined

    abstract getPItemBySubUniqueId(uniqueId: K): T | undefined
}
// example
type TreeItem = {
    id: number;
    name: string;
    children?: TreeItem[];
}

export class TestTree extends Tree<TreeItem, number> {
    private tree: TreeItem
    // 停止迭代信号
    private sigBreak = false
    private path: TreeItem[] = []

    constructor(tree: TreeItem) {
        super()
        this.tree = tree
    }

    iterator(cb: (item: TreeItem) => any) {
        const stack = [this.tree]
        // 每层children的数量
        let childrenLen = [1]
        this.path = []
        while (stack.length > 0) {
            const node = <TreeItem>stack.pop()
            this.path.push(node)
            cb(node)
            if (this.sigBreak) {
                break
            }
            // 当前层减1
            childrenLen[childrenLen.length - 1]--
            if (node.children && node.children.length > 0) {
                stack.push(...node.children)
                childrenLen.push(node.children.length)
            } else {
                this.path.pop()
            }
            // 当前层没有item时候，去除这层数量，path向上再减一个
            if (childrenLen[childrenLen.length - 1] === 0) {
                childrenLen.pop()
                this.path.pop()
            }
        }
    }

    getItem(uniqueId: number): TreeItem | undefined {
        let result: TreeItem | undefined
        this.iterator(item => {
            if (item.id === uniqueId) {
                result = item
                this.sigBreak = true
            }
        })
        this.sigBreak = false
        return result
    }

    getItemPath(uniqueId: number): TreeItem[] {
        this.iterator(item => {
            this.sigBreak = item.id === uniqueId
        })
        this.sigBreak = false
        return this.path;
    }

    insertItem(uniqueId: number, index: number, item: TreeItem) {
        const pItem = this.getItem(uniqueId)
        if (pItem) {
            if (pItem.children) {
                pItem.children.splice(index, 0, item)
            } else {
                pItem.children = [item]
            }
            return true
        }
        return false
    }

    deleteByItem(item: TreeItem): boolean {
        return this.deleteByUniqueId(item.id)
    }

    deleteByUniqueId(uniqueId: number): boolean {
        const pItem = this.getPItemBySubUniqueId(uniqueId)
        if (pItem && pItem.children) {
            pItem.children.splice(pItem.children.map(child => child.id).indexOf(uniqueId), 1)
            return true
        }
        return false;
    }


    getPItemBySubItem(item: TreeItem): TreeItem | undefined {
        return this.getPItemBySubUniqueId(item.id)
    }

    getPItemBySubUniqueId(uniqueId: number): TreeItem | undefined {
        const path = this.getItemPath(uniqueId)
        if (path.length > 1) {
            return path[path.length - 2]
        }
    }
}
