import Dexie from 'dexie'

const dbDexie = new Dexie('MyTimeDB-Tracking')

const today = 'WEB_LOGS_20220516'
dbDexie.version(1).stores({
  WEB_LIMIT_LOG: 'id',
  [today]: 'id'
})

export default dbDexie
