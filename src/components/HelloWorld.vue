<template>
  <div id="app">
    <div>
      <swiper class="swiper" :options="swiperOption" style="height:30px;line-height: 30px">
        <swiper-slide v-for="item in days_links" :key="item" style="width:25px;height:25px;text-align:center">
          <el-link :underline="false" style="font-size:20px">{{item}}</el-link>
        </swiper-slide>
        <div class="swiper-button-prev" slot="button-prev" @click="preClick"></div>
        <div class="swiper-button-next" slot="button-next"></div>
      </swiper>
    </div>
    <el-table
     style="width: 100%"
     :data="tableData.slice((currentPage-1)*10,currentPage*10)"
    >
      <el-table-column
        prop="duration"
        label="WEBSITE"
        align="center"
      >

        <el-table-column
          prop="website"
          align="center"
        >
        </el-table-column>
        <el-table-column
          prop="faviconUrl"
          align="center"
        >
          <template slot-scope="scope">
            <img v-if="scope.row.website === 'www.youtube.com' " src="../assets/youtube.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website === 'www.google.com' " src="../assets/google.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website === 'twitter.com' " src="../assets/Twitter.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.website.indexOf('ycombinator.com')>=0 " src="../assets/ycombinator.png" style="width:25px;height:25px;" alt="">
            <img v-else-if="scope.row.faviconUrl && scope.row.faviconUrl !== 'undefined'" :src="scope.row.faviconUrl" style="width:25px;height:25px;" alt="">
            <img v-else src="../assets/emoji.png" style="width:25px;height:25px;" alt="">
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column
        prop="duration"
        label="DURATION"
        align="center"
      >
      </el-table-column>
      <el-table-column
        label="Operation"
        align="center"
      >
        <template slot-scope="scope">
          <el-link type="primary" @click="setLimitTime(scope.row)">Limit Time</el-link>
        </template>
      </el-table-column>
    </el-table>
    <div class="block" style="text-align: right;">
      <el-pagination
        layout="pager"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :total="tableData.length">
      </el-pagination>
    </div>

    <el-dialog title="Time Settings" width="60%" :visible.sync="dialogVisible">
      <div>
        <el-radio-group v-model="time_radio">
          <el-radio :label="1">Time limits</el-radio>
          <el-radio :label="2">Time Period Limit</el-radio>
        </el-radio-group>
      </div>
      <div v-show="time_radio === 1" style="text-align:left;padding: 10px">
        &nbsp;&nbsp;&nbsp;<span>hours:&nbsp;&nbsp;</span><el-input-number size="mini" v-model="hour_num"></el-input-number>
      </div>
      <div v-show="time_radio === 1" style="text-align:left;padding: 10px">
        <span>minutes:&nbsp;&nbsp;</span><el-input-number size="mini" v-model="minutes_num"></el-input-number>
      </div>
      <div v-show="time_radio === 2" style="text-align:center;padding: 25px">
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
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveLimit">Submit</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { Swiper, SwiperSlide } from 'vue-awesome-swiper'
import 'swiper/css/swiper.css'
const dayjs = require('dayjs')
export default {
  name: 'HelloWorld',
  // eslint-disable-next-line vue/no-unused-components
  components: { Swiper, SwiperSlide },
  data () {
    return {
      swiperOption: {
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        initialSlide: 10
      },
      checkRadio: 'text',
      tableData: [],
      currentPage: 1,
      time_radio: 1,
      faviconUrls: [],
      hour_num: 0,
      minutes_num: 0,
      dialogVisible: false,
      limit_time_range: '',
      urlid: '',
      days_links: []
    }
  },
  mounted () {
    const _this = this
    _this.tableData = []
    chrome.storage.local.get('dataAll', function (data) {
      if (data.dataAll && data.dataAll.length > 0) {
        data.dataAll.forEach(thisItem => {
          _this.tableData.push(
            {
              id: thisItem.id,
              website: thisItem.website,
              faviconUrl: thisItem.faviconUrl,
              duration: _this.convertTime(thisItem.wasteTime)
            }
          )
        })
      }
    })

    for (let i = 10; i >= 0; i--) {
      this.days_links.push(
        dayjs().add(-i, 'day').format('YYYY-MM-DD')
      )
    }
  },
  created () {

  },
  computed: {

  },
  methods: {
    handleCurrentChange (val) {
      this.currentPage = val
    },
    saveLimit () {
      const _this = this
      if (this.time_radio === 1) {
        if (!this.hour_num && !this.minutes_num) {
          this.$message({
            message: 'please enter hours and minutes',
            type: 'warning'
          })
          return
        }
      }
      if (this.time_radio === 2) {
        if (!this.limit_time_range) {
          this.$message({
            message: 'please enter time range',
            type: 'warning'
          })
          return
        }
      }
      const params = {
        limitType: this.time_radio,
        limitTime: (this.hour_num * 60 * 60) + (this.minutes_num * 60),
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
      }, 3000)
      chrome.runtime.sendMessage(params, function (response) {
        _this.dialogVisible = false
        _this.time_radio = 1
        _this.hour_num = 0
        _this.minutes_num = 0
        _this.urlid = ''
      })
    },
    preClick (event) {
      console.log(event)
    },
    setLimitTime (row) {
      console.log(row)
      this.dialogVisible = true
      this.urlid = row.id
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
    }
  }

}
</script>

<style scoped>
p {
  font-size: 20px;
}

</style>
