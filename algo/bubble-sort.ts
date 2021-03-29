/**
 * 最简单冒泡排序，没有考虑已经找到最大值的情况
 * 最坏的排序情况（全部逆序），进行n-1次排序，每次需要n-1比较大小和交换位置，时间复杂度O((n-1)²) => O(n²)
 */
function simpleBubbleSort(list: number[]) {
  const newList = list.slice(0)
  if (newList.length === 0) return newList

  let isNeedSort = false
  const len = newList.length
  let offset = 0
  let count = 0
  while (offset < len) {
    count++
    /** 处理边界 */
    if (offset + 1 === len) {
      if (isNeedSort) {
        offset = 0
        isNeedSort = false
      } else {
        break
      }
    }
    const val1 = newList[offset]
    const val2 = newList[offset + 1]
    if (val1 > val2) {
      newList[offset] = val2
      newList[offset + 1] = val1
      isNeedSort = true
    }
    offset++
  }
  console.log(count)
  return newList
}

/**
 * 改进冒泡排序
 * 最坏的排序情况（全部逆序），进行n-1次排序，每次需要n*(n-1)/2比较大小和交换位置，时间复杂度O(n2)
 * 比一开始最简单的少一半 2 - (2 / n)
 */
function bubbleSort(list: number[]) {
  const newList = list.slice(0)
  if (newList.length === 0) return newList

  let isNeedSort = false
  let len = newList.length
  let offset = 0
  let count = 0
  while (offset < len) {
    count++
    /** 处理边界 */
    if (offset + 1 === len) {
      if (isNeedSort) {
        offset = 0
        isNeedSort = false
        len = len - 1
      } else {
        break
      }
    }
    const val1 = newList[offset]
    const val2 = newList[offset + 1]
    if (val1 > val2) {
      newList[offset] = val2
      newList[offset + 1] = val1
      isNeedSort = true
    }
    offset++
  }
  console.log(count)
  return newList
}

/**
 * 分治思想
 * 参照此原理实现：
 * 通过一趟排序将要排序的数据分割成独立的两部分，
 * 其中一部分的所有数据比另一部分的所有数据要小，
 * 再按这种方法对这两部分数据分别进行快速排序，
 * 整个排序过程可以递归进行，使整个数据变成有序序列。
 *
 * @error 递归调用，有可能在最坏的情况下触发调用栈溢出
 */
let count = 0
function myQuickSort(list: number[], res: number[] = []) {
  count++
  const newList = list.slice(0)
  const len = newList.length
  if (len === 0) return

  const val = newList[0]
  const left = []
  const right = []
  if (len > 1) {
    for (let i = 1; i < len; i++) {
      const iVal = newList[i]
      if (iVal <= val) {
        left.push(iVal)
      } else {
        right.push(iVal)
      }
    }
    myQuickSort(left, res)
    res.push(val)
    myQuickSort(right, res)
  } else {
    res.push(val)
  }
  return res
}

/**
 * 参照网上实现原地交换快速排序
 * 使用递归实现
 */
function quickSort(list: number[], start: number, end: number) {
  if (list.length === 0) return

  /** 双向索引 */
  let i = start
  let j = end
  if (i >= j) return

  let postive = false // 是否正向查找数据
  const val = list[i]

  while (i < j) {
    /** 正向查找 */
    if (postive) {
      if (list[i] > val) {
        list[j] = list[i]
        list[i] = val
        j--
        postive = false
      } else {
        i++
        postive = true
      }
    } else {
      /** 反向查找 */
      if (val > list[j]) {
        list[i] = list[j]
        list[j] = val
        i++
        postive = true
      } else {
        j--
        postive = false
      }
    }
  }
  quickSort(list, start, i)
  quickSort(list, i + 1, end)
}

;[10, 100, 1000, 10000, 100000, 1000000, 10000000].forEach((len) => {
  const test = []
  for (let i = 0; i < len; i++) {
    test.push(Math.floor(Math.random() * len * 10))
  }

  console.time(`myQuickSort ${len}`)
  count = 0
  myQuickSort(test)
  console.log('myQuickSort:', count)
  console.timeEnd(`myQuickSort ${len}`)

  console.time(`QuickSort ${len}`)
  quickSort(test, 0, test.length - 1)
  console.timeEnd(`QuickSort ${len}`)

  // console.time(`Sort ${len}`)
  // count = 0
  // test.sort((v1, v2) => {
  //   count++
  //   return v2 - v1
  // })
  // console.log('Sort:', count)
  // console.timeEnd(`Sort ${len}`)
})
