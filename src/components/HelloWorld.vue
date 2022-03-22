<template>
  <div id="app">
    <el-table
     style="width: 100%"
     :data="tableData"
    >
      <el-table-column
        prop="faviconUrl"
        label="website"
        align="center"
      >
        <template slot-scope="scope">
          <img v-show="scope.row.faviconUrl && scope.row.faviconUrl !== 'undefined'" :src="scope.row.faviconUrl" style="width:25px;height:25px;">
          <div style="height:25px;line-height:25px">
            <span>{{scope.row.website}}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        prop="duration"
        label="duration"
        align="center"
      >
      </el-table-column>
    </el-table>
  </div>
</template>

<script>

export default {
  name: 'HelloWorld',
  components: {},
  data () {
    return {
      checkRadio: 'text',
      tableData: [],
      defaultText: '',
      faviconUrls: []
    }
  },
  mounted () {
    const _this = this
    _this.tableData = []
    chrome.storage.local.get('dataAll', function (data) {
      _this.defaultText = data.dataAll
      data.dataAll.forEach(thisItem => {
        if (thisItem.website && thisItem.website !== 'undefined') {
          _this.tableData.push(
            {
              website: thisItem.website,
              faviconUrl: thisItem.faviconUrl,
              duration: _this.convertTime(thisItem.wasteTime)
            }
          )
        }
      })
    })
  },
  created () {

  },
  computed: {

  },
  methods: {
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
    }
  }

}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
