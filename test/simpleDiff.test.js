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

test('simpleDiff: mock', () => {
  expect(simpleDiff([], [])).toEqual([])
  expect(simpleDiff()).toEqual([])

  expect(simpleDiff([1], [])).toEqual([{ data: 1, type: 'add' }])
  expect(simpleDiff([], [1])).toEqual([{ data: 1, type: 'delete' }])

  expect(simpleDiff([2, 1], [3, 2, 1])).toEqual([{ data: 3, type: 'delete' }])
  expect(simpleDiff([3, 1], [3, 2, 1])).toEqual([{ data: 2, type: 'delete' }])
  expect(simpleDiff([3, 2], [3, 2, 1])).toEqual([{ data: 1, type: 'delete' }])

  // 收尾diff
  expect(simpleDiff([4, 3, 2], [3, 2, 1])).toEqual([
    { data: 4, type: 'add' },
    { data: 1, type: 'delete' },
  ])
  expect(simpleDiff([3, 2, 1], [4, 3, 2])).toEqual([
    { data: 4, type: 'delete' },
    { data: 1, type: 'add' },
  ])

  expect(simpleDiff([10, 8, 7, 6, 4, 3, 2], [9, 8, 7, 6, 5, 3, 1])).toEqual([
    { data: 10, type: 'add' },
    { data: 9, type: 'delete' },
    { data: 4, type: 'add' },
    { data: 5, type: 'delete' },
    { data: 2, type: 'add' },
    { data: 1, type: 'delete' },
  ])
})
