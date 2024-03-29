/* eslint-disable prefer-promise-reject-errors */
// eslint-disable-next-line no-new
new Promise((resolve, reject) => {
  // 由于跨域问题，使用<script>加载
  const script = document.createElement('script')
  script.src = 'https://res.wx.qq.com/open/js/jweixin-1.2.0.js'
  document.head.appendChild(script)
  script.onload = function () {
    resolve()
  }
  script.onerror = function () {
    reject()
  }
})
