var http = require('http')
var fs = require('fs')

function start() {
  function onRequest(req, res) {
    var readerStream = fs.createReadStream('./input.txt')
    var writerStream = fs.createWriteStream('./output.txt')
    readerStream.pipe(writerStream)
    console.log('读写完毕!')
  }
  http.createServer(onRequest).listen(3010)
  console.log('启动成功!')
}

start()
