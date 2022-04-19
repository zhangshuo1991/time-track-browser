<template>
  <div id="app">
    <transition name="component-fade" mode="out-in">
      <hello-world v-show="showComponent === 'list'" @switchTab="switchTab"/>
    </transition>
    <transition name="component-fade" mode="out-in">
      <detail-time v-show="showComponent === 'detail'" @switchTab="switchTab"/>
    </transition>
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'
import DetailTime from '@/components/DetailTime.vue'

export default {
  name: 'App',
  components: { HelloWorld, DetailTime },
  data () {
    return {
      showComponent: 'list'
    }
  },
  methods: {
    switchTab (value) {
      this.showComponent = value
    }
  }
}
</script>

<style>

.component-fade-enter-active, .component-fade-leave-active {
  transition: opacity .3s ease;
}
.component-fade-enter, .component-fade-leave-to
  /* .component-fade-leave-active for below version 2.1.8 */ {
  opacity: 0;
}
html {
  width: 800px;
  height: 450px;
}
</style>
