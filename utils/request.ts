import * as https from 'https'
import * as http from 'http'
import genPromise from './genPromise.js'

interface RequestOptions extends https.RequestOptions {}

interface Response<T> {
  data: T
  status?: number
  message?: string
}
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

get('https://weibo.com/u/1300419694?is_all=1', {
  headers: {
    cookie: [
      'SUB=_2A25NNyDoDeRhGeNJ61QW-SvNwzqIHXVuRRUgrDV8PUNbmtAfLXf_kW9NSBXBn1Yh9I4ChnnjfQMok6Du54vfVjhR',
      'SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WF0fmhMbsPYJ77qT22HzsTo5NHD95QfS05cS0.feKncWs4Dqcj1-NHWUPxfdgREeh2feh.t',
    ].join(';'),
  },
})
  .then((res) => {
    console.log(res.data.length, ' ', Buffer.from(res.data).length, 'B')
  })
  .catch((e) => {
    console.log(e)
  })
