const TARGET = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -2]
/**
 * 二分查找，基于排序列表
 */
function binarySearch(list: number[], tarValue: number): number | undefined {
  const sortList = list.sort((num1, num2) => num1 - num2)
  let start = 0
  let end = list.length - 1
  let mid = Math.floor((start + end) / 2)
  while (start <= end) {
    if (sortList[mid] === tarValue) {
      return mid
    }
    if (sortList[mid] > tarValue) {
      // 偏一位
      end = mid - 1
    }
    if (sortList[mid] < tarValue) {
      // 偏一位
      start = mid + 1
    }
    mid = Math.floor((start + end) / 2)
  }
}
