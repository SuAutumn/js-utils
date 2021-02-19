import * as https from 'https'
import * as fs from 'fs'

import HtmlParser from '../dist/mjs/HtmlParser.mjs'

function getPromise() {
  let success, fail
  const p = new Promise((resolve, reject) => {
    success = resolve
    fail = reject
  })
  return { p, success, fail }
}

function genRandomString(len = 5) {
  const charts =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let r = ''
  for (let i = 0; i < len; i++) {
    r += charts.charAt(parseInt(Math.random() * 61))
  }
  return r
}

function lastEle(arr = []) {
  return arr[arr.length - 1]
}
/**
 * 获取str在text中位置
 * @param text {string}
 * @param str {string}
 */
function indexOf(text, str) {
  let start = 0
  const len = text.length
  while (start < len) {
    const c = text.charAt(start)
    if (c === str) {
      break
    }
    start++
  }
  return start
}

function lastIndexOf(text, str) {
  let end = text.length
  while (end > 0) {
    const c = text.charAt(end - 1)
    if (c === str) {
      break
    }
    end--
  }
  return end
}

class Html {
  constructor({ url, output }) {
    this.url = url
    this.output = output
    this.htmlParser = new HtmlParser()
  }

  static getHtmlFromUrl(url) {
    const { p, success, fail } = getPromise()
    const client = https.get(
      url,
      {
        headers: {
          cookie: [
            'SUB=_2AkMXQYC5f8NxqwJRmf4dzGPkbo12ygjEieKhHXFiJRMxHRl-yj9kqk0ptRB6PMGuVq7H-O4K7ITLAPE_ds8W7ki7H1Am',
            'SUBP=0033WrSXqPxfM72-Ws9jqgMF55529P9D9WWgb9FC7MexJpJ4IsmGevLD',
          ].join(';'),
        },
      },
      (res) => {
        res.setEncoding('utf8') // 指定缓冲数据编码
        let chunk = ''
        res.on('data', (text) => {
          chunk += text
        })
        res.on('end', () => {
          success(chunk)
        })
      }
    )
    client.on('abort', () => {
      fail(new Error('请求被取消'))
      // console.log('请求被取消')
    })
    client.on('error', (err) => {
      fail(err)
      // console.log(err)
    })
    return p
  }

  static write(filename, data) {
    const { p, success, fail } = getPromise()
    const stream = fs.createWriteStream(filename)
    stream.write(data, 'utf8', (err) => {
      err && fail(err)
    })
    stream.on('error', fail)
    stream.end(success)
    return p
  }

  /**
   * 写入文件
   * @param data {string} - 内容
   */
  async write(data) {
    await Html.write(this.output, data)
    console.log('write done')
  }

  /**
   * @returns {Promise<HtmlParser>}
   */
  async init() {
    try {
      const chunk = await Html.getHtmlFromUrl(this.url)
      this.htmlParser.setHtml(chunk)
    } catch (e) {
      console.log(e)
    }
    return this.htmlParser
  }
}

// const v2ex = new Html({
//   url: 'https://www.v2ex.com/',
//   output: './assets/v2ex.json',
// })
// v2ex
//   .init()
//   .then(async (p) => {
//     let i = 1
//     p.$on('onClosedTag', ({ node }) => {
//       if (node.attrs.class === 'avatar') {
//         // console.log(node.attrs.src)
//       }
//       if (node.attrs.class === 'topic-link') {
//         console.log(i++, '', node.children[0].getName())
//         console.log()
//       }
//     })
//     await v2ex.write()
//     console.log('完成')
//   })
//   .catch((e) => console.log('v2ex error: ', e))

class WeiboHtml {
  static SCRIPT_CONTENT = 'pl.content.homeFeed.index'
  constructor(node) {
    this.htmlJson = null
    this.getHtml(node)
  }

  /**
   * 从js字符串中提取json字符串
   * @param node {HtmlNode}
   */
  getHtml(node) {
    if (node.isTextNode()) {
      const text = node.getName()
      const start = indexOf(text, '{')
      const end = lastIndexOf(text, '}')
      try {
        this.htmlJson = JSON.parse(text.slice(start, end))
      } catch (e) {}
    }
  }

  /**
   * 检查是否含有内容
   */
  isContent(json) {
    return json.ns && json.ns === WeiboHtml.SCRIPT_CONTENT
  }

  htmlParser() {
    const json = this.htmlJson
    const infoList = []
    if (json && this.isContent(json) && json.html) {
      const cp = new HtmlParser(json.html)
      cp.$on('onClosedTag', ({ node }) => {
        if (node.attrs.class === 'WB_detail') {
          const info = this.getWeibo(node)
          infoList.push(info)
        }
      })
      try {
        cp.exec()
      } catch (e) {
        Html.write('./assets/weibo-' + genRandomString() + '.html', json.html)
      }
    }
    return infoList
  }

  getContent(node) {
    let text = ''
    if (node.isTextNode()) {
      text = node.getName().trim()
    }
    if (node.getName() === 'img') {
      text += this.handleImgTag(node)
    }
    if (node.getName() === 'br') {
      text = '\n'
    }
    if (node.getName() === 'i') {
      // ignore <i> element
      return text
    }
    node.children.forEach((n) => {
      text += this.getContent(n)
    })
    return text
  }

  handleImgTag(node) {
    return node.attrs.title || ''
  }

  /**
   * 获取微博正文内容
   * @param node {HtmlNode}
   */
  getWeibo(node) {
    const info = {}
    const nickname = node.querySelect(
      (n) => 'WB_info'.indexOf(n.attrs.class) > -1
    )
    if (nickname) {
      info.nickname = this.getContent(nickname)
    }
    const date = node.querySelect(
      (n) => n.attrs['node-type'] === 'feed_list_item_date'
    )
    if (date) {
      info.date = date.attrs.title
      info.timestamp = date.attrs.date
    }
    const content = node.querySelect(
      (n) => n.attrs['node-type'] === 'feed_list_content'
    )
    if (content) {
      info.content = this.getContent(content)
    }
    const expand = node.querySelect(
      (n) => 'WB_feed_expand'.indexOf(n.attrs.class) > -1
    )
    if (expand) {
      const relative = this.getRelativeWeibo(expand)
      if (relative) {
        info.relative = relative
      }
    }
    return info
  }

  getRelativeWeibo(node) {
    const info = {}
    const nickname = node.querySelect(
      (n) => 'WB_info'.indexOf(n.attrs.class) > -1
    )
    if (nickname) {
      info.nickname = this.getContent(nickname)
    }
    const reason = node.querySelect(
      (n) => n.attrs['node-type'] === 'feed_list_reason'
    )
    if (reason) {
      info.content = this.getContent(reason)
    }
    return info
  }
}
async function main() {
  const targetList = [
    {
      url: 'https://weibo.com/u/1350995007?is_all=1',
      output: './assets/weibo-naza.json',
    },
    {
      url: 'https://weibo.com/u/1669879400?is_all=1',
      output: './assets/weibo-reba.json',
    },
    {
      url: 'https://weibo.com/yangmiblog?is_all=1',
      output: './assets/weibo-yangmi.json',
    },
    {
      url: 'https://weibo.com/u/1809054937',
      output: './assets/weibo-liqing.json',
    },
  ]

  for (let i = 0; i < targetList.length; i++) {
    const h = new Html(targetList[i])
    // try {
    //   console.time(i)
    //   const p = await h.init()
    //   p.$on('onClosedTag', ({ node }) => {
    //     if (node.isScript()) {
    //       node.children.forEach((child) => {
    //         const w = new WeiboHtml(child)
    //         const infoList = w.htmlParser()
    //         if (infoList.length > 0) {
    //           h.write(JSON.stringify(infoList))
    //         }
    //       })
    //     }
    //   })
    //   p.exec()
    //   console.timeEnd(i)
    // } catch (e) {
    //   console.log('weibo error: ', e)
    // }
    h.init().then((p) => {
      p.$on('onClosedTag', ({ node }) => {
        if (node.isScript()) {
          node.children.forEach((child) => {
            const w = new WeiboHtml(child)
            const infoList = w.htmlParser()
            if (infoList.length > 0) {
              h.write(JSON.stringify(infoList))
            }
          })
        }
      })
      p.exec()
    })
  }
}

main()
