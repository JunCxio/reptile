const http = require('http'),
  superagent = require('superagent'),
  cheerio = require('cheerio'),
  async = require('async'),
  eventproxy = require('eventproxy'),
  fs = require('fs'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema

mongoose.connect(
  'mongodb://localhost:27017/fictionBox',
  err => {
    if (err) {
      console.log('数据库连接失败!')
    } else {
      console.log('数据库连接成功!')
    }
  }
)
require('superagent-charset')(superagent)

//定义Schema
const ficiton = new Schema({
  title: String,
  content: String
})
//定义model
const reptileFiction = mongoose.model('Fiction', ficiton)

var ep = new eventproxy(),
  fictionUrls = [],
  url = 'http://www.quanshuwang.com/book/44/44683'

function start() {
  function onRequest(req, res) {
    superagent
      .get(url)
      .charset('gbk')
      .end((err, pres) => {
        var $ = cheerio.load(pres.text)
        var curPageUrls = $('.dirconone li a')
        for (var i = 0; i < curPageUrls.length; i++) {
          var articleUrl = curPageUrls.eq(i).attr('href')
          fictionUrls.push(articleUrl)

          // 相当于一个计数器
          ep.emit('BlogArticleHtml', articleUrl)
        }
      })

    ep.after('BlogArticleHtml', fictionUrls.length, articleUrl => {
      // 当所有 'BlogArticleHtml' 事件完成后的回调触发下面事件
      // 控制并发数
      var curCount = 0
      var reptileMove = function(url, callback) {
        //延迟毫秒数
        var delay = parseInt((Math.random() * 30000000) % 1000, 10)
        curCount++
        superagent
          .get(url)
          .charset('gbk')
          .end(function(err, sres) {
            // sres.text 里面存储着请求返回的 html 内容
            var $ = cheerio.load(sres.text)
            var content = $('.mainContenr')
            var title = $('.jieqi_title')
            for (var i = 0; i < content.length; i++) {
              //新增到mongodb
              reptileFiction.create(
                {
                  title: title.eq(i).text(),
                  content: content.eq(i).text()
                },
                (err, doc) => {
                  if (err) throw err
                  console.log('保存成功!')
                }
              )
              //保存到本地
              // fs.writeFile(
              //   `./textBox/${title.eq(i).text()}.txt`,
              //   content.eq(i).text(),
              //   function(err) {
              //     if (err) throw err
              //     console.log('保存成功!')
              //   }
              // )
            }
          })

        setTimeout(function() {
          curCount--
          callback(null, url + 'Call back content')
        }, delay)
      }

      //因为用mapLimit章节会乱,所以选择用mapSeries串行请求,不过速度会挺慢的
      async.mapSeries(
        articleUrl,
        (url, callback) => {
          reptileMove(url, callback)
        },
        (err, result) => {}
      )

      // async.mapLimit(
      //   articleUrl,
      //   5,
      //   function(url, callback) {
      //     reptileMove(url, callback)
      //   },
      //   function(err, result) {
      //     // 4000 个 URL 访问完成的回调函数
      //     // ...
      //   }
      // )
    })
  }
  http.createServer(onRequest).listen(3020)
  console.log('app started at port 3020...')
}

start()
