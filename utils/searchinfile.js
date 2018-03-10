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
    return this.name.indexOf('.') > -1
  }
}

// 找到所有文件
class FileList {
  constructor(relPath) {
    let absPath = path.resolve(__dirname, relPath) 
    this.stack = [] // 文件stack
    this.filelist = []
    this.ls(absPath)
  }

  ls (absPath) {
    let files = fs.readdirSync(absPath) // 同步读取，有机会试试异步
    files.forEach(file => {
      this.stack.push(new FileNode(path.resolve(absPath, './' + file)))
    })
  }

  recurLs () {
    while (this.stack.length > 0) {
      let curNode = this.stack.pop()
      if (curNode.isFile()) {
        this.filelist.push(curNode.name)
      } else {
        this.ls(curNode.name)
      }
    }
  }
}

var test = new FileList('../')
test.recurLs() // 找到所有文件路径
console.log(test.filelist)