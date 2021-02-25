export default function simpleDiff(
  newArr = [],
  oldArr = [],
  getValCb = (val) => val
) {
  newArr = newArr.slice(0)
  oldArr = oldArr.slice(0)
  if (newArr.length === 0) {
    return oldArr.map((item) => {
      return { data: item, type: 'delete' }
    })
  }
  if (oldArr.length === 0) {
    return newArr.map((item) => {
      return { data: item, type: 'add' }
    })
  }
  let r = []
  let i = 0
  let index = -1 // 新元素在老元素中位置
  for (; i < newArr.length; i++) {
    index = indexOf(oldArr, newArr[i], getValCb)
    if (index > -1) {
      oldArr.slice(0, index).forEach((item) => {
        r.push({ data: item, type: 'delete' })
      })
      break
    }
    r.push({ data: newArr[i], type: 'add' })
  }
  const newArrChild = newArr.slice(i + 1)
  const oldArrChild = oldArr.slice(index + 1)
  if (newArrChild.length > 0 || oldArrChild.length > 0) {
    r = r.concat(simpleDiff(newArrChild, oldArrChild, getValCb))
  }
  return r
}

function indexOf(arr, item, getValCb) {
  const len = arr.length
  let index = -1
  for (let i = 0; i < len; i++) {
    if (getValCb(arr[i]) === getValCb(item)) {
      index = i
      break
    }
  }
  return index
}
