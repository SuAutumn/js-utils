import * as https from 'https'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { fileURLToPath } from 'url'

import HtmlParser from '../dist/mjs/HtmlParser.mjs'
import formatDate from '../dist/mjs/formatDate.mjs'
import simpleDiff from '../dist/mjs/simpleDiff.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STARTS = path.resolve(__dirname, 'starts.json')

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
            'SUB=_2A25NNyDoDeRhGeNJ61QW-SvNwzqIHXVuRRUgrDV8PUNbmtAfLXf_kW9NSBXBn1Yh9I4ChnnjfQMok6Du54vfVjhR',
            'SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WF0fmhMbsPYJ77qT22HzsTo5NHD95QfS05cS0.feKncWs4Dqcj1-NHWUPxfdgREeh2feh.t',
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
    const stream = fs.createWriteStream(filename, { flags: 'a+' })
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
  }

  /**
   * @returns {Promise<HtmlParser>}
   */
  async init() {
    const chunk = await Html.getHtmlFromUrl(this.url)
    this.htmlParser.setHtml(chunk)
    return this.htmlParser
  }
}

class WeiboHtml {
  static SCRIPT_CONTENT = 'pl.content.homeFeed.index'
  static SCRIPT_DOM_ID = 'Pl_Official_MyProfileFeed'
  constructor(node) {
    this.htmlJson = null
    this.getHtml(node)
    this.isNoWbDetail = true // 没有微博内容
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
   * 判断是否是内容js
   */
  isContent() {
    if (this.htmlJson && this.htmlJson.ns) {
      return (
        this.htmlJson.ns === WeiboHtml.SCRIPT_CONTENT &&
        this.htmlJson.domid.indexOf(WeiboHtml.SCRIPT_DOM_ID) === 0
      )
    }
    return false
  }

  htmlParser() {
    const json = this.htmlJson
    const infoList = []
    if (json && json.html) {
      const cp = new HtmlParser(json.html)
      cp.$on('onClosedTag', ({ node }) => {
        if (node.attrs.class === 'WB_detail') {
          this.isNoWbDetail = false
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
let targetList = getTargetFromFile(STARTS)
fs.watchFile(STARTS, () => {
  targetList = getTargetFromFile(STARTS) || targetList
  console.log(targetList)
})
function listener() {
  // console.log('时间: ', formatDate(new Date(), 'MM-dd HH:mm:ss'))
  logger()
  for (let i = 0; i < targetList.length; i++) {
    const target = targetList[i]
    const h = new Html(target)
    const now = Date.now()
    let netTime = 0
    let handleTime = 0
    let html = ''
    h.init()
      .then((p) => {
        netTime = Date.now()
        html = p.html
        p.$on('onClosedTag', ({ node }) => {
          if (node.isScript()) {
            node.children.forEach((child) => {
              const w = new WeiboHtml(child)
              if (w.isContent()) {
                const infoList = w.htmlParser()
                if (!w.isNoWbDetail) {
                  if (target.list instanceof Array) {
                    const diffResult = simpleDiff(
                      infoList,
                      target.list,
                      (info) => {
                        if (info) {
                          return info.timestamp
                        }
                      }
                    )
                    const title = `record time:${formatDate(
                      Date.now(),
                      'yyyy-MM-dd HH:mm:ss.S'
                    )} new ${infoList.length} old ${target.list.length}${
                      os.EOL
                    }`
                    if (diffResult.length > 0) {
                      Html.write(
                        './assets/weibo-' + target.name + '.txt',
                        title +
                          JSON.stringify(infoList) +
                          os.EOL +
                          JSON.stringify(target.list) +
                          os.EOL +
                          os.EOL
                      )
                      // 忽略列表末尾删除的情况
                      while (
                        lastEle(diffResult).data === lastEle(target.list)
                      ) {
                        diffResult.pop()
                        target.list.pop()
                        if (diffResult.length === 0) break
                      }
                    }
                    if (diffResult.length > 0) {
                      const content = diffResult
                        .map((item) => {
                          return `----${item.type}----${os.EOL}${
                            item.data.nickname
                          } ${formatDate(
                            Number(item.data.timestamp),
                            'yyyy-MM-dd HH:mm:ss.S'
                          )}${os.EOL}${item.data.content}${os.EOL}${os.EOL}`
                        })
                        .join('')
                      Html.write('./assets/diff.txt', title + content)
                      // h.write(title + content)
                    }
                  }
                  target.list = infoList
                }
              }
            })
          }
        })
        p.exec()
        handleTime = Date.now()
      })
      .catch((e) => {
        Html.write(
          './assets/weibo-error.txt',
          `时间${formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss.S')}${os.EOL}${
            e.message
          }${os.EOL}${e.stack} ${h.url} ${os.EOL}${os.EOL}`
        )
      })
      .finally(() => {
        if (netTime - now > 1000 * 8) {
          const content = `[time]${target.name}: total ${
            (Date.now() - now) / 1000
          }s, net time ${(netTime - now) / 1000}s, handle time ${
            (handleTime - netTime) / 1000
          }s.${os.EOL}`
          Html.write('./assets/log.txt', content)
          // Html.write(
          //   `./assets/log-${target.name}-${genRandomString()}.txt`,
          //   content + html
          // )
        }
      })
  }
}
// let count = 0
function main() {
  listener()
  setTimeout(main, 1000 * 5)
}

main()

function calc(data) {
  return Math.round((data / 1024 / 1024) * 100) / 100 + ' MB'
}
function logger() {
  const mem = process.memoryUsage()
  console.log(
    formatDate(new Date(), 'HH:mm:ss.S'),
    'memory now:',
    calc(mem.rss)
  )
}

function getTargetFromFile(filename) {
  const content = fs.readFileSync(filename, { encoding: 'utf8' })
  try {
    return JSON.parse(content)
  } catch (e) {
    console.log('解析' + filename + '出错')
  }
  return []
}
