enum State {
  OpenProtocol = 'OpenProtocol',
  OpenProtocolSlash = 'OpenProtocolSlash',
  OpenHost = 'OpenHost',
  OpenPath = 'OpenPath',
  OpenHash = 'OpenHash',
  OpenSearch = 'OpenSearch',
  End = 'End',
}

enum Chars {
  Colon = ':'.charCodeAt(0),
  Slash = '/'.charCodeAt(0),
  Hash = '#'.charCodeAt(0),
  Search = '?'.charCodeAt(0),
  Zero = '0'.charCodeAt(0),
  Nine = '9'.charCodeAt(0),
}

export enum Token {
  Literal = 'Literal',
  Protocol = 'Protocol',
  ProtocolSlash = 'ProtocolSlash',
  Host = 'Host',
  Search = 'Search',
  Hash = 'Hash',
  Path = 'Path',
}

export class Tokenize {
  private state: State
  private char = 0
  private readonly input: string
  private length: number
  private index = 0
  private sectionStart = 0
  private nodes = <
    { value: string; start: number; end: number; type: Token }[]
  >[]

  constructor(input: string) {
    this.input = input
    this.length = this.input.length
    this.state = State.OpenProtocol
  }

  tokenize() {
    while (this.index < this.length) {
      this.char = this.input.charCodeAt(this.index)
      switch (this.state) {
        case State.OpenProtocol:
          this.openProtocolParser()
          break
        case State.OpenProtocolSlash:
          this.openProtocolSlashParser()
          break
        case State.OpenHost:
          this.openHostParser()
          break
        case State.OpenPath:
          this.openPathParser()
          break
        case State.OpenHash:
          this.openHashParser()
          break
        case State.OpenSearch:
          this.openSearchParser()
          break
      }
      this.index++
    }
    return this.nodes
  }

  openProtocolParser() {
    if (this.char === Chars.Colon) {
      this.handleToken(Token.Protocol, State.OpenProtocolSlash)
    }
  }

  openProtocolSlashParser() {
    if (this.char !== Chars.Colon && this.char !== Chars.Slash) {
      this.handleToken(Token.ProtocolSlash, State.OpenHost)
    }
  }

  openHostParser() {
    if (this.index === this.length - 1) {
      return this.handleToken(Token.Host, State.End, this.index + 1)
    }
    let state: State | undefined
    switch (this.char) {
      case Chars.Slash:
        state = State.OpenPath
        break
      case Chars.Search:
        state = State.OpenSearch
        break
      case Chars.Hash:
        state = State.OpenHash
        break
    }
    if (state) {
      this.handleToken(Token.Host, state)
    }
  }

  openPathParser() {
    if (this.index === this.length - 1) {
      this.handleToken(Token.Path, State.End, this.index + 1)
    }
    let state: State | undefined
    switch (this.char) {
      case Chars.Search:
        state = State.OpenSearch
        break
      case Chars.Hash:
        state = State.OpenHash
        break
    }
    if (state) {
      this.handleToken(Token.Path, state)
    }
  }

  openHashParser() {
    if (this.index === this.length - 1) {
      this.handleToken(Token.Hash, State.End, this.index + 1)
    }
    let state: State | undefined
    switch (this.char) {
      case Chars.Search:
        state = State.OpenSearch
        break
    }
    if (state) {
      this.handleToken(Token.Hash, state)
    }
  }

  openSearchParser() {
    if (this.index === this.length - 1) {
      this.handleToken(Token.Search, State.End, this.index + 1)
    }
  }

  handleToken(token: Token, newState: State, index = this.index) {
    const value = this.input.substring(this.sectionStart, index)
    this.nodes.push({
      value,
      start: this.sectionStart,
      end: index - 1,
      type: token,
    })
    this.sectionStart = this.index
    this.state = newState
  }

  throwError() {
    throw new SyntaxError(`
    Unexpected token "${this.input.charAt(this.index)}" at ${
      this.index
    } when parse ${this.state}
    `)
  }
}

export default class UrlParser {
  private readonly input: string
  private tokenize: Tokenize['nodes']

  constructor(input: string) {
    this.input = input
    this.tokenize = new Tokenize(this.input).tokenize()
  }

  private getValue(type: Token) {
    const r = this.tokenize.filter((item) => item.type === type)
    if (r.length > 0) return r[0].value
    return ''
  }

  getProtocol() {
    return this.getValue(Token.Protocol)
  }

  getHost() {
    return this.getValue(Token.Host).split(':')[0]
  }

  getPort() {
    return this.getValue(Token.Host).split(':')[1]
  }

  getPath() {
    return this.getValue(Token.Path)
  }

  getHash() {
    return this.getValue(Token.Hash).slice(1)
  }

  getSearch() {
    const s = this.getValue(Token.Search).slice(1)
    const r = <Record<string, string>>{}
    if (s) {
      s.split('&').forEach((item) => {
        const [name, value] = item.split('=')
        r[name] = value
      })
    }
    return r
  }
}
