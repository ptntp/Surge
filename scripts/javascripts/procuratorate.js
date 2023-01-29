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
 * cron: 1 58 8 * * 1,2,3,4,5
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 *
 * type: cron
 * cron: 1 1 17 * * 1,2,3,4,5
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js

 * =============== Surge ===============
 * 工作打卡Cookie = type=http-request, pattern=^https?://zhcj\.kmcgjcy\.cn/AttendanceCard/SaveAttCheckinout$, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 * 上班打卡 = type=cron, cronexp="1 58 8 * * 1,2,3,4,5", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 * 下班打卡 = type=cron, cronexp="1 1 17 * * 1,2,3,4,5", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=10
 *
 */


const time = new Date()
const years = time.getFullYear().toString()
const month = (`0` + time.getMonth() + 1).slice(-2)
const day = (`0` + time.getDate()).slice(-2)
const today = years + month + day
const hours = time.getHours()
const minutes = time.getMinutes()
if (hours == 8) {
  period = `上班打卡`
} else if (hours == 17) {
  period = `下班打卡`
} else {
  period = `打卡测试`
}
const $ = new Env(period)

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
    work = await check(today)
    if (work == `0`) {
      if (hours == 8 && minutes == 58) {
        await index()
      } else if (hours == 17 && minutes == 1) {
        await index()
      } else {
        $.log(`不在打卡时间（精确到分钟）`)
      }
    }
  } else {
    $.notice($.name, `⭕ 首次使用请手动打卡 ⭕`, ``, ``)
  }
  $.done()
}

function check(_date) {
  return new Promise(resolve => {
    const options = {
      url: `http://tool.bitefu.net/jiari/?d=` + _date
    }
    $.log(`🧑‍💻 开始检查当日是否为工作日...`)
    $.get(options, (error, response, data) => {
      if (data) {
        if (data == `0`) {
          $.log(`✅ 当天为工作日，开始打卡`)
        } else {
          $.log(`⭕ 当天为休息日，不进行打卡`)
        } 
      }
      resolve(data)
    })
  })
}

function index() {
  let checkin = $.toObj($.read(`procuratorate_body`))
  let lng_substr = checkin.model.lng.substr(-4)
  let lat_substr = checkin.model.lat.substr(-3)
  let lng_random = Math.floor(Math.random() * 10000)
  let lat_random = Math.floor(Math.random() * 1000)
  checkin.model.lng = checkin.model.lng.replace(lng_substr, lng_random)
  checkin.model.lat = checkin.model.lat.replace(lat_substr, lat_random)
  return new Promise(resolve => {
    const options = {
      url: `https://zhcj.kmcgjcy.cn/AttendanceCard/SaveAttCheckinout`,
      headers: {
        "Cookie": $.read(`procuratorate_cookie`),
        "Accept": `application/json`
      },
      body: checkin
    }
    $.log(`🧑‍💻 开始${$.name}...`)
    $.post(options, (error, response, data) => {
      if (data) {
        $.log(data)
        data = $.toObj(data)
        if (data.success) {
          $.notice($.name, `✅ 打卡成功 ✅`, data.message, ``)
        } else {
          $.notice($.name, `❌ 打卡失败 ❌`, data, ``)
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
