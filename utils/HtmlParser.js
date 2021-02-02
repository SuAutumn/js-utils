export default class HtmlParser {
  /**
   * @param html {string}
   */
  constructor(html) {
    this.setHtml(html)
    this.node = null // 子node
    this.parentNodeStack = [] // 父node stack 用于关联父子关系
    this.text = '' // current text
    this.tree = [] // 解析之后的树结构
    this.cbs = {}
  }

  $on(eventName, cb) {
    this.cbs[eventName] = cb
  }

  // 支持事件 onClosedTag
  $emit(eventName, params) {
    if (typeof this.cbs[eventName] === 'function') {
      this.cbs[eventName](params)
    }
  }

  /**
   * 初始化状态
   * @param html {string} - raw html text
   */
  setHtml(html) {
    this.html = html
    this.status = this.initState(this.html)
    this.offset = 0
    this.length = this.html.length
  }

  initState(html) {
    if (html.charAt(0) === '<') {
      return State.OpenTag
    } else {
      return State.Text
    }
  }

  handleOpenTag(c) {
    if (c === '<') {
      this._start = this.offset // 记录起始位置
    } else if (c === '!') {
      if (this.nextChar() === 'D') {
        this.status = State.OpenDoctype
      }
      if (this.nextChar() === '-') {
        this.status = State.OpenCommentTag
      }
    } else if (c === '/') {
      // </div>
      this.status = State.BeforeCloseTag
      this.backOffset()
    } else if (HtmlParser.isAlphaChar(c)) {
      // a-z
      this.status = State.OpenTagName
      this.backOffset()
    } else if (HtmlParser.isWhiteSpace(c)) {
      // <    > ignore
    }
  }

  handleOpenTagName(c) {
    if (HtmlParser.isAlphaChar(c)) {
      this.status = State.OpeningTagName
      this.backOffset()
    }
  }

  handleOpeningTagName(c) {
    if (HtmlParser.isWhiteSpace(c) || c === '>' || c === '/') {
      // <div ...>
      this.status = State.ClosedTagName
      this.backOffset()
    } else {
      // 记录字符
      this.setTextByChar(c)
    }
  }

  handleClosedTagName(c) {
    this.node = new HtmlNode(this._start, this.html)
    this.node.setName(this.text)
    this.node.setTypeEle()
    this.resetText()
    this.status = State.BeforeOpenAttributeName
    this.backOffset()
    // 添加层级关系
    if (this.parentNodeStack.length > 0) {
      this.parentNodeStack[this.parentNodeStack.length - 1].children.push(
        this.node
      )
    }
    this.parentNodeStack.push(this.node)
  }

  handleBeforeOpenAttributeName(c) {
    // <div class="..." style="...">
    if (HtmlParser.isWhiteSpace(c)) {
      // ignore
    } else if (c === '/') {
      // <div/>
      this.status = State.BeforeCloseTag
      this.backOffset()
    } else if (c === '>') {
      // <div>
      this.status = State.ClosingTag
      this.backOffset()
    } else {
      this.status = State.OpeningAttributeName
      this.backOffset()
    }
  }

  handleOpeningAttributeName(c) {
    if (HtmlParser.isWhiteSpace(c) || c === '=' || c === '/' || c === '>') {
      this.status = State.ClosedAttributeName
      this.backOffset()
    } else {
      // 记录字符
      this.setTextByChar(c)
    }
  }

  handleClosedAttributeName(c) {
    this.node.setAttrName(this.text)
    this.resetText()
    if (HtmlParser.isWhiteSpace(c)) {
      // <div class style="...">
      this.status = State.BeforeOpenAttributeName
      this.backOffset()
    } else if (c === '=') {
      this.status = State.BeforeOpenAttributeValue
      this.backOffset()
    } else if (c === '/') {
      this.status = State.BeforeCloseTag
      this.backOffset()
    } else if (c === '>') {
      this.status = State.ClosingTag
      this.backOffset()
    }
  }

  handleBeforeOpenAttributeValue(c) {
    if (this._quot) {
      this.status = State.OpeningAttributeValue
      this.backOffset()
    } else if (HtmlParser.isWhiteSpace(c) || c === '=') {
      // ignore
    } else if (c === '"' || c === "'") {
      this._quot = c
    } else {
      this.status = State.OpeningAttributeValue
      this.backOffset()
    }
  }

  handleOpeningAttributeValue(c) {
    // class="xxxx"
    if (this._quot) {
      if (c === this._quot) {
        this.status = State.ClosingAttributeValue
        this.backOffset()
        this._quot = undefined
      } else {
        this.setTextByChar(c)
      }
    } else if (HtmlParser.isWhiteSpace(c) || c === '/' || c === '>') {
      // class=xxxx
      this.status = State.ClosingAttributeValue
      this.backOffset()
    } else {
      this.setTextByChar(c)
    }
  }

  handleClosingAttributeValue(c) {
    this.node.setAttrValue(this.text)
    this.resetText()
    this.status = State.ClosedAttributeValue
    this.backOffset()
  }

  handleClosedAttributeValue(c) {
    if (HtmlParser.isWhiteSpace(c)) {
      this.status = State.BeforeOpenAttributeName
    } else if (c === '/') {
      // <div/>
      this.status = State.BeforeCloseTag
      this.backOffset()
    } else if (c === '>') {
      // <div>
      this.status = State.ClosingTag
      this.backOffset()
    }
  }

  handleBeforeCloseTag(c) {
    this.status = State.ClosingTag
    this.backOffset()
  }

  handleClosingTag(c) {
    if (c === '/') {
      // ignore
      // 收尾
      this._parentNode = this.parentNodeStack.pop()
      if (this.parentNodeStack.length === 0) {
        this.tree.push(this._parentNode)
      }
    } else if (HtmlParser.isWhiteSpace(c)) {
      // ignore
    } else if (c === '>') {
      this.status = State.ClosedTag
      this.backOffset()
    }
  }

  // >
  handleClosedTag(c) {
    if (c === '>') {
      // update end position
      if (this._parentNode) {
        // <div/>
        this._parentNode.setEnd(this.offset, this.html)
        this.$emit('onClosedTag', { node: this._parentNode })
        this._parentNode = null
        this.node = null
      } else {
        // <meta> 检查是否是自闭合标签
        if (this.node.isSelfCloseTag()) {
          // 收尾
          const node = this.parentNodeStack.pop()
          node.setEnd(this.offset, this.html)
          if (this.parentNodeStack.length === 0) {
            this.tree.push(node)
          }
          this.$emit('onClosedTag', { node })
          this.node = null
        }
      }
    } else if (c === '<') {
      this.status = State.OpenTag
      // 回退1
      this.backOffset()
    } else {
      this.status = State.Text
      this.backOffset()
    }
  }

  handleText(c) {
    if (c === this._quot) {
      this._quot = undefined
    } else if (!this._quot && (c === '"' || c === "'")) {
      // 没有设置过 _quote 才可以
      this._quot = c
    }
    if (!this._quot && c === '<') {
      this.node = new HtmlNode(this.offset - this.text.length, this.html)
      this.node.setTypeText()
      this.node.setName(this.text)
      this.node.setEnd(this.offset - 1, this.html)
      this.resetText()
      // 添加层级关系
      if (this.parentNodeStack.length > 0) {
        this.parentNodeStack[this.parentNodeStack.length - 1].children.push(
          this.node
        )
      } else {
        this.tree.push(this.node)
      }
      this.status = State.OpenTag
      // 回退1
      this.backOffset()
    } else {
      this.setTextByChar(c)
    }
  }

  handleOpenDoctype(c) {
    if (c === '>') {
      const node = new HtmlNode(this._start, this.html)
      node.setTypeDoc()
      node.setName(this.html.slice(this._start, this.offset + 1))
      node.setEnd(this.offset, this.html)
      this.status = State.ClosedTag
      this.backOffset()
      // 添加层级关系
      if (this.parentNodeStack.length > 0) {
        this.parentNodeStack[this.parentNodeStack.length - 1].children.push(
          node
        )
      } else {
        this.tree.push(node)
      }
    }
  }

  handleOpenCommentTag(c) {
    if (this.beforeChar() === '-' && c === '>') {
      const node = new HtmlNode(this._start, this.html)
      node.setTypeComment()
      node.setName(this.html.slice(this._start, this.offset + 1))
      node.setEnd(this.offset, this.html)
      this.status = State.ClosedTag
      this.backOffset()
      // 添加层级关系
      if (this.parentNodeStack.length > 0) {
        this.parentNodeStack[this.parentNodeStack.length - 1].children.push(
          node
        )
      } else {
        this.tree.push(node)
      }
    }
  }

  exec() {
    while (this.offset < this.length) {
      const c = this.html.charAt(this.offset)
      switch (this.status) {
        case State.Text:
          this.handleText(c)
          break
        case State.OpenDoctype:
          this.handleOpenDoctype(c)
          break
        case State.OpenCommentTag:
          this.handleOpenCommentTag(c)
          break
        case State.OpenTag:
          this.handleOpenTag(c)
          break
        case State.OpenTagName:
          this.handleOpenTagName(c)
          break
        case State.OpeningTagName:
          this.handleOpeningTagName(c)
          break
        case State.ClosedTagName:
          this.handleClosedTagName(c)
          break
        case State.BeforeOpenAttributeName:
          this.handleBeforeOpenAttributeName(c)
          break
        case State.OpeningAttributeName:
          this.handleOpeningAttributeName(c)
          break
        case State.ClosedAttributeName:
          this.handleClosedAttributeName(c)
          break
        case State.BeforeOpenAttributeValue:
          this.handleBeforeOpenAttributeValue(c)
          break
        case State.OpeningAttributeValue:
          this.handleOpeningAttributeValue(c)
          break
        case State.ClosingAttributeValue:
          this.handleClosingAttributeValue(c)
          break
        case State.ClosedAttributeValue:
          this.handleClosedAttributeValue(c)
          break
        case State.BeforeCloseTag:
          this.handleBeforeCloseTag(c)
          break
        case State.ClosingTag:
          this.handleClosingTag(c)
          break
        case State.ClosedTag:
          this.handleClosedTag(c)
          break
      }
      this.offset++
    }
    if (this.text.length > 0) {
      const node = new HtmlNode(this.offset - this.text.length, this.html)
      node.setName(this.text)
      this.resetText()
      node.setTypeText()
      node.setEnd(this.offset - 1, this.html)
      this.tree.push(node)
    }
    return this.tree.slice(0)
    // console.log(JSON.stringify(this.tree))
  }

  resetText() {
    this.text = ''
  }

  setTextByChar(c) {
    this.text = this.text.concat(c)
  }

  static isAlphaChar(c) {
    const code = c.charCodeAt(0)
    return code >= 97 && code <= 122
  }

  static isWhiteSpace(c) {
    return c === ' ' || c === '\n' || c === '\t'
  }

  setOffset(i) {
    this.offset = i
  }

  // offset 回退1
  backOffset() {
    this.setOffset(this.offset - 1)
  }

  nextChar() {
    return this.html[this.offset + 1]
  }

  beforeChar() {
    return this.html[this.offset - 1]
  }

  toString() {
    let text = ''
    this.tree.forEach((node) => {
      text = text + this.toStringHelper(node)
    })
    return text
  }

  /**
   * @param node {HtmlNode}
   */
  toStringHelper(node) {
    let text = ''
    if (node.isDocNode()) {
      text = node.getName()
    }
    if (node.isCommentNode()) {
      text = node.getName()
    }
    if (node.isTextNode()) {
      text = node.getName()
    }
    if (node.isEleNode()) {
      const name = node.getName()
      const attrs = Object.keys(node.attrs).map((k) => {
        if (node.attrs[k] === true) {
          return k
        } else {
          return `${k}="${node.attrs[k]}"`
        }
      })
      text = '<' + name + (attrs.length > 0 ? ' ' + attrs.join(' ') : '')
      if (node.isSelfCloseTag()) {
        text = text + '/>'
        // over
        return text
      } else {
        text = text + '>'
      }
      // add children
      if (node.children.length > 0) {
        node.children.forEach((n) => {
          text = text + this.toStringHelper(n)
        })
      }
      text = `${text}</${name}>`
    }
    return text
  }
}

class HtmlNode {
  constructor(start, html) {
    // this.html = html
    this.start = start
    this.end = start
    this.name = ''
    this.type = '' // comment element text
    this.attrs = {}
    this._currentAttrName = ''
    this.children = []
  }

  // 单个连接字符
  setName(name) {
    this.name = name
  }

  getName() {
    return this.name
  }

  setAttrName(name) {
    this.attrs[name] = true
    this._currentAttrName = name
  }

  setAttrValue(value) {
    if (this._currentAttrName) {
      this.attrs[this._currentAttrName] = value
    }
  }

  setEnd(end, html) {
    this.end = end
    this.rawText = html.slice(this.start, this.end + 1)
  }

  setStart(start) {
    this.start = start
  }

  setTypeText() {
    this.type = 'text'
  }

  isTextNode() {
    return this.type === 'text'
  }

  setTypeEle() {
    this.type = 'element'
  }

  isEleNode() {
    return this.type === 'element'
  }

  setTypeComment() {
    this.type = 'comment'
  }

  isCommentNode() {
    return this.type === 'comment'
  }

  setTypeDoc() {
    this.type = 'Doctype'
  }

  isDocNode() {
    return this.type === 'Doctype'
  }

  // 自闭合标签
  isSelfCloseTag() {
    return SelfCloseTags.indexOf(this.name) > -1
  }

  // 标签内所有内容按照文本处理
  isKeepInnerText() {
    if (this.name === 'script' || this.name === 'css') {
      return true
    }
  }

  toString() {
    return {
      name: this.name,
      start: this.start,
      end: this.end,
      attrs: this.attrs,
      text: text.slice(this.start, this.end + 1),
    }
  }
}

class State {
  static OpenTag = 0
  static OpenTagName = 1
  static OpeningTagName = 2
  static ClosedTagName = 3

  static BeforeOpenAttributeName = 4
  static OpeningAttributeName = 5
  static ClosedAttributeName = 6
  static BeforeOpenAttributeValue = 7
  static OpeningAttributeValue = 8
  static ClosingAttributeValue = 9
  static ClosedAttributeValue = 10

  static BeforeCloseTag = 11
  static ClosingTag = 12
  static ClosedTag = 13

  static Text = 14

  static OpenDoctype = 15
  static OpenCommentTag = 16
}

const SelfCloseTags = ['meta', 'link', 'br', 'hr', 'img', 'input']
