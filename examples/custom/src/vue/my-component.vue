<template>
  <div class="my-component">
    {{ text }}
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const text = ref('hello world')
</script>

<style lang="scss">
  $primary-color: #333;

  .my-component {
    color: #567;

    & > div {
      color: $primary-color;
    }
  }
</style>