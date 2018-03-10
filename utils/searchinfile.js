const path = require('path')
const fs = require('fs')
const EventEmiiter = require('events')

function absPath(basePath, relPath) {
  return path.resolve(basePath, relPath)
}

// 一个目录下的内容
class FileNode {
  constructor(absPath) {
    this.name = absPath
  }

  isFile () {
    return fs.statSync(this.name).isFile()
  }
}

// 找到所有文件
class FileList {
  constructor(relPath, options = {}) {
    let absPath = path.resolve(__dirname, relPath) 
    this.stack = [] // 文件stack
    this.filelist = [] // find all files from root path
    this.ignorePath = [] // ignore dir
    this.setIgnore(options.ignore) // set ignore dir
    this.recurLs(absPath) // recursive dir
  }

  ls (absPath) {
    let files = fs.readdirSync(absPath) // 同步读取，有机会试试异步
    files.forEach(file => {
      this.stack.push(new FileNode(path.resolve(absPath, './' + file)))
    })
  }

  recurLs (absPath) {
    this.ls(absPath)
    while (this.stack.length > 0) {
      let curNode = this.stack.pop()
      if (curNode.isFile()) {
        this.filelist.push(curNode.name)
      } else {
        if (!this.isIgnore(curNode.name)) {
          this.ls(curNode.name)
        }
      }
    }
  }

  setIgnore (ig = []) {
    ig.forEach(i => {
      this.ignorePath.push(absPath(__dirname, i))
    })
  }

  isIgnore (absPath) {
    return this.ignorePath.indexOf(absPath) > -1
  }
}

class ReadFile extends FileList {
  constructor(relPath, options = {}) {
    super(relPath, options)
    this.contentObj = {} // 按文件名记录
    this.contentStr = '' // 整个文件合并
    this.readAll()
  }

  read (absPath) {
    let content = fs.readFileSync(absPath, 'utf-8')
    this.contentObj[absPath] = content
    this.contentStr += content
  }

  readAll () {
    this.filelist.forEach(absPath => {
      this.read(absPath)
    })
  }
}

var test = new ReadFile('../', {ignore: ['../.git']})
// test.recurLs() // 找到所有文件路径
// console.log(test.filelist)
console.log(test.contentStr)