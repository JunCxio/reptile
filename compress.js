var fs = require('fs')
var zlib = require('zlib')
var data = 'test dfddgfdgfdgfdgfd jkwu'
// 压缩 input.txt 文件为 input.txt.gz
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
console.log('程序执行完毕')
