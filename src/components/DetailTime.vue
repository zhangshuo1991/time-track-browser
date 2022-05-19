<template>
  <div class="container">
    <div class="c-chart-pie" style="background-color: white;padding: 15px;height:370px;">
      <div class="block">
        <el-date-picker
          v-model="date_value"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="select date">
        </el-date-picker>
      </div>
      <div style="height:300px;width:100%">
        <vchart :autoresize="true" style="height:370px;width: 100%" :options="pieChartIndus" @click="pieClick"></vchart>
      </div>
    </div>
    <el-divider></el-divider>
    <div class="c-chart-bar" style="background-color: white;padding: 15px;height:300px;">
      <div style="height:300px;width:100%">
        <vchart :autoresize="true" style="height:300px;width: 100%" :options="barOptions"></vchart>
      </div>
    </div>
  </div>
</template>
<script>
import dbDexie from '../utils/db_dexie'
import dayjs from 'dayjs'
import Vchart from 'vue-echarts'
export default {
  name: 'DetailTime',
  components: { Vchart },
  data () {
    return {
      tableData: [],
      currentPage: 1,
      indexDB: null,
      total: 0,
      date_value: dayjs().format('YYYY-MM-DD'),
      bar_sublink: '',
      bar_title: '',
      firstParams: {},
      barOptions: {
        title: {
          text: '',
          subtext: 'Time Spent Per Day',
          sublink: ''
        },
        xAxis: {
          type: 'category',
          data: []
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params) {
            return params[0].name + '<br/>' + params[0].value
          }
        },
        grid: {
          bottom: 20
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [],
            type: 'bar',
            label: {
              show: true,
              position: 'top',
              formatter: function (params) {
                return params.data.wasteTime
              }
            }
          }
        ]
      },
      pieChartIndus: {
        title: {
          text: 'Website WasteTime'
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            return params.data.name + '<br>' + params.data.convertTime + '(' + params.percent + '%)'
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 20
        },
        series: [
          {
            name: 'WasteTime',
            type: 'pie',
            radius: '75%',
            center: ['45%', '48%'],
            data: [],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
    }
  },
  mounted () {
    this.getPieChart()

    const request = window.indexedDB.open('MyTimeDB-Tracking')
    request.onerror = function (event) {
      console.log('Problem opening DB.', event)
    }

    const _this = this
    request.onsuccess = async function (event) {
      _this.indexDB = event.target.result
      console.log('DB OPENED.')
      _this.indexDB.onerror = function (event) {
        console.log('FAILED TO OPEN DB.')
      }
    }
  },
  methods: {
    handleCurrentChange (val) {
      this.currentPage = val
    },
    getRecord (id, tableName) {
      if (this.indexDB) {
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
    async pieClick (params) {
      const days = []

      const dayLabels = []
      for (let i = 0; i <= 15; i++) {
        days.push(
          dayjs().add(-i, 'day').format('YYYYMMDD')
        )

        dayLabels.push(
          dayjs().add(-i, 'day').format('YYYY-MM-DD')
        )
      }
      const id = params.data.id
      const dayCategories = []
      const dayValues = []
      for (let i = 0; i < days.length; i++) {
        const tableName = 'WEB_LOGS_' + days[i]

        if (this.indexDB.objectStoreNames.contains(tableName)) {
          const result = await this.getRecord(id, tableName)
          if (result) {
            dayCategories.push(dayLabels[i])
            const values = {
              value: result.wasteTime,
              wasteTime: this.convertTime(result.wasteTime),
              itemStyle: {
                color: this.generateRandomColor()
              }
            }
            dayValues.push(values)
          }
        }
      }
      this.barOptions.title.text = params.data.name
      this.barOptions.title.sublink = 'http://' + params.data.name
      this.barOptions.xAxis.data = dayCategories
      this.barOptions.series[0].data = dayValues
    },
    async getPieChart () {
      const tableName = 'WEB_LOGS_' + dayjs().format('YYYYMMDD')
      const result = await dbDexie[tableName].reverse().sortBy('wasteTime')

      const oppoIndus = []
      for (const thisItem of result) {
        oppoIndus.push(
          {
            id: thisItem.id,
            name: thisItem.website,
            value: thisItem.wasteTime,
            convertTime: this.convertTime(thisItem.wasteTime),
            itemStyle: {
              color: this.generateRandomColor()
            }
          }
        )
      }
      this.pieChartIndus.series[0].data = oppoIndus
      const params = {
        data: {
          id: oppoIndus[0].id,
          name: oppoIndus[0].name
        }
      }
      this.pieClick(params)
    },
    generateRandomColor () {
      const maxVal = 0xFFFFFF // 16777215
      let randomNumber = Math.random() * maxVal
      randomNumber = Math.floor(randomNumber)
      randomNumber = randomNumber.toString(16)
      const randColor = randomNumber.padStart(6, 0)
      return `#${randColor.toUpperCase()}`
    },
    cancelLimit (row) {
      const params = {
        limitType: 0,
        id: row.id
      }
      dbDexie.WEB_LIMIT_LOG.update(row.id, params)
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
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #ffffff;
}
</style>
