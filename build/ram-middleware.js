const path = require('path'),
  Readable = require('stream').Readable,
  url = require('url'),
  etag = require('etag'),
  mime = require('mime-types'),
  parseUrl = require('parseurl'),
  destroy = require('destroy');

//从Buffer创建读取流
class readRam extends Readable {
  constructor(buf) {
    super();
    //保存读取的buffer
    this._cache = buf;
    //读取的起点
    this._index = 0;
    //每次读取60kb
    this._peer = 61440;
  }
  _read() {
    const peer = this._peer,
      index = this._index,
      max = this._cache.length,
      frag = (index <= max)
        ? Buffer.from(this._cache, index, peer)
        : null;

    this._index = index + peer;
    this.push(frag);
  }
}
//内存中间件
function ramMiddleware(base, fs) {
  return (req, res, next) => {
    //不允许GET或HEAD以外的方法
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Length', '0');
      res.end();
      return (false);
    }

    const url = parseUrl(req).pathname,
      oriPath = (url[url.length - 1] === '/')
        ? path.join(base, url, 'index.html')
        : path.join(base, url),
      file = fs.readFileSync(oriPath);

    //无效api，跳过
    if (!file) { next(); }

    const resStream = new readRam(file);

    //设置响应的Header
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'max-age=0');
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    res.setHeader('ETag', etag(file));
    res.setHeader('Content-Length', file.length);

    if (oriPath.indexOf(/[/\\]api[/\\]/) !== -1) {
      //api统一以文本形式返回
      res.setHeader('Content-Type', 'text/plain;charset:utf-8');
    } else {
      //非api返回对应类型
      res.setHeader('Content-Type', mime.lookup(oriPath) + ';charset:utf-8');
    }

    //数据流连接至http响应
    resStream.pipe(res)
      .on('finish', () => destroy(resStream));

    next();
  };
}

module.exports = ramMiddleware;
