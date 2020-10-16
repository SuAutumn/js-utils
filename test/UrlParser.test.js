import UrlParser, { Tokenize } from '../utils/UrlParser'
describe('tset url parser', () => {
  describe('test token', () => {
    it('url: https://wwww.baidu.com:443', () => {
      const input =
        'https://www.baidu.com:443/path1/path2/#/test1/test2?hello=world&name'
      const tokenize = new Tokenize(input).tokenize()
      expect(tokenize instanceof Array).toBeTruthy()
      expect(tokenize[0].value).toEqual('https')
      expect(tokenize[1].value).toEqual('://')
      expect(tokenize[2].value).toEqual('www.baidu.com:443')
      expect(tokenize[3].value).toEqual('/path1/path2/')
      console.log(tokenize)
    })
    it('test', () => {
      const input =
        'https://prettier.io/playground/#N4Igxg9gdgLgprEAuc0DOMAEAjOcAOmAvJsADpSY4QT5KYAUAlMQHykVVUBOcMArt0rlKXKtgCGAL3rM2pAL6cuCgNzKlUNRQq4CAOmw18zQ9IYByAGY0LAGmUixaCAFs49J1xgALAJZQAOaeymJUUHAYcAAm9DDc-HChKhoaDlDAmBJQEL5w3J6YvgHBRQlwmAqV6XJE7MAKTOpQFFb8UGAwftBZjCxevAJCmBYSFhQKIHYgtF3oyKAS3NwQAO4ACksIaMggEgA2qxIAnjvT2NwSYADWfADK+FclyPGJ03CuuNHRMQAy2YF+BJAnAAGIQbiuCQwLpBXYSfgwCBTEA+GCufYAdX88DQjzAcDu2z8XQAbiTjrswGgziAAmh8jB1pdAlDkFYDgzpgArNAADwAQpcbvcJO5fgE4OzOXAefy7iV9nAAIr8XJSpAc-ZckCPbgM7i7SS4fYo-DcAIwTF+aK+ZAADgADNNzRAGZjLvhdubIvlSVLpgBHNXwZm0HYoCRoAC0ERiMRRvGDfl4zOBbM1MumDNcfml2tlIDQipVIY1r0LMAk2Gttp8yAATNN4hI-PsSgBhNwZkCRACsKP4DIAKtWI1qdaTEgBJKA-WB3MAW-AwACCc7uMGOSvzOqjMF3heiEDAh+mEER+ERDcPCgUQA'
      const tokenize = new Tokenize(input).tokenize()
      expect(tokenize instanceof Array).toBeTruthy()
      console.log(tokenize)
    })
  })

  describe('test url parser', () => {
    it('test', () => {
      const input =
        'https://www.baidu.com:443/path1/path2/#/test1/test2?hello=world&name'
      const urlParser = new UrlParser(input)
      console.log(
        urlParser.getProtocol(),
        urlParser.getHost(),
        urlParser.getPort(),
        urlParser.getPath(),
        urlParser.getHash(),
        urlParser.getSearch()
      )
    })
  })
})
