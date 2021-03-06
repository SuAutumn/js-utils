import { SELF_CLOSE_TAGS } from './const'

enum HtmlNodeType {
  Text,
  Comment,
  Element,
  Doctype,
}

export default class HtmlNode {
  private static currentAttrName = ''
  private start = 0
  private end = 0
  private name = ''

  private type?: HtmlNodeType
  private attrs: Record<string, string | boolean> = {}
  private children: HtmlNode[] = []
  private rawText?: string
  constructor(start: number) {
    this.start = start
    this.end = start
  }

  /** 单个连接字符 */
  setName(name: string) {
    this.name = name
  }

  getName() {
    return this.name
  }

  setAttrName(name: string) {
    this.attrs[name] = true
    HtmlNode.currentAttrName = name
  }

  setAttrValue(value: string) {
    if (HtmlNode.currentAttrName) {
      this.attrs[HtmlNode.currentAttrName] = value
    }
  }

  setEnd(end: number, html: string) {
    this.end = end
    this.rawText = html.slice(this.start, this.end + 1)
  }

  setStart(start: number) {
    this.start = start
  }

  setTypeText() {
    this.type = HtmlNodeType.Text
  }

  isTextNode() {
    return this.type === HtmlNodeType.Text
  }

  setTypeEle() {
    this.type = HtmlNodeType.Element
  }

  isEleNode() {
    return this.type === HtmlNodeType.Element
  }

  setTypeComment() {
    this.type = HtmlNodeType.Comment
  }

  isCommentNode() {
    return this.type === HtmlNodeType.Comment
  }

  setTypeDoc() {
    this.type = HtmlNodeType.Doctype
  }

  isDocNode() {
    return this.type === HtmlNodeType.Doctype
  }

  /** 是否是自闭合标签 */
  isSelfCloseTag() {
    return SELF_CLOSE_TAGS.indexOf(this.name) > -1
  }

  /** <script>标签内所有内容按照文本处理 */
  isScript() {
    return this.name === 'script'
  }

  pushChild(n: HtmlNode) {
    this.children.push(n)
  }

  getChildren() {
    return this.children
  }

  getAttrs() {
    return this.attrs
  }

  querySelect(cb: (val: HtmlNode) => boolean): null | HtmlNode {
    let r: HtmlNode | null = null
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
