const http = require('http'),
  superagent = require('superagent'),
  fs = require('fs'),
  cheerio = require('cheerio'),
  async = require('async'),
  eventproxy = require('eventproxy'),
  request = require('request')

var ep = new eventproxy(),
  url = 'http://www.huitu.com/topic-detail/2959.html'

function start() {
  function onRequest(req, res) {
    superagent.get(url).end(function(err, pres) {
      var $ = cheerio.load(pres.text)
      var imgUrl = $('.photo a img')
      console.log(imgUrl)
      for (var i = 0; i < imgUrl.length; i++) {
        var articleUrl = imgUrl.eq(i).attr('data-src')
        console.log(articleUrl)
        ep.emit('BlogArticleHtml', articleUrl)
      }
    })
    ep.after('BlogArticleHtml', 8, function(articleUrls) {
      // 当所有 'BlogArticleHtml' 事件完成后的回调触发下面事件
      // ...
      var downloadPic = function(src, dest) {
        request(src)
          .pipe(fs.createWriteStream(dest))
          .on('close', function() {
            console.log('pic saved!')
          })
      }

      async.mapSeries(
        articleUrls,
        function(item, callback) {
          setTimeout(function() {
            downloadPic(item, './img/' + new Date().getTime() + '.jpg')
            callback(null, item)
          }, 400)
        },
        function(err, results) {}
      )
    })
  }

  http.createServer(onRequest).listen(3005)
}

start()
