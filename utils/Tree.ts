abstract class Tree<T, K> {
    // 迭代tree
    abstract iterator(cb: (item: T, path: readonly T[]) => void): T[]

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
    private readonly tree: TreeItem
    private sigBreak = false

    constructor(tree: TreeItem) {
        super()
        this.tree = tree
    }

    iterator(cb: (item: TreeItem, path: TreeItem[]) => any) {
        const stack = [[this.tree]]
        const path = <TreeItem[]>[]
        while (stack.length > 0) {
            const node = <TreeItem>stack[stack.length - 1].pop()
            path.push(node)
            cb(node, path)
            if (this.sigBreak) {
                break
            }
            if (node.children && node.children.length > 0) {
                // copy children
                stack.push(node.children.slice(0))
            } else {
                path.pop()
            }
            // clear stack and path
            let index = stack.length - 1
            while (index >= 0) {
                if (stack[index].length === 0) {
                    path.pop()
                    stack.pop()
                } else {
                    break
                }
                index--
            }

        }
        return path
    }

    getItem(uniqueId: number): TreeItem | undefined {
        return this.getItemPath(uniqueId).pop()
    }

    getItemPath(uniqueId: number): TreeItem[] {
        const path = this.iterator((item) => {
            this.sigBreak = item.id === uniqueId
        })
        this.sigBreak = false
        return path
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
        path.pop()
        return path.pop()
    }

}
