<template>
    <div class="field">
        <div class="control">
            <label class="checkbox">
                <input type="checkbox" name="darkMode" v-on:change="change">
                Dark Mode
            </label>
        </div>
        <div class="control">
            <label class="checkbox">
                Ymdp Url <span v-if="!ympdClient"> (disabled)</span>
                <input type="text" name="YMPD_URL" :value="YMPD_URL" v-on:change="change">
            </label>
        </div>

    </div>
</template>

<script>
 export default {
     data () {
         return {
             parameters: this.$root.getParameters(),
             'YMPD_URL': this.$root.getParameters().get('YMPD_URL'),
             errors: {}
         }
     },
     computed: {
         ympdClient () {
             return this.$root.ympdClient
         }
     },
     methods: {
         change (e) {
             const key = e.target.name
             let promise
             if (e.target.type === "checkbox") {
                 promise = this.parameters.put(key, e.target.checked)
             } else {
                 promise = this.parameters.put(key, e.target.value)
             }
             const t = this
             promise
                 .then(() => {
                     t.errors[key] = false
                 })
                 .catch(() => {
                     console.log(t.errors)
                     t.errors[key] = true
                 })
         }
     }
 }
</script>

<style>
</style>
