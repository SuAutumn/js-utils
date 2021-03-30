import * as https from 'https'
import * as http from 'http'
import genPromise from '../genPromise.js'
import formatDate from '../formatDate'
import * as fs from 'fs'
import * as os from 'os'

interface RequestOptions extends https.RequestOptions {}

const LOG_FILENAME = './assets/socket-error.txt'
function request(
  url: string,
  options: https.RequestOptions
): Promise<http.IncomingMessage> {
  const { p, success, fail } = genPromise<http.IncomingMessage>()
  const req = https.request(url, options, async (res) => {
    res.on('data', (data) => {
      console.log(data)
    })
    res.on('end', () => {
      console.log('end')
      success(res)
    })
    res.on('close', () => {
      console.log('close')
    })
    try {
      console.log(await getReqBody(res))
      console.log('get body')
    } catch (e) {
      console.log('get body error: ', e)
    }
  })
  req.on('error', fail)
  req.on('socket', (socket) => {
    const now = Date.now()
    const time = formatDate(now, 'HH:mm:ss.S')
    // socket.setEncoding('utf8')
    socket.on('lookup', (_err, address, family, host) => {
      log(
        LOG_FILENAME,
        time,
        (Date.now() - now) / 1000 + 's',
        'lookup',
        address,
        family,
        host
      )
    })
    const eventNameList = ['connect', 'ready', 'close', 'end', 'timeout']
    eventNameList.forEach((name) => {
      socket.on(name, () => {
        log(
          LOG_FILENAME,
          time,
          (Date.now() - now) / 1000 + 's',
          name,
          name === 'close' ? os.EOL : ''
        )
      })
    })
    socket.on('error', (err) => {
      log(
        LOG_FILENAME,
        time,
        (Date.now() - now) / 1000 + 's',
        JSON.stringify(err)
      )
    })
  })
  req.end()
  return p
}
export async function get(
  url: string,
  options?: RequestOptions
): Promise<http.IncomingMessage> {
  return await request(url, { ...options, method: 'GET' })
}

/**
 * 获取请求body数据
 */
function getReqBody(req: http.IncomingMessage): Promise<string> {
  const { p, success, fail } = genPromise<string>()
  let str = ''
  req.setEncoding('utf8')
  req.on('data', (chunk: string) => {
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

function log(filename: string, ...args: Array<string | number>) {
  const s = fs.createWriteStream(filename, { flags: 'a+' })
  s.write(args.join(' ') + os.EOL, (err) => {
    err && console.log('write error', err)
  })
  s.end()
}

get('https://jzt.csehe.com/api/v2/bind_status')
