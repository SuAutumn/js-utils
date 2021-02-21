export default function (newArr = [], oldArr = [], getValCb = (val) => val) {
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
  const r = []
  let i = 0
  let index = -1
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
  if (index > -1) {
    for (; i < newArr.length; i++) {
      if (index >= oldArr.length) {
        break
      }
      if (getValCb(newArr[i]) !== getValCb(oldArr[index])) {
        r.push({ data: oldArr[index], type: 'delete' })
        i--
      }
      index++
    }
    // if (index < oldArr.length ) {
    //   oldArr.slice(index).forEach((item) => {
    //     r.push({ data: item, type: 'delete' })
    //   })
    // }
  }

  return r
}

function indexOf(arr, item, getValCb = (val) => val) {
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