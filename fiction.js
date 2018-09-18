const http = require('http'),
  superagent = require('superagent'),
  cheerio = require('cheerio'),
  async = require('async'),
  eventproxy = require('eventproxy'),
  iconv = require('iconv-lite'),
  fs = require('fs')
require('superagent-charset')(superagent)

var ep = new eventproxy(),
  fictionUrls = [],
  url = 'http://www.quanshuwang.com/book/9/9055'

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
              fs.writeFile(
                `./textBox/${title.eq(i).text()}.doc`,
                content.eq(i).text(),
                function(err) {
                  if (err) throw err
                  console.log('保存成功!')
                }
              )
            }
          })

        setTimeout(function() {
          curCount--
          callback(null, url + 'Call back content')
        }, delay)
      }

      async.mapLimit(
        articleUrl,
        5,
        function(url, callback) {
          reptileMove(url, callback)
        },
        function(err, result) {
          // 4000 个 URL 访问完成的回调函数
          // ...
        }
      )
    })
  }
  http.createServer(onRequest).listen(3020)
  console.log('连接3020成功!')
}

start()
