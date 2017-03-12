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
    //保存读取的 buffer
    this._cache = buf;
    //读取的起点
    this._index = 0;
    //每次读取 60kb
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
function ramMiddleware(site) {
  return (req, res, next) => {
    //不允许GET或HEAD以外的方法
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.setHeader('Content-Length', '0');
      res.end();
      return (false);
    }

    const url = parseUrl(req)
        .pathname
        .replace(/\//g, '\\'),
      isPost = /\\post\\/.test(url);

    let content = site[url];
    //无效api，跳过
    if (!isPost && !content) { next(); return (false); }
    //渲染文章
    if (isPost) {
      // 文章渲染
      content.render();
      // 文章浅复制
      content = Object.assign({}, content);
      // markdown原文不需要保存
      delete content.markdown;
    }

    const file = Buffer.from(JSON.stringify(content)),
      resStream = new readRam(file);

    //设置响应的Header
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'max-age=0');
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    res.setHeader('ETag', etag(file));
    res.setHeader('Content-Length', file.length);
    res.setHeader('Content-Type', 'application/json;charset:utf-8');

    //数据流连接至http响应
    resStream.pipe(res)
      .on('finish', () => destroy(resStream));

    //响应终止
    return (true);
  };
}

module.exports = ramMiddleware;
