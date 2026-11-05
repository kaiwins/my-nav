<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

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

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = props.initial.name || ''
      url.value = props.initial.url || ''
      categoryId.value = props.initial.categoryId || props.categories[0]?.id || ''
      error.value = ''
      confirming.value = false
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
    <Transition name="modal">
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
            <label class="field">
              <span>分类</span>
              <select v-model="categoryId">
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </label>
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
