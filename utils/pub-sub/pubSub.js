const subscribeQueue = {}
let uid = 0

const PRE_KEY = 'uid_'
const PRE_KEY_LENGTH = PRE_KEY.length

function hasOwnProperty(obj, prop) {
  if (obj === undefined || obj === null) {
    return false
  }
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export default Object.freeze({
  /**
   * 发布消息
   * @param {string} message 发布消息名称
   * @param {any} data 回调入参
   * @returns void
   */
  publish(message, data) {
    if (!hasOwnProperty(subscribeQueue, message)) return
    const handlers = subscribeQueue[message]
    /** 按加入的顺序执行 */
    Object.keys(handlers)
      .sort((a, b) => {
        return a.slice(PRE_KEY_LENGTH) - b.slice(PRE_KEY_LENGTH)
      })
      .forEach((uid) => {
        handlers[uid](data)
      })
  },
  /**
   * 订阅消息
   * @param {string} message 订阅消息名称
   * @param {function} cb 回调处理
   * @returns string
   */
  subscribe(message, cb) {
    if (typeof cb !== 'function') return
    if (!hasOwnProperty(subscribeQueue, message)) {
      subscribeQueue[message] = {}
    }
    const key = PRE_KEY + uid++
    subscribeQueue[message][key] = cb

    return key
  },
  /**
   * 订阅void
   * @param {string} message 订阅消息名称
   * @param {function} cb 回调处理
   * @returns void
   */
  subscribeOnce(message, cb) {
    const uid = this.subscribe(message, (data) => {
      this.unsubscribe(message, uid)
      cb(data)
    })
  },
  /**
   * 取消订阅
   * @param {string} message 消息名称
   * @param {string|function} token uid，或者订阅处理函数
   * @returns void
   */
  unsubscribe(message, token) {
    if (!hasOwnProperty(subscribeQueue, message)) return false
    if (!token) {
      /** 删除所有该消息处理函数 */
      return delete subscribeQueue[message]
    }

    const subItem = subscribeQueue[message]

    if (typeof token === 'string') {
      /** 删除uid的处理函数 */
      return hasOwnProperty(subItem, token) ? delete subItem[token] : false
    }

    if (typeof token === 'function') {
      let r = false
      for (const uid in subItem) {
        if (subItem[uid] === token) {
          /** 未作返回处理，是因为需要遍历完整个subscribeQueue，删除所有相关fun */
          r = delete subItem[uid]
        }
      }
      return r
    }
    return false
  },
})
