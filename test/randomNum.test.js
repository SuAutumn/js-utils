import randomNum from '../utils/randomNum'

test('random num', () => {
  for (let i = 0; i < 100; i++) {
    const val = randomNum(1, 100)
    expect(val).toBeGreaterThanOrEqual(1)
    expect(val).toBeLessThanOrEqual(100)

    const val1 = randomNum(0, 0)
    expect(val1).toBe(0)

    const val2 = randomNum(-100, 100)
    expect(val2).toBeGreaterThanOrEqual(-100)
    expect(val2).toBeLessThanOrEqual(100)

    const val3 = randomNum(100, -100)
    expect(val3).toBeGreaterThanOrEqual(-100)
    expect(val3).toBeLessThanOrEqual(100)
  }
})
