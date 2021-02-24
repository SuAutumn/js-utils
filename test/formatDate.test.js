import formatDate from '../utils/formatDate'

test('formatDate', () => {
  expect(formatDate(Number('1614130432000'), 'yyyy-MM-dd HH:ss:mm.S')).toEqual(
    '2021-02-24 09:52:33.0'
  )
  expect(formatDate(1614130432000, 'yyyy-MM-dd HH:ss:mm.S')).toEqual(
    '2021-02-24 09:52:33.0'
  )
  // expect(formatDate('2021-02-24 09:52:33', 'yyyy-MM-dd HH:ss:mm.S')).toEqual(
  //   '2021-02-24 09:52:33.0'
  // )
})
