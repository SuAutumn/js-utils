import MyPromise from '../utils/MyPromise'

test('my promise', done => {
  new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve(123)
    }, 1000)
  })
    .then(res => {
      expect(res).toBe(123)
      return new MyPromise((resolve) => {
        setTimeout(resolve, 1000, 'test')
      })
        .then(res => {
          expect(res).toBe('test')
          return 456
        })
    })
    .then(res => {
      expect(res).toBe(456)
    })
    .catch(e => {
      expect(() => {
        throw e
      }).toThrow(Error)
      console.log(e)
      done()
    })
    .then(done)
})
