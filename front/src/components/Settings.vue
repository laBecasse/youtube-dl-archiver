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
                Ymdp Url
                <input type="text" name="ympdUrl" :value="ympdUrl" v-on:change="change" v-bind:class="{'has-text-success': ympdClient, 'has-text-danger': !ympdClient}">
            </label>
        </div>

    </div>
</template>

<script>
 export default {
     data () {
         return {
             parameters: this.$root.parameters,
             ympdUrl: this.$root.parameters.get('ympdUrl')
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
             if (e.target.type === "checkbox") {
                 this.parameters.put(key, e.target.checked)
             } else {
                 this.parameters.put(key, e.target.value)
             }

             this[key] = e.target.value
         }
     }
 }
</script>

<style>
</style>
