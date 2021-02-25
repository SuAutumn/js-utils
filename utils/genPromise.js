export default function genPromise() {
  let success, fail
  const p = new Promise((resolve, reject) => {
    success = resolve
    fail = reject
  })
  return { p, success, fail }
}
