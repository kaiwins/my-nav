<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  url: { type: String, required: true },
  color: { type: String, default: '#4f46e5' },
  name: { type: String, default: '' },
})

// 三级回退:站点自带 favicon.ico → 国内公共图标源 → 分类色点
const stage = ref(0)
const loaded = ref(false)
let timer = null

const host = computed(() => {
  try { return new URL(props.url).hostname } catch { return '' }
})
const sources = computed(() =>
  host.value
    ? ['https://' + host.value + '/favicon.ico', 'https://favicon.im/' + host.value + '?larger=true']
    : []
)
const src = computed(() => sources.value[stage.value] || '')
const isFallback = computed(() => stage.value >= sources.value.length)

function arm() {
  clearTimeout(timer)
  if (!isFallback.value) timer = setTimeout(() => advance(), 4000)
}
function advance() {
  clearTimeout(timer)
  loaded.value = false
  if (stage.value < sources.value.length) {
    stage.value++
    arm()
  }
}
function onLoad() {
  clearTimeout(timer)
  loaded.value = true
}
function onError() {
  advance()
}

watch(() => props.url, () => {
  stage.value = 0
  loaded.value = false
  arm()
})

arm()
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <span class="nv-fav">
    <span v-if="isFallback || !loaded" class="nv-dot" :style="{ background: color }"></span>
    <img
      v-if="!isFallback"
      :src="src"
      alt=""
      class="nv-fav-img"
      :class="{ 'is-loaded': loaded }"
      referrerpolicy="no-referrer"
      @load="onLoad"
      @error="onError"
    />
  </span>
</template>
