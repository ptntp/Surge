const $ = new Env('上班打卡')

typeof $request !== `undefined` ? start() : main()

function start() {
  if ($request.headers) {
    if (!$.read(`procuratorate_cookie`)) {
      $.write($request.headers.Cookie, `procuratorate_cookie`)
      $.notice($.name, `✅ 首次使用 ✅`, `写入数据成功`, ``)
    } else if ($request.headers.Cookie != $.read(`procuratorate_cookie`)) {
      $.write($request.headers.Cookie, `procuratorate_cookie`)
      $.notice($.name, `✅ 更新成功 ✅`, ``, ``)
    }
  } else {
    $.notice($.name, `⭕ 无法读取请求头 ⭕`, `请检查配置是否正确`)
  }
  $.done()
}

async function main() {
  await index()
  $.done()
}

function index() {
  return new Promise(resolve => {
    const options = {
      url: `https://zhcj.kmcgjcy.cn/AttendanceCard/Attendancecard?appid=103`,
      headers: {"Cookie": $.read(`procuratorate_cookie`)}
    }
    $.log(`🧑‍💻 开始获取研究生账号信息`)
    $.get(options, (error, response, data) => {
      if (data) {
        data = $.toObj(data)
        $.log(data)
      }
      resolve()
    })
  })
}

function Env(name) {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  read = (key) => {
    if (LN || SG) return $persistentStore.read(key)
    if (QX) return $prefs.valueForKey(key)
  }
  write = (key, val) => {
    if (LN || SG) return $persistentStore.write(key, val); 
    if (QX) return $prefs.setValueForKey(key, val)
  }
  notice = (title, subtitle, message, url) => {
    if (LN) $notification.post(title, subtitle, message, url)
    if (SG) $notification.post(title, subtitle, message, { url: url })
    if (QX) $notify(title, subtitle, message, { "open-url": url })
  }
  get = (url, cb) => {
    if (LN || SG) {$httpClient.get(url, cb)}
    if (QX) {url.method = 'GET'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  post = (url, cb) => {
    if (LN || SG) {$httpClient.post(url, cb)}
    if (QX) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  put = (url, cb) => {
    if (LN || SG) {$httpClient.put(url, cb)}
    if (QX) {url.method = 'PUT'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { name, read, write, notice, get, post, put, toObj, toStr, log, done }
}
