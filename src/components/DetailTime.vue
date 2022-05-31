<template>
  <div class="container">
    <div class="c-chart-pie" style="background-color: white;padding: 15px;height:370px;">
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
      <div style="height:300px;width:50%;float:left">
        <vchart :autoresize="true" style="height:370px;width: 100%" :options="pieChartIndus" @click="pieClick"></vchart>
      </div>
      <div style="height:300px;width:50%;float:left">
        <vchart :autoresize="true" style="height:370px;width: 100%" :options="lineOptions"></vchart>
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
import Dexie from 'dexie'
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
      lineOptions: {
        title: {
          text: 'Visit Website Count'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: []
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [],
            type: 'line',
            smooth: true,
            areaStyle: {}
          }
        ]
      },
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
            const leave1 = params[0].value % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
            const hours = Math.floor(leave1 / (3600 * 1000))
            // 计算相差分钟数
            const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
            const minutes = Math.floor(leave2 / (60 * 1000))

            // 计算相差分钟数
            const leave3 = leave2 % (60 * 1000)
            const seconds = Math.floor(leave3 / 1000)
            if (hours > 0) {
              const time = hours + 'h ' + minutes + 'm ' + seconds + 's'
              return params[0].name + '<br/>' + time
            }
            if (minutes > 0) {
              const time = minutes + 'm ' + seconds + 's '
              return params[0].name + '<br/>' + time
            }
            const time = seconds + 's '
            return params[0].name + '<br/>' + time
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
            markLine: {
              lineStyle: {
                color: '#EE6666'
              },
              label: {
                color: '#EE6666',
                formatter: function (params) {
                  const leave1 = params.value % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
                  const hours = Math.floor(leave1 / (3600 * 1000))
                  // 计算相差分钟数
                  const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
                  const minutes = Math.floor(leave2 / (60 * 1000))

                  // 计算相差分钟数
                  const leave3 = leave2 % (60 * 1000)
                  const seconds = Math.floor(leave3 / 1000)
                  let time
                  if (hours > 0) {
                    time = hours + 'h ' + minutes + 'm ' + seconds + 's'
                    return time
                  }
                  if (minutes > 0) {
                    time = minutes + 'm ' + seconds + 's '
                    return time
                  }
                  time = seconds + 's '
                  return time
                }
              },
              data: [{ type: 'average', name: 'Avg' }]
            },
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
          type: 'scroll',
          right: 10,
          top: 20
        },
        series: [
          {
            name: 'Access From',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '20',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: []
          }
        ]
      }
    }
  },
  mounted () {
    this.getPieChart('WEB_LOGS_' + dayjs().format('YYYYMMDD'))
    const request = window.indexedDB.open('MyTimeDB-Tracking')
    request.onerror = function (event) {
      console.log('Problem opening DB.', event)
    }

    const _this = this
    request.onsuccess = async function (event) {
      _this.indexDB = event.target.result
      console.log('DB OPENED.')
      _this.lineChart()
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
    getCountValueByDay (tableName) {
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
          const request = objectStore.count()
          request.onsuccess = function (event) {
            resolve(event.target.result)
          }
        })
      }
    },
    async changeDate (value) {
      const tableName = 'WEB_LOGS_' + value.replaceAll('-', '')
      console.log(tableName)
      if (this.indexDB.objectStoreNames.contains(tableName)) {
        const dbDexieTwo = new Dexie('MyTimeDB-Tracking')
        dbDexieTwo.version(1).stores({
          [tableName]: 'id'
        })
        const result = await dbDexieTwo[tableName].reverse().sortBy('wasteTime')
        dbDexieTwo.close()

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
      }
    },
    async lineChart () {
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

      const dayCategories = []
      const dayValues = []
      for (let i = 0; i < days.length; i++) {
        const tableName = 'WEB_LOGS_' + days[i]

        if (this.indexDB.objectStoreNames.contains(tableName)) {
          const result = await this.getCountValueByDay(tableName)
          if (result) {
            dayCategories.push(dayLabels[i])
            dayValues.push(result)
          }
        }
      }

      this.lineOptions.xAxis.data = dayCategories
      this.lineOptions.series[0].data = dayValues
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
    async getPieChart (tableName) {
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
