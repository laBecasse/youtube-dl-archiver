<template>
<div
  class="ion"
  :class="ionClass"
  :data-title="iconTitle"
  data-name="logo-peertube-icon">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="2799 -911 16 22">
    <defs/>
    <g data-name="Artboard – 1">
      <g data-name="Symbol 3 – 1">
        <g data-name="Group 44">
          <path fill="#211f20" d="M2799-911v11l8-5" data-name="Path 4"/>
          <path fill="#737373" d="M2799-900v11l8-6" data-name="Path 5"/>
          <path fill="#f1680d" d="M2807-905v10l8-5" data-name="Path 6"/>
          <path fill="transparent" d="M2807-895v-10l-8 5z" data-name="Path 7"/>
        </g>
      </g>
    </g>
  </svg>
</div>
</template>

<script>
import IoniconsMixin from 'vue-ionicons/dist/ionicons-mixin'

export default {
  name: "logo-peertube-icon",
  mixins: [
    IoniconsMixin
  ],
  data () {
    let iconTitle = this.title ? this.title : "Logo Peertube Icon"
    return {
      iconTitle: iconTitle
    }
  }
}
</script>

