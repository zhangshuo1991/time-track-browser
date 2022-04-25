<template>
  <div class="container">
    <div class="c-list" style="background-color: white;min-height: 350px;padding: 15px;height:400px">
      <el-table
        style="width: 100%;"
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
            label="website"
          >
          </el-table-column>
          <el-table-column
            prop="faviconUrl"
            label="websiteIcon"
            align="center"
          >
            <template slot-scope="scope">
              <img v-if="scope.row.website === 'www.youtube.com' " src="../assets/youtube.png" style="width:25px;height:25px;" alt="">
              <img v-else-if="scope.row.website === 'www.google.com' " src="../assets/google.png" style="width:25px;height:25px;" alt="">
              <img v-else-if="scope.row.website === 'twitter.com' " src="../assets/Twitter.png" style="width:25px;height:25px;" alt="">
              <img v-else-if="scope.row.website.indexOf('ycombinator.com')>=0 " src="../assets/ycombinator.png" style="width:25px;height:25px;" alt="">
              <img v-else-if="scope.row.website.indexOf('wikipedia.org')>=0 " src="../assets/wikipedia-w.png" style="width:25px;height:25px;" alt="">
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
      </el-table>
      <div class="block" style="text-align: right;">
        <el-pagination
          layout="pager"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :total="tableData.length">
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailTime',
  data () {
    return {
      tableData: [],
      currentPage: 1
    }
  },
  mounted () {
    this.tableData = JSON.parse(window.localStorage.getItem('tableData'))
  },
  methods: {
    handleCurrentChange (val) {
      this.currentPage = val
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #ffffff;min-height: 420px;
}
</style>
