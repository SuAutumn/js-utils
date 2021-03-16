import * as http from 'http'
import * as os from 'os'
import * as fs from 'fs'
import * as url from 'url'
import formatDate from '../dist/mjs/formatDate.mjs'

const serve = http.createServer(async (req, res) => {
  logger()
  req.setEncoding('utf8')
  // console.log(req.headers)
  try {
    const bodyStr = await getReqBody(req)
    let content = `${formatDateNow()}${os.EOL}${req.url} ${getReqHeaderValue(
      req,
      'content-type'
    )}${os.EOL}`
    if (bodyStr.length > 0) {
      content += `${JSON.stringify(bodyStr)}${os.EOL}${os.EOL}`
    } else {
      content += os.EOL
    }
    write('./assets/remote-log.txt', content)
  } catch (e) {
    write(
      './assets/remote-log-error.txt',
      `${formatDateNow()}${os.EOL}${req.url}${os.EOL}${e.message}${os.EOL}${
        e.stack
      }${os.EOL}${os.EOL}`
    )
  }
  res.statusCode = 200
  let origin = '*'
  if (req.headers.referer) {
    origin = new url.URL(req.headers.referer).origin
  }
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end('done.')
})

serve.listen(3000)

console.log('serve run at port 3000, CTRL + D stop it.')

/**
 * 写入文件
 * @param {string} filename - 文件路径
 * @param {string} data - 内容
 */
function write(filename, data) {
  const s = fs.createWriteStream(filename, { flags: 'a+' })
  s.write(data, 'utf8', (err) => {
    if (err) {
      console.log(err)
    }
  })
  s.end()
}

function genPromise() {
  let success, fail
  const p = new Promise((resolve, reject) => {
    success = resolve
    fail = reject
  })
  return { p, success, fail }
}

/**
 * 获取请求body数据
 * @param {http.IncomingMessage} req - 客户端请求
 */
function getReqBody(req) {
  const { p, success, fail } = genPromise()
  let str = ''
  req.on('data', (/** @type string */ chunk) => {
    str += chunk
  })
  req.on('end', () => {
    success(str)
  })
  req.on('error', (e) => {
    fail(e)
  })
  return p
}

/**
 * 获取请求content-type
 * @param {http.IncomingMessage} req - 客户端请求
 * @param {string} key - headers key
 */
function getReqHeaderValue(req, key) {
  return req.headers[key]
}

function formatDateNow() {
  return formatDate(Date.now(), 'yyyy-MM-dd HH:mm:ss.S')
}

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
