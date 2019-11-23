<template>

<div class="field">
  <div class="control">
    <label class="checkbox">
      <input type="checkbox" v-model="darkMode" v-on:change="emitSettings">
      Dark Mode
    </label>
  </div>
</div>
</template>

<script>
export default {
  data () {
    return {
      darkMode: false
    }
  },
  methods: {
    emitSettings () {
        this.$store.commit('setSettings', this)
    }
  }
}
</script>

<style>
</style>
