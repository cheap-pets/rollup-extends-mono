<template>
  <div class="my-component">
    {{ text }}
  </div>
</template>

<script setup>
  import { ref } from 'vue'

  const text = ref('hello world')
</script>

<style>
  .my-component {
    color: #567;
  }
</style>