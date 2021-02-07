import HtmlParser from '../utils/HtmlParser.mjs'

const p = new HtmlParser(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Document</title>
    <script src="./vue.js"></script>
</head>
<body>
<div id="app">
    {{ message }}
    <input type="text" v-model="message"/>
    <input type="file" @change="fileChange">
    <div>
        <img :src="convertImgSrc" alt="">
    </div>
</div>
<script>
  /**
   * 获取视频第一帧图片
   */
  const data = {
    message: 'hello vue',
    convertImgSrc: ''
  }
  // for (let k in data) {
  //   if (data.hasOwnProperty(k)) {
  //     let val = data[k]
  //     Object.defineProperty(data, k, {
  //       get() {
  //         console.log('get invoke')
  //         return val
  //       },
  //       set(value) {
  //         console.log('set invoke')
  //         val = value
  //       },
  //     })
  //   }
  // }
  var app = new Vue({
    el: '#app',
    data,
    updated(newVal, oldVal) {
      console.log(newVal)
      console.log(oldVal)
    },
    methods: {
      fileChange(e) {
        console.log(e.target.files)
        const file = e.target.files[0]
        const video = document.createElement('video')
        video.src = URL.createObjectURL(file)
        // 自动加载 才可以获取到图片
        video.setAttribute("preload", 'auto')
        video.setAttribute("style", "position: absolute; opacity: 0;z-index: -1; top: -9999px;")
        this.$el.appendChild(video)
        video.addEventListener('loadeddata', () => {
          const canvas = document.createElement('canvas')
          if (video.offsetWidth > video.offsetHeight) {
            canvas.width = 200
          } else {
            canvas.width = 100
          }
          canvas.height = Math.floor(canvas.width * video.offsetHeight / video.offsetWidth)
          console.log(video.offsetWidth, video.offsetHeight, canvas.width, canvas.height)
          canvas.getContext('2d').drawImage(video, 0, 0, video.offsetWidth, video.offsetHeight, 0, 0, canvas.width, canvas.height)
          console.log(this.convertImgSrc = canvas.toDataURL('image/jpeg'))
        })
      },
    },
  })
</script>
</body>
</html>

<div><span>hello span</div>
`)

console.log(JSON.stringify(p.exec()))
