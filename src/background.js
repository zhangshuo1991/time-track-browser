browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  sendResponse({ farewell: '再见' })
})

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    chrome.tabs.get(tabId, function (tabInfo) {
      storage(tabInfo)
    })
  }
})

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tabInfo) {
    storage(tabInfo)
  })
})

var db = null

const internalIdArrays = []
// eslint-disable-next-line camelcase
function create_database () {
  const request = window.indexedDB.open('MyTimeDB-Tracking', 10)
  request.onerror = function (event) {
    console.log('Problem opening DB.', event)
  }
  request.onupgradeneeded = function (event) {
    db = event.target.result
    const tableList = storageTodayList()
    for (const tableName of tableList) {
      if (!db.objectStoreNames.contains('WEB_LOGS_' + tableName)) {
        const objectStore = db.createObjectStore('WEB_LOGS_' + tableName, {
          keyPath: 'id'
        })
        objectStore.transaction.oncomplete = function (event) {
          console.log('ObjectStore Created.')
        }
      }
    }

    db.createObjectStore('WEB_LIMIT_LOG', {
      keyPath: 'id'
    })
  }
  request.onsuccess = function (event) {
    db = event.target.result
    console.log('DB OPENED.')
    db.onerror = function (event) {
      console.log('FAILED TO OPEN DB.')
    }
  }
}
create_database()

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
  try {
    const url = new URL(tabInfo.url)
    const tempUrl = url.hostname
    const id = window.btoa(tempUrl)
    getLimitRecord(id).then(result => {
      if (result) {
        if (result.limitType === 1) {
          getRecord(id).then(resultOne => {
            if ((resultOne.wasteTime / 1000) > result.limitTime) {
              const message = 'This site has been viewed for ' + (result.limitTime / 60) + ' minutes today, please cherish the time'
              const jsCode = ' var node=document.getElementById("zhangshuo");if(node){document.body.removeChild(node)}' +
                'var a = document.createElement("div"); a.id = "zhangshuo"; a.style.height="300px" ;a.style.lineHeight="260px";a.style.textAlign="center" ;' +
                ' a.style.width="600px";a.style.position="fixed";a.style.backgroundColor="#333333";' +
                ' a.style.margin="auto";a.zIndex=9999;a.style.top=0;a.style.right=0;a.style.left=0;a.style.bottom=0;' +
                'document.body.appendChild(a);' +
                'var p = document.createElement("p");p.style.color="white";;p.style.fontSize="14px";p.nodeValue="zhangshuo";var t = document.createTextNode("' + message + '");p.appendChild(t);document.getElementById("zhangshuo").appendChild(p)'

              chrome.tabs.executeScript({
                code: jsCode
              })
            }
          })
        } else if (result.limitType === 2) {
          const checkAudit = checkAuditTime(result.startLimitTime, result.endLimitTime)
          if (checkAudit) {
            const message = 'Currently not in the time frame you have set for viewing, please cherish the time'
            const jsCode = ' var node=document.getElementById("zhangshuo");if(node){document.body.removeChild(node)}' +
              'var a = document.createElement("div"); a.id = "zhangshuo"; a.style.height="300px" ;a.style.lineHeight="260px";a.style.textAlign="center" ;' +
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
    })
    const internalId = setInterval(function () {
      getRecord(id).then(result => {
        if (result) {
          const dataOne = {
            id: id,
            website: tempUrl,
            faviconUrl: tabInfo.favIconUrl,
            wasteTime: result.wasteTime + 1000
          }
          updateRecord(dataOne)
        } else {
          const dataOne = {
            id: id,
            website: tempUrl,
            faviconUrl: tabInfo.favIconUrl,
            wasteTime: 1000
          }
          insert_records(dataOne)
        }
      })
    }, 1000)

    internalIdArrays.push(internalId)
  } catch (e) {
    console.log('insert error:', e)
  }
}

function clearAllInterval () {
  internalIdArrays.forEach(thisItem => {
    console.log('clearAllInterval:', thisItem)
    clearInterval(thisItem)
  })
}
// eslint-disable-next-line camelcase
function insert_records (records) {
  if (db) {
    const tableName = 'WEB_LOGS_' + storageToday()

    // eslint-disable-next-line camelcase
    const insert_transaction = db.transaction(tableName, 'readwrite')
    const objectStore = insert_transaction.objectStore(tableName)
    return new Promise((resolve, reject) => {
      insert_transaction.oncomplete = function () {
        // console.log('ALL INSERT TRANSACTIONS COMPLETE.')
        resolve(true)
      }
      insert_transaction.onerror = function () {
        console.log('PROBLEM INSERTING RECORDS.')
        resolve(false)
      }
      const request = objectStore.add(records)
      request.onsuccess = function () {
        // console.log('Added: ', records)
      }
    })
  }
}

function getLimitRecord (id) {
  if (db) {
    const tableName = 'WEB_LIMIT_LOG'
    // eslint-disable-next-line camelcase
    const get_transaction = db.transaction(tableName, 'readonly')
    const objectStore = get_transaction.objectStore(tableName)
    return new Promise((resolve, reject) => {
      get_transaction.oncomplete = function () {
      }
      get_transaction.onerror = function () {
        console.log('PROBLEM GETTING RECORDS.')
      }
      const request = objectStore.get(id)
      request.onsuccess = function (event) {
        resolve(event.target.result)
      }
    })
  }
}

function getRecord (id) {
  if (db) {
    const tableName = 'WEB_LOGS_' + storageToday()
    // eslint-disable-next-line camelcase
    const get_transaction = db.transaction(tableName, 'readonly')
    const objectStore = get_transaction.objectStore(tableName)
    return new Promise((resolve, reject) => {
      get_transaction.oncomplete = function () {
      }
      get_transaction.onerror = function () {
        console.log('PROBLEM GETTING RECORDS.')
      }
      const request = objectStore.get(id)
      request.onsuccess = function (event) {
        resolve(event.target.result)
      }
    })
  }
}

function updateRecord (record) {
  if (db) {
    const tableName = 'WEB_LOGS_' + storageToday()
    const putTransaction = db.transaction(tableName, 'readwrite')
    const objectStore = putTransaction.objectStore(tableName)
    return new Promise((resolve, reject) => {
      putTransaction.oncomplete = function () {
        console.log('ALL PUT TRANSACTIONS COMPLETE.')
        resolve(true)
      }
      putTransaction.onerror = function () {
        console.log('PROBLEM UPDATING RECORDS.')
        resolve(false)
      }
      objectStore.put(record)
    })
  }
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

function storageTodayList () {
  let date = new Date()

  const tableName = []
  for (let i = 1; i <= 30; i++) {
    let month = date.getMonth() + 1
    if ((date.getMonth() + 1) < 10) {
      month = '0' + (date.getMonth() + 1)
    }

    let dateOne = date.getDate()
    if (date.getDate() < 10) {
      dateOne = '0' + date.getDate()
    }
    const timeKey = date.getFullYear() + '' + month + '' + dateOne
    tableName.push(timeKey)
    date = new Date()
    date.setDate(date.getDate() + i)
  }

  return tableName
}
