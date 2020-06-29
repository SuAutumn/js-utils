import randomNum from "../utils/randomNum";

test("random num", () => {
  for (let i = 0; i < 100; i++) {
    const val = randomNum(1, 10);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10);
  }
})