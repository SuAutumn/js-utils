export default function <T>(): {
  p: Promise<T>
  success: (v?: T) => any
  fail: (e: Error) => any
}
