<template>
  <div id="app">
    <hello-world/>
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'App',
  components: { HelloWorld }
}
</script>

<style>
  html {
    height: 550px;
    width: 800px;
  }
</style>
