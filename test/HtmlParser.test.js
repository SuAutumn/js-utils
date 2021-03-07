import HtmlParser from '../utils/html-paser/HtmlParser'

test('html empty', () => {
  const p = new HtmlParser()
  const tree = p.exec()
  expect(tree.length).toBe(0)
  expect(p.toString()).toEqual('')
})
test('HtmlParser: <!DOCTYPE html>', () => {
  const p = new HtmlParser(`<!DOCTYPE html>`)
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const node = tree[0]
  expect(node.getName()).toEqual(p.html)
  expect(node.isDocNode()).toBeTruthy()
  expect(node.start).toBe(0)
  expect(node.end).toBe(p.html.length - 1)
  expect(p.toString()).toEqual(p.html)
})

test('HtmlParser: <!-- comment --><!-- comment -->', () => {
  const p = new HtmlParser(`<!-- comment --><!-- comment -->`)
  const tree = p.exec()
  expect(tree.length).toBe(2)
  expect(tree[0].getName()).toEqual('<!-- comment -->')
  expect(tree[0].isCommentNode()).toBeTruthy()
  expect(p.toString()).toEqual(p.html)
})

test('HtmlParser: text', () => {
  const p = new HtmlParser(`text`)
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const node = tree[0]
  expect(node.getName()).toEqual(p.html)
  expect(node.isTextNode()).toBeTruthy()
  expect(node.start).toBe(0)
  expect(node.end).toBe(p.html.length - 1)
  expect(p.toString()).toEqual(p.html)
})

test('HtmlParser: <div class="bg-white"><div style="color: red;">text</div></div>', () => {
  const p = new HtmlParser(
    `<div class="bg-white"><div style="color: red;">text</div></div>`
  )
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const n0 = tree[0]
  expect(n0.children.length).toBe(1)
  expect(n0.attrs.class).toEqual('bg-white')
  expect(n0.isEleNode()).toBeTruthy()
  expect(n0.start).toBe(0)
  expect(n0.end).toBe(p.html.length - 1)
  const n1 = n0.children[0]
  expect(n1.children.length).toBe(1)
  expect(n1.attrs.style).toEqual('color: red;')
  expect(n1.isEleNode()).toBeTruthy()
  const t = n1.children[0]
  expect(t.isTextNode()).toBeTruthy()
  expect(t.getName()).toEqual('text')
  expect(p.toString()).toEqual(p.html)
})

test('HtmlParser: <div><span>hello</p><div>', () => {
  const text = '<div><span>hello</p><div>'
  const p = new HtmlParser(text)
  p.exec()
  expect(p.toString()).toEqual(
    '<div><span>hello<p></p><div></div></span></div>'
  )
})

test('<script>', () => {
  const text = `<script>var a = document.appendchild('<script>var a = 1;</script>'); function b(){};</script>`
  const p = new HtmlParser(text)
  p.exec()
  expect(p.toString()).toEqual(text)
})
