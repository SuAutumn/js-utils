import HtmlParser from '../utils/HtmlParser.js'

test('HtmlParser: <!DOCTYPE html>', () => {
  const p = new HtmlParser(`<!DOCTYPE html>`)
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const node = tree[0]
  expect(node.getName()).toEqual(p.html)
  expect(node.isDocNode()).toBeTruthy()
  expect(node.start).toBe(0)
  expect(node.end).toBe(p.html.length - 1)
})

test('HtmlParser: <!-- comment --><!-- comment -->', () => {
  const p = new HtmlParser(`<!-- comment --><!-- comment -->`)
  const tree = p.exec()
  expect(tree.length).toBe(2)
  expect(tree[0].getName()).toEqual('<!-- comment -->')
  expect(tree[0].isCommentNode()).toBeTruthy()
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
})

test('HtmlParser: <div><span>hello</div>', () => {
  const p = new HtmlParser(`<div><span>hello</div>`)
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const n0 = tree[0]
  expect(n0.children.length).toBe(1)
  const span = n0.children[0]
  expect(span.children[0].getName()).toEqual('hello')
  expect(span.start === span.end).toBeTruthy()
})
