<template>
  <div id="app">
    <div class="block">
      <el-date-picker
        v-model="date_value"
        type="date"
        value-format="yyyy-MM-dd"
        placeholder="select date"
        @change="changeDate"
      >
      </el-date-picker>
    </div>
    <el-table
     style="width: 100%;margin-top: 15px"
      height="500"
     :data="tableData"
    >
      <el-table-column
        prop="duration"
        label="WEBSITE"
        align="center"
      >
        <el-table-column
          prop="website"
          label="Name"
          width="200"
          align="center"
        >
          <template slot-scope="scope">
            <el-link type="primary">{{scope.row.website}}</el-link>
          </template>
        </el-table-column>
        <el-table-column
          prop="faviconUrl"
          align="center"
          label="Icon"
        >
          <template slot-scope="scope">
            <img v-if="scope.row.website === 'www.youtube.com' " src="../assets/youtube.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website === 'www.google.com' " src="../assets/google.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website === 'twitter.com' " src="../assets/Twitter.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website.indexOf('ycombinator.com')>=0 " src="../assets/ycombinator.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website.indexOf('wikipedia.org')>=0 " src="../assets/wikipedia-w.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website.indexOf('medium.com')>=0 " src="../assets/medium.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.faviconUrl && scope.row.faviconUrl !== 'undefined'" :src="scope.row.faviconUrl" style="width:25px;height:25px;" alt="">
            <img v-else src="../assets/emoji.png" style="width:25px;height:25px;" alt="">
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column
        prop="wasteTime"
        label="DURATION"
        align="center"
      >
        <template slot-scope="scope">
          <span>{{scope.row.duration}}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="Detail Time"
        align="center"
      >
        <template slot-scope="scope">
          <el-link type="primary" @click="detailTime(scope.row)">Detail</el-link>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="Time Limit Settings" width="60%" :visible.sync="dialogVisible">
      <div style="text-align:left;padding: 10px;">
        &nbsp;<span>hours:</span><el-input-number size="mini" v-model="hour_num"></el-input-number>
         <span>minutes:</span><el-input-number size="mini" v-model="minutes_num"></el-input-number>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="small">Cancel</el-button>
        <el-button type="primary" @click="saveLimit" size="small">Submit</el-button>
      </div>
    </el-dialog>
    <el-dialog title="Time Period Settings" width="60%" :visible.sync="dialogVisiblePeriod">
      <div style="text-align:center;padding: 25px">
        <el-time-picker
          style="width: 240px;"
          is-range
          size="small"
          v-model="limit_time_range"
          range-separator="-"
          value-format="HH:mm"
          start-placeholder="start time"
          end-placeholder="end time"
          placeholder="select time range">
        </el-time-picker>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisiblePeriod = false" size="small">Cancel</el-button>
        <el-button type="primary" @click="saveLimitPeriod" size="small">Submit</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import dbDexie from '../utils/db_dexie'
import Dexie from 'dexie'
const dayjs = require('dayjs')
export default {
  name: 'HelloWorld',
  data () {
    return {
      checkRadio: 'text',
      tableData: [],
      tableLoading: false,
      currentPage: 1,
      time_radio: 1,
      faviconUrls: [],
      hour_num: 0,
      minutes_num: 0,
      activeIndex: 10,
      dialogVisible: false,
      dialogVisiblePeriod: false,
      limit_time_range: '',
      urlid: '',
      days_links: [],
      date_value: dayjs().format('YYYY-MM-DD'),
      days_links_value: [],
      indexDB: null
    }
  },
  mounted () {
    this.getLimitRecordById()

    const request = window.indexedDB.open('MyTimeDB-Tracking')
    request.onerror = function (event) {
      console.log('Problem opening DB.', event)
    }

    const _this = this
    request.onsuccess = function (event) {
      _this.indexDB = event.target.result
      console.log('DB OPENED.')
      _this.indexDB.onerror = function (event) {
        console.log('FAILED TO OPEN DB.')
      }
    }
  },
  created () {

  },
  computed: {

  },
  methods: {
    async getLimitRecordById () {
      const tableName = 'WEB_LOGS_' + dayjs().format('YYYYMMDD')
      const result = await dbDexie[tableName].reverse().sortBy('wasteTime')
      this.tableData = []
      for (const thisItem of result) {
        this.tableData.push(
          {
            id: thisItem.id,
            website: thisItem.website,
            faviconUrl: thisItem.faviconUrl,
            duration: this.convertTime(thisItem.wasteTime)
          }
        )
      }
    },
    handleCurrentChange (val) {
      this.currentPage = val
    },
    saveLimit () {
      if (!this.hour_num && !this.minutes_num) {
        this.$message({
          message: 'please enter hours and minutes',
          type: 'warning'
        })
        return
      }
      const params = {
        limitType: 1,
        limitTime: (this.hour_num * 60 * 60) + (this.minutes_num * 60),
        id: this.urlid
      }
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      setTimeout(() => {
        loading.close()
        this.dialogVisible = false
      }, 1000)

      const _this = this
      this.getLimitRecord(this.urlid).then(res => {
        if (res) {
          const putTransaction = this.indexDB.transaction('WEB_LIMIT_LOG', 'readwrite')
          const objectStore = putTransaction.objectStore('WEB_LIMIT_LOG')
          objectStore.put(params)
        } else {
          const insertTransaction = this.indexDB.transaction('WEB_LIMIT_LOG', 'readwrite')
          const objectStore = insertTransaction.objectStore('WEB_LIMIT_LOG')
          const request = objectStore.add(params)
          request.onsuccess = function () {
            console.log('Added: ', params)
          }
        }
        _this.getLimitRecordById()
      })
    },
    getLimitRecord (id) {
      if (this.indexDB) {
        const tableName = 'WEB_LIMIT_LOG'
        // eslint-disable-next-line camelcase
        const get_transaction = this.indexDB.transaction(tableName, 'readonly')
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
    },
    saveLimitPeriod () {
      if (!this.limit_time_range) {
        this.$message({
          message: 'please enter time range',
          type: 'warning'
        })
        return
      }

      const params = {
        limitType: 2,
        startLimitTime: this.limit_time_range[0],
        endLimitTime: this.limit_time_range[1],
        id: this.urlid
      }
      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })
      setTimeout(() => {
        loading.close()
        this.dialogVisiblePeriod = false
      }, 2000)
      // 存储限制时间

      const _this = this
      this.getLimitRecord(this.urlid).then(res => {
        if (res) {
          const putTransaction = this.indexDB.transaction('WEB_LIMIT_LOG', 'readwrite')
          const objectStore = putTransaction.objectStore('WEB_LIMIT_LOG')
          objectStore.put(params)
        } else {
          const insertTransaction = this.indexDB.transaction('WEB_LIMIT_LOG', 'readwrite')
          const objectStore = insertTransaction.objectStore('WEB_LIMIT_LOG')
          const request = objectStore.add(params)
          request.onsuccess = function () {
            console.log('Added: ', params)
          }
        }
        _this.getLimitRecordById()
      })
    },
    detailTime (row) {
      window.open('detail.html')
    },
    setLimitTime (row) {
      this.dialogVisible = true
      this.urlid = row.id
    },
    setLimitPeriod (row) {
      this.dialogVisiblePeriod = true
      this.urlid = row.id
    },
    viewDetailTime (row) {
      this.$emit('switchTab', 'detail')
    },
    storageToday () {
      const date = new Date()
      const timeKey = date.getFullYear() + '' + (date.getMonth() + 1) + '' + date.getDate()
      return timeKey
    },
    convertTime (usedTime) {
      const leave1 = usedTime % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
      const hours = Math.floor(leave1 / (3600 * 1000))
      // 计算相差分钟数
      const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
      const minutes = Math.floor(leave2 / (60 * 1000))

      // 计算相差分钟数
      const leave3 = leave2 % (60 * 1000)
      const seconds = Math.floor(leave3 / 1000)
      if (hours > 0) {
        const time = hours + 'h ' + minutes + 'm ' + seconds + 's'
        return time
      }
      if (minutes > 0) {
        const time = minutes + 'm ' + seconds + 's '
        return time
      }
      const time = seconds + 's '
      return time
    },
    cancelLimit (row) {
      const params = {
        limitType: 0,
        id: row.id
      }
      dbDexie.WEB_LIMIT_LOG.update(row.id, params)
    },
    async changeDate (value) {
      const tableName = 'WEB_LOGS_' + value.replaceAll('-', '')
      if (this.indexDB.objectStoreNames.contains(tableName)) {
        const dbDexieTwo = new Dexie('MyTimeDB-Tracking')
        dbDexieTwo.version(1).stores({
          [tableName]: 'id'
        })
        const result = await dbDexieTwo[tableName].reverse().sortBy('wasteTime')
        this.tableData = []
        for (const thisItem of result) {
          this.tableData.push(
            {
              id: thisItem.id,
              website: thisItem.website,
              faviconUrl: thisItem.faviconUrl,
              duration: this.convertTime(thisItem.wasteTime)
            }
          )
        }
        dbDexieTwo.close()
      }
    }
  }

}
</script>

<style scoped>
p {
  font-size: 20px;
}

</style>
