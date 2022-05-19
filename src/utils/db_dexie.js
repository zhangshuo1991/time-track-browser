import Dexie from 'dexie'

const dbDexie = new Dexie('MyTimeDB-Tracking')

const today = 'WEB_LOGS_' + storageToday()

dbDexie.version(1).stores({
  WEB_LIMIT_LOG: 'id',
  [today]: 'id'
})

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

export default dbDexie
