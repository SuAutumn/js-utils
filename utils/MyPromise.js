const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
export default class MyPromise {
  /**
   * @param {((value?: any) => void, (reason?: any) => void) => void} cb
   */
  constructor (cb) {
    this.status = PENDING
    this._funList = []
    cb((value) => {
      this.resolve(value)
    }, (reason) => {
      this.reject(reason)
    })
  }

  resolve (value) {
    this.status = FULFILLED
    this.run(value)
  }

  reject (reason) {
    this.status = REJECTED
    this.run(reason)
  }

  run (value) {
    setTimeout(() => {
      const fun = this.getFun()
      if (fun) {
        try {
          const val = fun.cb(value)
          if (val instanceof MyPromise) {
            val.then(this.resolve.bind(this))
              .catch(this.reject.bind(this))
          } else {
            this.resolve(val)
          }
        } catch (e) {
          this.reject(e)
        }
      } else {
        this.status = value
      }
    }, 0)
  }

  getFun () {
    let r
    while (this._funList.length > 0) {
      r = this._funList.shift()
      if (r.status === this.status) {
        break
      }
    }
    return r
  }

  then (cb) {
    this._funList.push({
      status: FULFILLED,
      cb: (value) => {
        this.status = PENDING
        return cb(value)
      }
    })
    return this
  }

  catch (cb) {
    this._funList.push({
      status: REJECTED, cb: error => {
        this.status = PENDING
        return cb(error)
      }
    })
    return this
  }
}



