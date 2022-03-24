var db = openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024)
db.transaction(function (tx) {
//  tx.executeSql('Drop TABLE  WEB_LOGS_' + storageToday())
  tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LOGS_' + storageToday() + ' (id unique, website,faviconUrl,wasteTime,previousTime)')
})

// browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   // console.log('Hello from the background')
//
// })
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
 * 定时存储数据
 */
setInterval(function () {
  db.transaction(function (tx) {
    tx.executeSql('SELECT * FROM WEB_LOGS_' + storageToday() + ' order by wasteTime desc ', [], function (tx, results) {
      const resultRow = results.rows
      const tempArray = []
      for (let i = 0; i < resultRow.length; i++) {
        const resultOne = resultRow[i]
        tempArray.push(resultOne)
      }
      chrome.storage.local.set({ dataAll: tempArray })
    }, function (tx, results) {
      console.log(results)
      tx.executeSql('CREATE TABLE IF NOT EXISTS WEB_LOGS_' + storageToday() + ' (id unique, website,faviconUrl,wasteTime,previousTime)')
    })
  })
}, 500 * 60)

/**
 * 1. 此处获取的是当前页面的url
 * 2. 存储上一个页面的url
 * 3. 获取上一个页面的url，然后去数据中查询是否存在，如果不存在，插入一条新的数据进去，但是切换时间的时候无法记录时间
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tabInfo) {
    // eslint-disable-next-line no-implied-eval
    storage(tabInfo)
  })
})

function clearAllInterval () {
  internalIdArrays.forEach(thisItem => {
    console.log('clearAllInterval:', thisItem)
    clearInterval(thisItem)
  })
}

function storage (tabInfo) {
  clearAllInterval()
  const tempUrl = tabInfo.url.split('/')[2]
  const id = window.btoa(tempUrl)
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
  console.log('push internalId:', internalId, tempUrl)
  internalIdArrays.push(internalId)
}

function storageToday () {
  const date = new Date()
  const timeKey = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate()
  return timeKey
}