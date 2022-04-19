<template>
  <div>
    <div style="position:absolute;left:10px;padding:10px">
      <i class="el-icon-arrow-left" style="cursor:pointer;" @click="showList"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailTime',
  methods: {
    showList () {
      this.$emit('switchTab', 'list')
    }
  }
}
</script>

<style scoped>

</style>
