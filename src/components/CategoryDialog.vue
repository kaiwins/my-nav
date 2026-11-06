<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { PALETTE } from '../store.js'

const props = defineProps({
  open: Boolean,
  mode: { type: String, default: 'add' },
  initial: { type: Object, default: () => ({ name: '', color: '' }) },
  linkCount: { type: Number, default: 0 },
})
const emit = defineEmits(['save', 'delete', 'close'])

const name = ref('')
const color = ref('')
const error = ref('')
const confirming = ref(false)
const nameInput = ref(null)

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = props.initial.name || ''
      color.value = props.initial.color || PALETTE[0]
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
  if (!name.value.trim()) { error.value = '请填写分类名称'; return }
  emit('save', { name: name.value.trim(), color: color.value })
}

onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" :duration="180">
      <div v-if="open" class="modal-mask" @mousedown.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <template v-if="!confirming">
            <h3>{{ mode === 'add' ? '添加分类' : '编辑分类' }}</h3>
            <label class="field">
              <span>分类名称</span>
              <input ref="nameInput" v-model="name" placeholder="例如 开发工具" @keydown.enter="submit" />
            </label>
            <div class="field">
              <span>颜色(卡片色点,最后一个可自定义)</span>
              <div class="palette">
                <button
                  v-for="c in PALETTE"
                  :key="c"
                  type="button"
                  class="swatch"
                  :class="{ 'is-active': color === c }"
                  :style="{ background: c }"
                  :aria-label="'选择颜色 ' + c"
                  @click="color = c"
                ></button>
                <input
                  type="color"
                  class="swatch-input"
                  :value="color"
                  title="自定义颜色"
                  aria-label="自定义颜色"
                  @input="color = $event.target.value"
                />
              </div>
            </div>
            <p v-if="error" class="modal-error">{{ error }}</p>
            <div class="modal-actions">
              <button v-if="mode === 'edit'" class="btn-danger" type="button" @click="confirming = true">删除分类</button>
              <span class="spacer"></span>
              <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
              <button class="btn-primary" type="button" @click="submit">保存</button>
            </div>
          </template>
          <template v-else>
            <h3>删除分类</h3>
            <p class="confirm-text">确定要删除分类「{{ initial.name }}」吗?</p>
            <p class="confirm-text confirm-sub">
              {{ linkCount > 0 ? `其下的 ${linkCount} 个链接将一并删除。` : '' }}删除后无法恢复。
            </p>
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
