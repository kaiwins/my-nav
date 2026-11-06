<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  open: Boolean,
  mode: { type: String, default: 'add' },
  categories: { type: Array, required: true },
  initial: { type: Object, default: () => ({ name: '', url: '', categoryId: '' }) },
})
const emit = defineEmits(['save', 'delete', 'close'])

const name = ref('')
const url = ref('')
const categoryId = ref('')
const error = ref('')
const confirming = ref(false)
const nameInput = ref(null)

/* ---------- 自定义分类下拉 ---------- */
const catOpen = ref(false)
const catFilter = ref('')
const cselectEl = ref(null)
const catFilterInput = ref(null)
const selectedCat = computed(() => props.categories.find((c) => c.id === categoryId.value))
const filteredCats = computed(() => {
  const f = catFilter.value.trim().toLowerCase()
  return f ? props.categories.filter((c) => c.name.toLowerCase().includes(f)) : props.categories
})

function toggleCat() {
  catOpen.value = !catOpen.value
  catFilter.value = ''
  if (catOpen.value) nextTick(() => catFilterInput.value?.focus())
}
/* Esc 分级:下拉面板开着只关面板(拦截冒泡),否则放行给弹窗整体关闭 */
function onFilterKeydown(e) {
  if (e.key === 'Escape' && catOpen.value) {
    catOpen.value = false
    e.stopPropagation()
  }
}
function chooseCat(c) {
  categoryId.value = c.id
  catOpen.value = false
}
function onDocMouseDown(e) {
  if (cselectEl.value && !cselectEl.value.contains(e.target)) catOpen.value = false
}
watch(catOpen, (v) => {
  if (v) window.addEventListener('mousedown', onDocMouseDown)
  else window.removeEventListener('mousedown', onDocMouseDown)
})
onUnmounted(() => window.removeEventListener('mousedown', onDocMouseDown))

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = props.initial.name || ''
      url.value = props.initial.url || ''
      categoryId.value = props.initial.categoryId || props.categories[0]?.id || ''
      error.value = ''
      confirming.value = false
      catOpen.value = false
      nextTick(() => nameInput.value?.focus())
      window.addEventListener('keydown', onKey)
    } else {
      window.removeEventListener('keydown', onKey)
    }
  }
)

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

function submit() {
  if (!name.value.trim()) { error.value = '请填写名称'; return }
  if (!url.value.trim()) { error.value = '请填写网址'; return }
  if (!categoryId.value) { error.value = '请选择分类'; return }
  emit('save', { name: name.value.trim(), url: url.value.trim(), categoryId: categoryId.value })
}

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" :duration="180">
      <div v-if="open" class="modal-mask" @mousedown.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <template v-if="!confirming">
            <h3>{{ mode === 'add' ? '添加链接' : '编辑链接' }}</h3>
            <label class="field">
              <span>名称</span>
              <input ref="nameInput" v-model="name" placeholder="例如 GitHub" @keydown.enter="submit" />
            </label>
            <label class="field">
              <span>网址</span>
              <input v-model="url" placeholder="github.com 或 https://github.com" @keydown.enter="submit" />
            </label>
            <div class="field">
              <span>分类</span>
              <div class="cselect" ref="cselectEl">
                <button
                  type="button"
                  class="cselect-btn"
                  :class="{ 'is-open': catOpen }"
                  aria-haspopup="listbox"
                  :aria-expanded="catOpen ? 'true' : 'false'"
                  @click="toggleCat"
                >
                  <span class="nv-dot" :style="{ background: selectedCat?.color || '#a1a1aa' }"></span>
                  <span class="cselect-label">{{ selectedCat?.name || '请选择分类' }}</span>
                  <Icon name="chevron-down" />
                </button>
                <div v-if="catOpen" class="cselect-panel" role="listbox">
                  <input
                    v-if="categories.length > 8"
                    ref="catFilterInput"
                    v-model="catFilter"
                    class="cselect-filter"
                    type="text"
                    placeholder="筛选分类…"
                    @keydown="onFilterKeydown"
                  />
                  <button
                    v-for="c in filteredCats"
                    :key="c.id"
                    type="button"
                    class="cselect-opt"
                    :class="{ 'is-active': c.id === categoryId }"
                    @click="chooseCat(c)"
                  >
                    <span class="nv-dot" :style="{ background: c.color }"></span>{{ c.name }}
                  </button>
                  <div v-if="!filteredCats.length" class="cselect-empty">没有匹配的分类</div>
                </div>
              </div>
            </div>
            <p v-if="error" class="modal-error">{{ error }}</p>
            <div class="modal-actions">
              <button v-if="mode === 'edit'" class="btn-danger" type="button" @click="confirming = true">删除</button>
              <span class="spacer"></span>
              <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
              <button class="btn-primary" type="button" @click="submit">保存</button>
            </div>
          </template>
          <template v-else>
            <h3>删除链接</h3>
            <p class="confirm-text">确定要删除「{{ initial.name }}」吗?</p>
            <p class="confirm-text confirm-sub">删除后无法恢复。</p>
            <div class="modal-actions">
              <span class="spacer"></span>
              <button class="btn-ghost" type="button" @click="confirming = false">取消</button>
              <button class="btn-danger-solid" type="button" @click="emit('delete')">确认删除</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
