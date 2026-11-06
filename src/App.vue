<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useNavStore } from './store.js'
import LinkDialog from './components/LinkDialog.vue'
import CategoryDialog from './components/CategoryDialog.vue'
import Icon from './components/Icon.vue'

const store = useNavStore()
const { state } = store

/* ---------- 分类与搜索 ---------- */
const activeCat = ref('all')
const query = ref('')
const searchInput = ref(null)
const mainEl = ref(null)

function setCat(id) {
  activeCat.value = id
  const main = mainEl.value
  if (!main) return
  if (id === 'all') {
    smoothScrollTo(main, 0)
    return
  }
  const el = document.getElementById('nvsec-' + id)
  if (el) {
    const mainTop = main.getBoundingClientRect().top
    smoothScrollTo(main, el.getBoundingClientRect().top - mainTop + main.scrollTop - 16)
  }
}

/* 平滑滚动:setInterval 缓动实现,不依赖浏览器 smooth 与 rAF(部分环境被禁用) */
function smoothScrollTo(container, targetY) {
  const maxY = container.scrollHeight - container.clientHeight
  const y = Math.max(0, Math.min(targetY, maxY))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    container.scrollTop = y
    return
  }
  const startY = container.scrollTop
  const diff = y - startY
  if (Math.abs(diff) < 2) return
  const duration = 450
  const start = Date.now()
  const timer = setInterval(() => {
    const t = Math.min(1, (Date.now() - start) / duration)
    container.scrollTop = startY + diff * (1 - Math.pow(1 - t, 3))
    if (t >= 1) {
      clearInterval(timer)
      container.scrollTop = y
    }
  }, 16)
}

function scrollTop() {
  if (mainEl.value) smoothScrollTo(mainEl.value, 0)
}

function scrollBottom() {
  if (mainEl.value) smoothScrollTo(mainEl.value, mainEl.value.scrollHeight)
}

function openFirstResult() {
  for (const s of sections.value) {
    if (s.links.length) {
      window.open(s.links[0].url, '_blank', 'noopener')
      return
    }
  }
}

function clearSearch() {
  query.value = ''
  searchInput.value?.focus()
}

const sections = computed(() => {
  const q = query.value.trim().toLowerCase()
  return state.categories
    .map((cat) => ({
      cat,
      links: state.links.filter(
        (l) =>
          l.categoryId === cat.id &&
          (!q || l.name.toLowerCase().includes(q) || l.url.toLowerCase().includes(q))
      ),
    }))
    .filter((s) => (q ? s.links.length > 0 : true))
})

const counts = computed(() => {
  const m = {}
  for (const l of state.links) m[l.categoryId] = (m[l.categoryId] || 0) + 1
  return m
})

/* ---------- 链接弹窗 ---------- */
const linkDialog = reactive({ open: false, mode: 'add', link: null, form: { name: '', url: '', categoryId: '' } })

function openAddLink(categoryId) {
  linkDialog.mode = 'add'
  linkDialog.link = null
  linkDialog.form = {
    name: '',
    url: '',
    categoryId: categoryId || (activeCat.value !== 'all' ? activeCat.value : state.categories[0]?.id || ''),
  }
  linkDialog.open = true
}

function openEditLink(link) {
  linkDialog.mode = 'edit'
  linkDialog.link = link
  linkDialog.form = { name: link.name, url: link.url, categoryId: link.categoryId }
  linkDialog.open = true
}

function saveLinkDialog(form) {
  if (linkDialog.mode === 'add') {
    store.addLink(form)
    showToast('已添加「' + form.name.trim() + '」')
  } else {
    store.updateLink(linkDialog.link.id, form)
    showToast('已保存')
  }
  linkDialog.open = false
}

function deleteLinkFromDialog() {
  if (linkDialog.link) {
    store.removeLink(linkDialog.link.id)
    showToast('已删除链接')
  }
  linkDialog.open = false
}

/* ---------- 分类弹窗 ---------- */
const categoryDialog = reactive({ open: false, mode: 'add', cat: null, form: { name: '', color: '' } })

function openAddCategory() {
  categoryDialog.mode = 'add'
  categoryDialog.cat = null
  categoryDialog.form = { name: '', color: store.PALETTE[state.categories.length % store.PALETTE.length] }
  categoryDialog.open = true
}

function openEditCategory(cat) {
  categoryDialog.mode = 'edit'
  categoryDialog.cat = cat
  categoryDialog.form = { name: cat.name, color: cat.color }
  categoryDialog.open = true
}

function saveCategoryDialog(form) {
  if (categoryDialog.mode === 'add') {
    store.addCategory(form.name, form.color)
    showToast('已添加分类「' + form.name + '」')
  } else {
    store.updateCategory(categoryDialog.cat.id, form)
    showToast('已保存')
  }
  categoryDialog.open = false
}

function deleteCategoryFromDialog() {
  const cat = categoryDialog.cat
  if (!cat) return
  store.removeCategory(cat.id)
  if (activeCat.value === cat.id) activeCat.value = 'all'
  showToast('已删除分类')
  categoryDialog.open = false
}

/* ---------- 拖拽排序 ---------- */
const dragId = ref(null)
const dropHint = ref(null)

function onDragStart(e, link) {
  dragId.value = link.id
  dropHint.value = null
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', link.id)
}

function onDragEnd() {
  dragId.value = null
  dropHint.value = null
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDragOverCard(e, link) {
  onDragOver(e)
  const rect = e.currentTarget.getBoundingClientRect()
  dropHint.value = { id: link.id, before: e.clientX < rect.left + rect.width / 2 }
}

function onDropOnCard(e, cat, links, index) {
  e.preventDefault()
  const id = dragId.value
  const hint = dropHint.value
  dragId.value = null
  dropHint.value = null
  if (!id) return
  const target = links[index]
  if (!target || target.id === id) return
  const rect = e.currentTarget.getBoundingClientRect()
  const before = hint && hint.id === target.id ? hint.before : e.clientX < rect.left + rect.width / 2
  const beforeId = before ? target.id : links[index + 1]?.id || null
  store.moveLink(id, cat.id, beforeId)
}

function onDropOnGrid(e, cat) {
  e.preventDefault()
  const id = dragId.value
  dragId.value = null
  dropHint.value = null
  if (!id) return
  store.moveLink(id, cat.id, null)
}

/* ---------- 分类拖拽 ---------- */
const dragCatId = ref(null)
const dropHintCat = ref(null)

function onCatDragStart(e, cat) {
  dragCatId.value = cat.id
  dropHintCat.value = null
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', cat.id)
}

function onCatDragEnd() {
  dragCatId.value = null
  dropHintCat.value = null
}

function onCatDragOver(e, cat) {
  if (!dragCatId.value) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const rect = e.currentTarget.getBoundingClientRect()
  dropHintCat.value = { id: cat.id, before: e.clientY < rect.top + rect.height / 2 }
}

function onCatDrop(e, cat) {
  e.preventDefault()
  const id = dragCatId.value
  const hint = dropHintCat.value
  dragCatId.value = null
  dropHintCat.value = null
  if (!id || id === cat.id) return
  const rect = e.currentTarget.getBoundingClientRect()
  const before = hint && hint.id === cat.id ? hint.before : e.clientY < rect.top + rect.height / 2
  if (before) {
    store.moveCategory(id, cat.id)
  } else {
    const idx = state.categories.findIndex((c) => c.id === cat.id)
    const next = state.categories[idx + 1]
    store.moveCategory(id, next ? next.id : null)
  }
}

/* ---------- 导入 / 导出 ---------- */
const fileInput = ref(null)

function doExport() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `my-nav-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  showToast('已导出备份文件')
}

function onImportFile(e) {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      store.importJson(String(reader.result))
      activeCat.value = 'all'
      query.value = ''
      showToast('导入成功')
    } catch (err) {
      showToast('导入失败:' + (err && err.message ? err.message : '文件格式不对'))
    }
    e.target.value = ''
  }
  reader.readAsText(file)
}

/* ---------- 轻提示 ---------- */
const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2400)
}

/* ---------- 全局按键与滚动 ---------- */
function onGlobalKey(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

// 内容区滚动时让侧栏高亮跟随当前可见的分组
function onMainScroll() {
  if (query.value) return
  const main = mainEl.value
  if (!main) return
  const mainTop = main.getBoundingClientRect().top
  let current = 'all'
  for (const s of sections.value) {
    const el = document.getElementById('nvsec-' + s.cat.id)
    if (el && el.getBoundingClientRect().top - mainTop <= 80) current = s.cat.id
  }
  activeCat.value = current
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <div class="app">
    <!-- 侧栏 -->
    <aside class="nv-side">
      <div class="nv-logo"><span class="nv-logo-tile">N</span>我的导航</div>

      <div class="nv-search">
        <Icon name="search" />
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="搜索链接…(Ctrl+K)"
          aria-label="搜索链接"
          @keydown.enter="openFirstResult"
          @keydown.esc="query = ''"
        />
        <button v-if="query" class="nv-clear" type="button" aria-label="清空搜索" @click="clearSearch">
          <Icon name="x" />
        </button>
      </div>

      <nav class="nv-nav">
        <div class="nv-navrow">
          <button
            class="nv-navitem"
            :class="{ 'is-active': activeCat === 'all' }"
            type="button"
            @click="setCat('all')"
          >
            <span class="nv-dot" style="background: #4f46e5"></span>
            <span class="nv-navlabel">全部</span>
            <span class="nv-navcount">{{ state.links.length }}</span>
          </button>
        </div>
        <div
          v-for="c in state.categories"
          :key="c.id"
          class="nv-navrow"
          :class="{
            'drop-before': dropHintCat?.id === c.id && dropHintCat.before,
            'drop-after': dropHintCat?.id === c.id && !dropHintCat.before,
          }"
          :style="{ '--dot': c.color }"
          draggable="true"
          title="拖拽可调整分类顺序"
          @dragstart="onCatDragStart($event, c)"
          @dragend="onCatDragEnd"
          @dragover="onCatDragOver($event, c)"
          @drop.stop="onCatDrop($event, c)"
        >
          <button
            class="nv-navitem"
            :class="{ 'is-active': activeCat === c.id }"
            type="button"
            :title="c.name"
            @click="setCat(c.id)"
          >
            <span class="nv-dot" :style="{ background: c.color }"></span>
            <span class="nv-navlabel">{{ c.name }}</span>
            <span class="nv-navcount">{{ counts[c.id] || 0 }}</span>
          </button>
          <button class="nv-navedit" type="button" title="编辑分类" aria-label="编辑分类" @click="openEditCategory(c)">
            <Icon name="pencil" />
          </button>
        </div>
      </nav>

      <div class="nv-navaddrow">
        <button class="nv-navadd" type="button" @click="openAddCategory"><Icon name="plus" />分类</button>
        <button class="nv-sideadd" type="button" @click="openAddLink()"><Icon name="plus" />链接</button>
      </div>

      <div class="nv-sidefoot">
        <div class="nv-minibtn-row">
          <button class="nv-minibtn" type="button" @click="doExport"><Icon name="download" />导出备份</button>
          <button class="nv-minibtn" type="button" @click="fileInput?.click()"><Icon name="upload" />导入</button>
          <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onImportFile" />
        </div>
        <p>数据保存在本地浏览器</p>
      </div>
    </aside>

    <!-- 主区域 -->
    <main class="nv-main" ref="mainEl" @scroll="onMainScroll">
      <div class="nv-body">
        <section
          v-for="(s, si) in sections"
          :key="s.cat.id"
          :id="'nvsec-' + s.cat.id"
          class="nv-sec anim"
          :style="{ animationDelay: 140 + si * 90 + 'ms' }"
        >
          <div class="nv-sec-h">
            <h3>{{ s.cat.name }}</h3>
            <span class="nv-count">{{ s.links.length }}</span>
          </div>
          <div class="nv-grid" @dragover="onDragOver" @drop="onDropOnGrid($event, s.cat)">
            <a
              v-for="(link, li) in s.links"
              :key="link.id"
              :href="link.url"
              target="_blank"
              rel="noopener"
              class="nv-card anim"
              :class="{
                dragging: dragId === link.id,
                'drop-before': dropHint?.id === link.id && dropHint.before,
                'drop-after': dropHint?.id === link.id && !dropHint.before,
              }"
              draggable="true"
              :style="{ '--dot': s.cat.color, animationDelay: 170 + si * 90 + li * 30 + 'ms' }"
              @dragstart="onDragStart($event, link)"
              @dragend="onDragEnd"
              @dragover="onDragOverCard($event, link)"
              @drop.stop="onDropOnCard($event, s.cat, s.links, li)"
            >
              <span class="nv-dot"></span>
              <span class="nv-name">{{ link.name }}</span>
              <button class="nv-edit" type="button" title="编辑" aria-label="编辑链接" @click.stop.prevent="openEditLink(link)">
                <Icon name="pencil" />
              </button>
            </a>
            <button class="nv-card nv-card-add" type="button" @click="openAddLink(s.cat.id)">
              <Icon name="plus" />添加链接
            </button>
          </div>
        </section>

        <div v-if="!sections.length" class="nv-empty">
          {{ query ? '没有匹配的链接' : '还没有链接,点左侧「链接」按钮添加' }}
        </div>
      </div>
    </main>

    <!-- 右下角滚动按钮 -->
    <div class="nv-scrollbtns">
      <button class="nv-scrollbtn" type="button" title="回到顶部" aria-label="回到顶部" @click="scrollTop">
        <Icon name="arrow-up" />
      </button>
      <button class="nv-scrollbtn" type="button" title="跳到底部" aria-label="跳到底部" @click="scrollBottom">
        <Icon name="arrow-down" />
      </button>
    </div>

    <!-- 弹窗 -->
    <LinkDialog
      :open="linkDialog.open"
      :mode="linkDialog.mode"
      :categories="state.categories"
      :initial="linkDialog.form"
      @save="saveLinkDialog"
      @delete="deleteLinkFromDialog"
      @close="linkDialog.open = false"
    />
    <CategoryDialog
      :open="categoryDialog.open"
      :mode="categoryDialog.mode"
      :initial="categoryDialog.form"
      :link-count="counts[categoryDialog.cat?.id] || 0"
      @save="saveCategoryDialog"
      @delete="deleteCategoryFromDialog"
      @close="categoryDialog.open = false"
    />

    <Transition name="toast" :duration="250">
      <div v-if="toast" class="nv-toast">{{ toast }}</div>
    </Transition>
  </div>
</template>
