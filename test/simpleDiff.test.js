import simpleDiff from '../utils/simpleDiff'

test('simpleDiff: newArr is empty', () => {
  const r = simpleDiff([], [1, 2, 3])
  expect(r).toEqual([
    { data: 1, type: 'delete' },
    { data: 2, type: 'delete' },
    { data: 3, type: 'delete' },
  ])
})
test('simpleDiff: oldArr is empty', () => {
  const r = simpleDiff([1, 2, 3], [])
  expect(r).toEqual([
    { data: 1, type: 'add' },
    { data: 2, type: 'add' },
    { data: 3, type: 'add' },
  ])
})
test('simpleDiff: newArr add', () => {
  const r = simpleDiff([1, 2], [2])
  expect(r).toEqual([{ data: 1, type: 'add' }])
})
test('simpleDiff: newArr delete', () => {
  const r = simpleDiff([2], [1, 2])
  expect(r).toEqual([{ data: 1, type: 'delete' }])
})
test('simpleDiff: newArr delete bottom and top', () => {
  const r = simpleDiff([0, 2, 4, 7, 8], [1, 2, 3, 4, 5])
  expect(r).toEqual([
    { data: 0, type: 'add' },
    { data: 1, type: 'delete' },
    { data: 3, type: 'delete' },
    { data: 5, type: 'delete' },
  ])
})
