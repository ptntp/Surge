/**
 *
 * 使用方法：打开打开小程序手动进行一次打卡即可。
 *
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Procuratorate.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 *
 * hostname: zhcj.kmcgjcy.cn
 *
 * type: http-request
 * regex: ^https?://zhcj\.kmcgjcy\.cn/AttendanceCard/SaveAttCheckinout$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 * requires-body: 1 | true
 *
 * type: cron
 * cron: 1 55 8 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 *
 * type: cron
 * cron: 1 1 17 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js

 * =============== Surge ===============
 * 工作打卡Cookie = type=http-request, pattern=^https?://zhcj\.kmcgjcy\.cn/AttendanceCard/SaveAttCheckinout$, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 * 上班打卡 = type=cron, cronexp="1 55 8 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 * 下班打卡 = type=cron, cronexp="1 1 17 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 *
 */

const time = new Date()
const years = time.getFullYear().toString()
const month = (`0` + time.getMonth() + 1).slice(-2)
const day = (`0` + time.getDate()).slice(-2)
const hours = (`0` + time.getHours()).slice(-2)
const minutes = (`0` + time.getMinutes()).slice(-2)
const latitude = Math.floor(Math.random() * 1000)
const longitude = Math.floor(Math.random() * 10000)
const $ = new Env(`🧑‍💼 工作打卡`)

typeof $request !== `undefined` ? start() : main()

function start() {
  if ($request.headers) {
    $.write($request.headers.Cookie, `procuratorate_cookie`)
    $.write($request.body, `procuratorate_body`)
    $.notice($.name, `✅`, `写入数据成功`, ``)
  } else {
    $.notice($.name, `⭕ 无法读取请求头 ⭕`, `请检查配置是否正确`)
  }
  $.done()
}

async function main() {
  if ($.read(`procuratorate_cookie`)) {
    if (await work()) {
      $.log(`✅ 当天是工作日, 开始打卡`)
      lists = await index()
      if (lists == 0 && `08:25` <= `${hours}:${minutes}` <= `09:00`) {
        await signin(latitude, longitude, `上班打卡`)
      } else if (lists == 0 && `09:00` < `${hours}:${minutes}` < `17:00`) {
        $.notice($.name, `⭕ 迟到补卡 ⭕`, `请自行进行迟到补卡`, ``)
      } else if (lists == 1 && `08:25` <= `${hours}:${minutes}` <= `09:00`) {
        $.notice($.name, `⭕ 上班已打卡 ⭕`, `请勿再次打卡, 否则按早退处理`, ``)
      } else if (lists == 1 && `17:00` <= `${hours}:${minutes}`) {
        await signin(latitude, longitude, `下班打卡`)
      } else if (lists == 2) {
        $.log(`✅ 今天已经全部打卡`)
      } else {
        $.notice($.name, `⭕ 打卡出错 ⭕`, `请自行检查运行日志, 未知错误无法打卡`, ``)
      }
    } else {
      $.log(`⭕ 当天是休息日, 禁止打卡`)
    }
  } else {
    $.notice($.name, `⭕ 首次使用请手动打卡 ⭕`, ``, ``)
  }
  $.done()
}

function work() {
  let date = years + month + day
  return new Promise(resolve => {
    const options = {url: `http://tool.bitefu.net/jiari/?d=${date}`}
    $.log(`🧑‍💻 开始检查当日是否为工作日...`)
    $.get(options, (error, response, data) => {
      if (data) {
        data == `0` ? result = true : result = false
      }
      resolve(result)
    })
  })
}

function index() {
  let data = $.toObj($.read(`procuratorate_body`))
  let userid = data.model.userID
  let UnitCode = data.model.UnitCode
  return new Promise(resolve => {
    const options = {
      url: `https://zhcj.kmcgjcy.cn/AttendanceCard/GetAttCheckinoutList?UnitCode=${UnitCode}&userid=${userid}`,
      headers: {"Cookie": $.read(`procuratorate_cookie`)}
    }
    $.log(`🧑‍💻 开始检查打卡情况...`)
    $.post(options, (error, response, data) => {
      if (data) {
        resolve(data.length)
      }
    })
  })
}

function signin(_lat, _lng, _period) {
  let data = $.toObj($.read(`procuratorate_body`))
  let lng_substr = data.model.lng.substr(-4)
  let lat_substr = data.model.lat.substr(-3)
  data.model.lng = data.model.lng.replace(lng_substr, _lng)
  data.model.lat = data.model.lat.replace(lat_substr, _lat)
  return new Promise(resolve => {
    const options = {
      url: `https://zhcj.kmcgjcy.cn/AttendanceCard/SaveAttCheckinout`,
      headers: {
        "Cookie": $.read(`procuratorate_cookie`),
        "Accept": `application/json`
      },
      body: data
    }
    $.log(`🧑‍💻 开始${_period}...`)
    $.post(options, (error, response, data) => {
      if (data) {
        data = $.toObj(data)
        if (data.success) {
          $.notice($.name, `✅ 打卡成功 ✅`, `💻 返回数据：${data.message}`, ``)
        } else {
          $.notice($.name, `❌ 打卡失败 ❌`, `💻 返回的完整数据：${$.toStr(data)}`, ``)
        }
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
    if (QX) {url.method = `GET`; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  post = (url, cb) => {
    if (LN || SG) {$httpClient.post(url, cb)}
    if (QX) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { name, read, write, notice, get, post, toObj, toStr, log, done }
}
