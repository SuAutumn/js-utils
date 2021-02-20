// 日期格式化
const days = ['日', '一', '二', '三', '四', '五', '六']
export default function (date, fmt) {
  if (typeof date === 'string') date = date.replace(/-/g, '/')
  if (typeof date === 'number' || typeof date === 'string') {
    date = new Date(date)
  }
  if (date instanceof Date) {
    var o = {
      'M+': date.getMonth() + 1, // 月份
      'd+': date.getDate(), // 日
      'H+': date.getHours(), // 小时
      'm+': date.getMinutes(), // 分
      's+': date.getSeconds(), // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
      S: date.getMilliseconds(), // 毫秒
      D: days[date.getDay()], // 星期
    }
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        date
          .getFullYear()
          .toString()
          .substr(4 - RegExp.$1.length)
      )
    }
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1
            ? o[k]
            : ('00' + o[k]).substr(('' + o[k]).length)
        )
      }
    }
    return fmt
  }
  return ''
}
