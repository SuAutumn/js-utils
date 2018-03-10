// js中判断一个对象是否是构造函数的实例，通过检查隐形属性实现
function _instanceof (obj, fun) {
  while (obj) {
    let proto = obj.__proto__
    if (proto === fun.prototype) {
      return true
    } else {
      obj = proto
    }
  }
  return false
}

module.exports = _instanceof
