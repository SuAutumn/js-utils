import * as https from 'https'
import * as http from 'http'
import genPromise from '../genPromise.js'
import formatDate from '../formatDate'
import * as fs from 'fs'
import * as os from 'os'

interface RequestOptions extends https.RequestOptions {}

interface Response<T> {
  data: T
  status?: number
  message?: string
}

const LOG_FILENAME = './assets/socket-error.txt'
function request(
  url: string,
  options: https.RequestOptions
): Promise<Response<string>> {
  const { p, success, fail } = genPromise<Response<string>>()
  const response: Response<string> = { data: '' }
  const req = https.request(url, options, async (res) => {
    response.status = res.statusCode
    res.on('end', () => success(response))
    try {
      response.data = await getReqBody(res)
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
  options: RequestOptions
): Promise<Response<string>> {
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

function _test() {
  get('https://weibo.com/u/1300419694?is_all=1', {
    headers: {
      cookie: [
        'SUB=_2A25NNyDoDeRhGeNJ61QW-SvNwzqIHXVuRRUgrDV8PUNbmtAfLXf_kW9NSBXBn1Yh9I4ChnnjfQMok6Du54vfVjhR',
        'SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WF0fmhMbsPYJ77qT22HzsTo5NHD95QfS05cS0.feKncWs4Dqcj1-NHWUPxfdgREeh2feh.t',
      ].join(';'),
    },
    rejectUnauthorized: false,
  })
    .then((res) => {
      console.log(res.data.length, Buffer.from(res.data).length / 1024 + 'kb')
    })
    .catch((e: Error) => {
      console.log(e)
    })
  setTimeout(_test, 3 * 1000)
}

_test()
