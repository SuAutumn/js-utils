export default class SecCounter {
  constructor () {
    this.timer = undefined
  }

  // 启动倒计时
  countStart (second, resolve) {
    if (typeof second !== 'number') {
      throw new TypeError('SecCounter: (second, resolve) seconde is not a number')
    }
    resolve(this.getDate(second))
    this.timer = setInterval(() => {
      if (second > 0) {
        second--
        resolve(this.getDate(second))
        second === 0 && this.countStop()
      } else {
        this.countStop()
      }
    }, 1000)
  }

  // 关闭倒计时
  countStop () {
    this.timer && clearInterval(this.timer)
  }

  // 倒计时计算
  getDate (second) {
    let days, hours, mins, sec
    days = Math.floor(second / 86400)
    hours = Math.floor((second / 3600) % 24)
    mins = Math.floor((second / 60) % 60)
    sec = Math.floor(second % 60)
    return { days, hours, mins, sec }
  }
}

