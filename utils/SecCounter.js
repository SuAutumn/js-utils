export default class SecCounter {
  constructor() {
    this.timer = undefined
  }

  // 启动倒计时
  countStart(second, resolve) {
    if (typeof second !== 'number') {
      throw new TypeError(
        'SecCounter: (second, resolve) second param is not a number'
      )
    }
    second = Math.max(parseInt(second), 0)
    resolve(SecCounter.getDate(second))
    this.timer = setInterval(() => {
      if (second > 0) {
        second--
        resolve(SecCounter.getDate(second))
        second === 0 && this.countStop()
      } else {
        this.countStop()
      }
    }, 1000)
  }

  // 关闭倒计时
  countStop() {
    this.timer && clearInterval(this.timer)
  }

  // 倒计时计算
  static getDate(second) {
    const days = Math.floor(second / 86400)
    const hours = Math.floor((second / 3600) % 24)
    const mins = Math.floor((second / 60) % 60)
    const sec = Math.floor(second % 60)
    return { days, hours, mins, sec }
  }
}
