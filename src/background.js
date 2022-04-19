var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024)
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LIMIT_LOG  (id unique,limitTime,limitType,startLimitTime,endLimitTime )')
  tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LOGS_' + storageToday() + ' (id unique, website,faviconUrl,wasteTime,previousTime)')
})

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Hello from the background', JSON.stringify(request))
  sendResponse({ farewell: '再见' })
  if (request.buttonType === 'date') {
    searchDataByDate(request.searchDate)
  } else {
    setLimitTime(request.id, request.limitTime, request.limitType, request.startLimitTime, request.endLimitTime)
  }
})
var internalIdArrays = []
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // console.log('Hello from the background')
  if (changeInfo.status === 'complete') {
    chrome.tabs.get(tabId, function (tabInfo) {
      // eslint-disable-next-line no-implied-eval
      storage(tabInfo)
    })
  }
})
/**
 * 设置时间限额的方式
 */
function setLimitTime (id, limitTime, limitType, startLimitTime, endLimitTime) {
  if (limitType === 1) {
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM WEB_LIMIT_LOG where id = ?', [id], function (tx, results) {
        if (results.rows.length <= 0) {
          tx.executeSql('INSERT INTO WEB_LIMIT_LOG (id,limitTime,limitType) VALUES (?, ?, ?)', [id, limitTime, limitType])
        } else {
          tx.executeSql('update WEB_LIMIT_LOG set limitTime= ?,limitType=? where id = ?', [limitTime, limitType, id])
        }
      }, function (tx, results) {
        console.log(results)
      })
    })
  } else if (limitType === 2) {
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM WEB_LIMIT_LOG where id = ?', [id], function (tx, results) {
        if (results.rows.length <= 0) {
          tx.executeSql('INSERT INTO WEB_LIMIT_LOG (id,startLimitTime,endLimitTime,limitType) VALUES (?, ?, ?, ?)', [id, startLimitTime, endLimitTime, limitType])
        } else {
          tx.executeSql('update WEB_LIMIT_LOG set limitType=?,startLimitTime=?,endLimitTime=? where id = ? ', [limitType, startLimitTime, endLimitTime, id])
        }
      }, function (tx, results) {
        console.log(results)
      })
    })
  } else {
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM WEB_LIMIT_LOG where id = ?', [id], function (tx, results) {
        if (results.rows.length <= 0) {
          tx.executeSql('INSERT INTO WEB_LIMIT_LOG (id,limitType) VALUES (?, ?)', [id, limitType])
        } else {
          tx.executeSql('update WEB_LIMIT_LOG set limitType=? where id = ? ', [limitType, id])
        }
      }, function (tx, results) {
        console.log(results)
      })
    })
  }
}

function searchDataByDate (searchDate) {
  db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM WEB_LOGS_' + searchDate + ' order by wasteTime desc ', [], function (tx, results) {
      const resultRow = results.rows
      const tempArray = []
      for (let i = 0; i < resultRow.length; i++) {
        const resultOne = resultRow[i]
        if (resultOne.website === 'undefined' || resultOne.website === 'newtab' || resultOne.website === 'extensions') {
          continue
        }
        tempArray.push(resultOne)
      }
      chrome.storage.local.set({ dataAll: tempArray })
    }, function (tx, results) {
      console.log(results)
    })
  })
}

/**
 * 定时存储数据
 */
setInterval(function () {
  db.transaction(function (tx) {
    tx.executeSql('SELECT s.id,s.website,s.faviconUrl,s.wasteTime,w.limitTime,w.startLimitTime,w.endLimitTime,w.limitType FROM WEB_LOGS_' + storageToday() + ' s left join WEB_LIMIT_LOG w on s.id = w.id order by wasteTime desc ', [], function (tx, results) {
      const resultRow = results.rows
      const tempArray = []
      for (let i = 0; i < resultRow.length; i++) {
        const resultOne = resultRow[i]
        if (resultOne.website === 'undefined' || resultOne.website === 'newtab' || resultOne.website === 'extensions') {
          continue
        }
        tempArray.push(resultOne)
      }
      chrome.storage.local.set({ dataAll: tempArray })
    }, function (tx, results) {
      console.log(results)
      tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LOGS_' + storageToday() + ' (id unique, website,faviconUrl,wasteTime,previousTime,limitTime)')
    })
  })
}, 500 * 60)

// 调用桌面通知

/**
 * 1. 此处获取的是当前页面的url
 * 2. 存储上一个页面的url
 * 3. 获取上一个页面的url，然后去数据中查询是否存在，如果不存在，插入一条新的数据进去，但是切换时间的时候无法记录时间
 */

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tabInfo) {
    storage(tabInfo)
  })
})

function clearAllInterval () {
  internalIdArrays.forEach(thisItem => {
    console.log('clearAllInterval:', thisItem)
    clearInterval(thisItem)
  })
}

function checkAuditTime (beginTime, endTime) {
  var nowDate = new Date()
  var beginDate = new Date(nowDate)
  var endDate = new Date(nowDate)

  var beginIndex = beginTime.lastIndexOf(':')
  var beginHour = beginTime.substring(0, beginIndex)
  var beginMinue = beginTime.substring(beginIndex + 1, beginTime.length)
  beginDate.setHours(beginHour, beginMinue, 0, 0)

  var endIndex = endTime.lastIndexOf(':')
  var endHour = endTime.substring(0, endIndex)
  var endMinue = endTime.substring(endIndex + 1, endTime.length)
  endDate.setHours(endHour, endMinue, 0, 0)
  console.log(nowDate.getTime() - beginDate.getTime(), nowDate, endDate)
  return nowDate.getTime() - beginDate.getTime() >= 0 && nowDate.getTime() <= endDate.getTime()
}

function storage (tabInfo) {
  clearAllInterval()
  const url = new URL(tabInfo.url)
  const tempUrl = url.hostname
  const id = window.btoa(tempUrl)
  db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM WEB_LIMIT_LOG where id = ? ', [id], function (tx, results) {
      if (results.rows.length > 0) {
        const limitObj = results.rows[0]

        tx.executeSql('SELECT * FROM WEB_LOGS_' + storageToday() + ' where id = ?', [id], function (tx, results) {
          if (results.rows.length > 0) {
            const resultOne = results.rows[0]
            if (limitObj.limitType === 1) {
              if ((resultOne.wasteTime / 1000) > limitObj.limitTime) {
                const message = 'This site has been viewed for ' + (limitObj.limitTime / 60) + ' minutes today, please cherish the time'
                const jsCode = ' var node=document.getElementById("zhangshuo");if(node){document.body.removeChild(node)}' +
                  'var a = document.createElement("div"); a.id = "zhangshuo"; a.style.height="300px" ;a.style.lineHeight="300px";a.style.textAlign="center" ;' +
                  ' a.style.width="600px";a.style.position="fixed";a.style.backgroundColor="#333333";' +
                  ' a.style.margin="auto";a.zIndex=9999;a.style.top=0;a.style.right=0;a.style.left=0;a.style.bottom=0;' +
                  'document.body.appendChild(a);' +
                  'var p = document.createElement("p");p.style.color="white";;p.style.fontSize="14px";p.nodeValue="zhangshuo";var t = document.createTextNode("' + message + '");p.appendChild(t);document.getElementById("zhangshuo").appendChild(p)'

                chrome.tabs.executeScript({
                  code: jsCode
                })
              }
            } else if (limitObj.limitType === 2) {
              const checkAudit = checkAuditTime(limitObj.startLimitTime, limitObj.endLimitTime)
              console.log(checkAudit)
              if (checkAudit) {
                const message = 'Currently not in the time frame you have set for viewing, please cherish the time'
                const jsCode = ' var node=document.getElementById("zhangshuo");if(node){document.body.removeChild(node)}' +
                  'var a = document.createElement("div"); a.id = "zhangshuo"; a.style.height="300px" ;a.style.lineHeight="300px";a.style.textAlign="center" ;' +
                  ' a.style.width="600px";a.style.position="fixed";a.style.backgroundColor="#333333";' +
                  ' a.style.margin="auto";a.zIndex=9999;a.style.top=0;a.style.right=0;a.style.left=0;a.style.bottom=0;' +
                  'document.body.appendChild(a);' +
                  'var p = document.createElement("p");p.style.color="white";;p.style.fontSize="14px";p.nodeValue="zhangshuo";var t = document.createTextNode("' + message + '");p.appendChild(t);document.getElementById("zhangshuo").appendChild(p)'
                chrome.tabs.executeScript({
                  code: jsCode
                })
              }
            }
          }
        }, function (tx, results) {
          console.log(results)
        })
      }
    }, function (tx, results) {
      console.log(results)
      tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LIMIT_LOG  (id unique,limitTime,limitType,startLimitTime,endLimitTime )')
    })
  })

  const internalId = setInterval(function () {
    db.transaction(function (tx) {
      tx.executeSql('SELECT * FROM WEB_LOGS_' + storageToday() + ' where id = ?', [id], function (tx, results) {
        if (results.rows.length <= 0) {
          tx.executeSql('INSERT INTO WEB_LOGS_' + storageToday() + ' (id,website,faviconUrl,wasteTime,previousTime) VALUES (?, ?, ?, ?,?)', [id, tempUrl, tabInfo.favIconUrl, 1000, new Date().getTime()])
        } else {
          const resultOne = results.rows[0]
          tx.executeSql('update WEB_LOGS_' + storageToday() + ' set wasteTime= ?,previousTime=?,faviconUrl=? where id = ?', [resultOne.wasteTime + 1000, new Date().getTime(), tabInfo.favIconUrl, resultOne.id])
        }
      }, function (tx, results) {
        console.log(results)
        tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LOGS_' + storageToday() + ' (id unique, website,faviconUrl,wasteTime,previousTime)')
      })
    })
  }, 1000)
  console.log('push internalId:', internalId, tempUrl, JSON.stringify(tabInfo))
  internalIdArrays.push(internalId)
}

function storageToday () {
  const date = new Date()

  let month = date.getMonth() + 1
  if ((date.getMonth() + 1) < 10) {
    month = '0' + (date.getMonth() + 1)
  }

  let dateOne = date.getDate()
  if (date.getDate() < 10) {
    dateOne = '0' + date.getDate()
  }
  const timeKey = date.getFullYear() + '' + month + '' + dateOne
  return timeKey
}
