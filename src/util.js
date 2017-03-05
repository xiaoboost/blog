//get方法的缓存
const getData = {};
//单 get方法
function get(url) {
  return new Promise((res, rej) => {
    //链接数据已经存在
    if (getData[url]) {
      setTimeout(() => res(getData[url]));
      return (true);
    }

    const oAjax = new XMLHttpRequest();
    oAjax.open('GET', url, true);
    oAjax.send();
    oAjax.onreadystatechange = function() {
      if (oAjax.readyState === 4) {
        if (oAjax.status === 200) {
          //转换为DOM并缓存
          getData[url] = JSON.parse(oAjax.responseText);
          res(getData[url]);
        } else {
          rej();
        }
      }
    };
  });
}
//ajax方法
function ajax(urls) {
  if (typeof urls === 'string') {
    return get(urls);
  } else if (urls instanceof Array) {
    return Promise.all(urls.map((url) => get(url)));
  }
}

export { ajax };
