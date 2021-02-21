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

test('HtmlParser: <div><span>hello<div>world</div></div>', () => {
  const p = new HtmlParser(`<div><span>hello<div>world</div></div>`)
  const tree = p.exec()
  expect(tree.length).toBe(1)
  const n0 = tree[0]
  expect(n0.children.length).toBe(1)
  const span = n0.children[0]
  expect(span.children[0].getName()).toEqual('hello')
  expect(span.start === span.end).toBeTruthy()
  expect(p.toString()).toEqual('<div><span>hello<div>world</div></span></div>')
})

test('HtmlParser', () => {
  const text = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<link rel="Stylesheet" type="text/css" charset="utf-8"
	href="http://img.t.sinajs.cn/t5/style/css/module/global/WB_outframe.css?version=9a5f4a8352d9b9c1">
<link href="http://img.t.sinajs.cn/t5/style/css/pages/specialpages/weibo500.css"
	type="text/css" rel="stylesheet" />
<title>500错误</title>
</head>

<body class="B_weibo500">
	<div class="W_mainbox">
		<div class="W_error_header">
			<div class="W_error_logo">
				<a href="http://weibo.com/"></a>
			</div>
		</div>
		<div class="W_error_main">
			<div class="W_error_con">
				<p class="txt">500</p>
			</div>
			<!--注册登录footer-->
			<div class="footer_nologin_new">
				<div class="system">
					<ul>
						<li><a href="//c.weibo.cn"><i class="sys_ico ipad"></i>iPhone/iPad</a></li>
						<li><a href="//c.weibo.cn"><i class="sys_ico android"></i>Android</a></li>
						<li><a href="//c.weibo.cn"><i class="sys_ico windows"></i>Windows Phone</a></li>
						<li><a href="//c.weibo.cn"><i class="sys_ico other_phone"></i>其他手机端</a>
						</li>
					</ul>
				</div>
				<div class="help_link">
					<a href="//kefu.weibo.com?wvr=5">微博帮助</a><i class="S_txt2">|</i> <a href="//s.weibo.com/weibo/weijianyi">意见反馈</a><i class="S_txt2">|</i> <a href="//verified.weibo.com/verify/">微博认证及合作</a><i class="S_txt2">|</i>
					<a href="//open.weibo.com/?wvr=5">开放平台</a><i class="S_txt2">|</i> <a href="//career.sina.com.cn"> 微博招聘</a><i class="S_txt2">|</i> <a href="//news.sina.com.cn/guide/?wvr=5">新浪网导航</a><i class="S_txt2">|</i>
				</div>
				<p class="S_txt2">
					Copyright &copy; 1996-2012 SINA 北京微梦创科网络技术有限公司<span class="Icp">京网文〔2020〕4754-886号京ICP证号</span><a
						href="#" class="S_txt2">《北京市微博客发展管理若干规定》</a>
				</p>
			</div>
			<!--/注册登录footer-->
		</div>
	</div>

</body>
</html>`
  const p = new HtmlParser(text)
  p.exec()
  console.log(p.toString())
})
