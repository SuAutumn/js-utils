export default class HtmlParser {
  /**
   * @param html {string, undefined}
   */
  constructor(html) {
    if (typeof html === 'string') {
      this.setHtml(html)
    }
    this.parentNodeStack = [] // 父node stack 用于关联父子关系
    this.text = '' // current text
    this.tree = [] // 解析之后的树结构
    this.cbs = {}
    this.symbols = [] // 存放js对称符号
  }

  $on(eventName, cb) {
    this.cbs[eventName] = cb
  }

  // 支持事件 onClosedTag, onClosedTagName
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
      this.status = State.OpeningTagName
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
    const node = new HtmlNode(this._start, this.html)
    node.setName(this.text)
    node.setTypeEle()
    this.resetText()
    this.status = State.BeforeOpenAttributeName
    this.backOffset()
    // 添加层级关系
    this.addNodeToParent(node)
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
      this.status = State.ClosedTag
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
    const node = this.lastElement(this.parentNodeStack)
    node.setAttrName(this.text)
    this.resetText()
    if (HtmlParser.isWhiteSpace(c)) {
      // <div class style="...">
      this.status = State.BeforeOpenAttributeName
    } else if (c === '=') {
      this.status = State.BeforeOpenAttributeValue
    } else if (c === '/') {
      this.status = State.BeforeCloseTag
      this.backOffset()
    } else if (c === '>') {
      this.status = State.ClosedTag
    }
  }

  handleBeforeOpenAttributeValue(c) {
    if (HtmlParser.isWhiteSpace(c) || c === '=') {
      // ignore
    } else if (c === '"' || c === "'") {
      this.status = State.OpeningAttributeValue
      this.symbols.push(c)
    } else {
      this.status = State.OpeningAttributeValue
      this.backOffset()
    }
  }

  handleOpeningAttributeValue(c) {
    // class="xxxx"
    if (this.symbols.length > 0) {
      if (this.lastElement(this.symbols) === c) {
        this.status = State.ClosingAttributeValue
        this.backOffset()
        this.symbols.pop()
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
    const node = this.lastElement(this.parentNodeStack)
    node.setAttrValue(this.text)
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
      this.status = State.ClosedTag
    }
  }

  handleBeforeCloseTag() {
    this.status = State.ClosingTag
    this._tagName = this.lastElement(this.parentNodeStack).getName()
  }

  handleClosingTag(c) {
    if (c === '>') {
      // <img xxxxx/> self close
      if (this.text === '') {
        this.status = State.ClosedTag
      } else {
        if (SelfCloseTags.indexOf(this.text) === -1) {
          // 非自闭和标签
          if (this.text !== this._tagName) {
            this.fixOrderErrInParentStack(this.text)
          }
          this.status = State.ClosedTag
        } else {
          // 自闭和标签直接舍弃
          if (this.nextChar()) {
            // 防止溢出
            this.status = this.initState(this.nextChar())
          }
        }
      }
      this.resetText()
    } else if (HtmlParser.isWhiteSpace(c)) {
      // ignore
    } else {
      this.setTextByChar(c)
    }
  }

  // >x
  handleClosedTag(c) {
    const node = this.lastElement(this.parentNodeStack)
    if (node) {
      // <meta> 检查是否是自闭合标签
      if (
        this._tagName ||
        node.isSelfCloseTag() ||
        node.isDocNode() ||
        node.isCommentNode() ||
        node.isTextNode()
      ) {
        this._tagName = undefined
        // 收尾
        this.popNodeFromParent()
        node.setEnd(this.offset - 1, this.html)
        this.$emit('onClosedTag', { node })
      } else {
        this.$emit('onOpenedTag', { node })
      }
    }
    const pNode = this.lastElement(this.parentNodeStack)
    if (node === pNode && pNode.isScript()) {
      // node === pNode 说明没有移除stack元素，即script node 准备添加script内容
      this.status = State.OpeningScript
      this.backOffset()
    } else if (c === '<') {
      this.status = State.OpenTag
      this.backOffset()
    } else if (c) {
      // 去除 c 为 undefined
      this.status = State.Text
      this.backOffset()
    }
  }

  handleText(c) {
    if (c === '<' || c === '') {
      const node = new HtmlNode(this.offset - this.text.length, this.html)
      node.setTypeText()
      node.setName(this.text)
      this.resetText()
      this.addNodeToParent(node)
      this.status = State.ClosedTag
      // 回退1
      this.backOffset()
    } else {
      this.setTextByChar(c)
    }
  }

  // <!DOCTYPE html>
  handleOpenDoctype(c) {
    if (c === '>') {
      const node = new HtmlNode(this._start, this.html)
      node.setTypeDoc()
      node.setName(this.html.slice(this._start, this.offset + 1))
      this.addNodeToParent(node)
      this.status = State.ClosedTag
    }
  }

  // html comment
  handleOpenCommentTag(c) {
    if (this.beforeChar() === '-' && c === '>') {
      const node = new HtmlNode(this._start, this.html)
      node.setTypeComment()
      node.setName(this.html.slice(this._start, this.offset + 1))
      this.addNodeToParent(node)
      this.status = State.ClosedTag
    }
  }

  handleOpeningScript(c) {
    if (c === "'" || c === '"') {
      this.lastElement(this.symbols) !== c
        ? this.symbols.push(c)
        : this.symbols.pop()
    }
    if (c === '{' || c === '(' || c === '[') {
      this.symbols.push(c)
    }
    if (c === '}' || c === ')' || c === ']') {
      this.symbols.pop()
    }
    if (c === '<' && this.symbols.length === 0) {
      this.status = State.Text
      this.backOffset()
    } else {
      this.setTextByChar(c)
    }
  }

  exec() {
    if (typeof this.html !== 'string') {
      throw new Error('未设置html')
    }
    while (this.offset <= this.length) {
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
        case State.OpeningScript:
          this.handleOpeningScript(c)
          break
      }
      this.offset++
    }
    return this.tree.slice(0)
    // console.log(JSON.stringify(this.tree))
  }

  /**
   * @param node {HtmlNode}
   */
  addNodeToParent(node) {
    const p = this.lastElement(this.parentNodeStack)
    if (p) {
      p.children.push(node)
    }
    this.parentNodeStack.push(node)
  }

  /**
   * @return {HtmlNode, undefined}
   */
  popNodeFromParent() {
    const node = this.parentNodeStack.pop()
    if (this.parentNodeStack.length === 0) {
      this.tree.push(node)
    }
    return node
  }

  lastElement(arr) {
    return arr[arr.length - 1]
  }

  resetText() {
    this.text = ''
  }

  setTextByChar(c) {
    this.text = this.text.concat(c)
  }

  static isAlphaChar(c) {
    const code = c.charCodeAt(0)
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90)
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

  fixOrderErrInParentStack(tagName) {
    let len = this.parentNodeStack.length
    while (len > 0) {
      if (this.lastElement(this.parentNodeStack).getName() === tagName) {
        break
      }
      this.parentNodeStack.pop()
      len--
    }
  }
}

class HtmlNode {
  static currentAttrName = ''
  constructor(start) {
    // this.html = html
    this.start = start
    this.end = start
    this.name = ''
    this.type = '' // comment element text
    this.attrs = {}
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
    HtmlNode.currentAttrName = name
  }

  setAttrValue(value) {
    if (HtmlNode.currentAttrName) {
      this.attrs[HtmlNode.currentAttrName] = value
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
  isScript() {
    if (this.name === 'script') {
      return true
    }
  }

  querySelect(cb) {
    let r = null
    for (let i = 0, len = this.children.length; i < len; i++) {
      const node = this.children[i]
      if (cb(node)) {
        r = node
      } else {
        r = node.querySelect(cb)
      }
      if (r) break
    }
    return r
  }

  toString() {
    return {
      name: this.name,
      type: this.type,
      attrs: this.attrs,
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

  static OpeningScript = 17
}

const SelfCloseTags = ['meta', 'link', 'br', 'hr', 'img', 'input']
