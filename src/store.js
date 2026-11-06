import { reactive, watch } from 'vue'

const STORAGE_KEY = 'my-nav-data-v1'
const PREV_KEY = 'my-nav-data-prev-v1'

export const PALETTE = [
  '#1e80ff', '#10a37f', '#fb7299', '#f38020',
  '#0ea5e9', '#2563eb', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#14b8a6', '#22c55e', '#64748b',
]

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function normalizeUrl(url) {
  const u = String(url || '').trim()
  if (!u) return u
  return /^https?:\/\//i.test(u) ? u : 'https://' + u
}

function defaultData() {
  // 默认只给一条示例,其余由用户自己添加
  const main = { id: uid(), name: '常用', color: PALETTE[0] }
  return {
    version: 1,
    categories: [main],
    links: [{ id: uid(), categoryId: main.id, name: 'GitHub', url: 'https://github.com', createdAt: Date.now() }],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.links)) return defaultData()
    return data
  } catch {
    return defaultData()
  }
}

export function useNavStore() {
  const state = reactive(load())

  watch(
    () => JSON.stringify(state),
    (json) => {
      try {
        // 每次保存前把旧值挪到单代快照,供"恢复上次数据"使用
        const prev = localStorage.getItem(STORAGE_KEY)
        if (prev && prev !== json) localStorage.setItem(PREV_KEY, prev)
        localStorage.setItem(STORAGE_KEY, json)
      } catch { /* 存储失败时忽略(如隐私模式) */ }
    }
  )

  function addLink({ name, url, categoryId }) {
    state.links.push({ id: uid(), name: name.trim(), url: normalizeUrl(url), categoryId, createdAt: Date.now() })
  }

  function updateLink(id, patch) {
    const link = state.links.find((l) => l.id === id)
    if (!link) return
    if (patch.name != null) link.name = patch.name.trim()
    if (patch.url != null) link.url = normalizeUrl(patch.url)
    if (patch.categoryId != null) link.categoryId = patch.categoryId
  }

  function removeLink(id) {
    const i = state.links.findIndex((l) => l.id === id)
    if (i > -1) state.links.splice(i, 1)
  }

  function addCategory(name, color) {
    state.categories.push({ id: uid(), name: name.trim(), color: color || PALETTE[state.categories.length % PALETTE.length] })
  }

  function updateCategory(id, patch) {
    const cat = state.categories.find((c) => c.id === id)
    if (!cat) return
    if (patch.name != null) cat.name = patch.name.trim()
    if (patch.color != null) cat.color = patch.color
  }

  function removeCategory(id) {
    state.categories = state.categories.filter((c) => c.id !== id)
    state.links = state.links.filter((l) => l.categoryId !== id)
  }

  /**
   * 分类拖拽排序:把 dragId 分类插到 beforeId 分类之前;
   * beforeId 为 null 时放到末尾。
   */
  function moveCategory(dragId, beforeId) {
    const from = state.categories.findIndex((c) => c.id === dragId)
    if (from < 0) return
    const [item] = state.categories.splice(from, 1)
    if (beforeId) {
      const idx = state.categories.findIndex((c) => c.id === beforeId)
      state.categories.splice(idx < 0 ? state.categories.length : idx, 0, item)
    } else {
      state.categories.push(item)
    }
  }

  /**
   * 把链接拖到 targetCategoryId 分类里,插到 beforeId 链接之前;
   * beforeId 为 null 时追加到该分类末尾。
   */
  function moveLink(dragId, targetCategoryId, beforeId) {
    const from = state.links.findIndex((l) => l.id === dragId)
    if (from < 0) return
    const [item] = state.links.splice(from, 1)
    item.categoryId = targetCategoryId
    if (beforeId) {
      const idx = state.links.findIndex((l) => l.id === beforeId)
      state.links.splice(idx < 0 ? state.links.length : idx, 0, item)
    } else {
      let lastIdx = -1
      state.links.forEach((l, i) => { if (l.categoryId === targetCategoryId) lastIdx = i })
      state.links.splice(lastIdx + 1, 0, item)
    }
  }

  function exportJson() {
    return JSON.stringify({ version: state.version, categories: state.categories, links: state.links }, null, 2)
  }

  function importJson(text) {
    const data = JSON.parse(text)
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.links)) {
      throw new Error('文件里缺少 categories / links 字段')
    }
    state.categories = data.categories
    state.links = data.links
  }

  /* 用单代快照换回上一次的数据;当前数据会存进快照位,可再次恢复(来回切换) */
  function hasPrev() {
    return !!localStorage.getItem(PREV_KEY)
  }

  function restorePrev() {
    const raw = localStorage.getItem(PREV_KEY)
    if (!raw) throw new Error('没有可恢复的上次数据')
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.links)) {
      throw new Error('快照数据不完整')
    }
    const backup = JSON.stringify({ version: state.version, categories: state.categories, links: state.links })
    localStorage.setItem(PREV_KEY, backup)
    state.categories = data.categories
    state.links = data.links
  }

  return {
    state, PALETTE,
    addLink, updateLink, removeLink,
    addCategory, updateCategory, removeCategory,
    moveLink, moveCategory, exportJson, importJson,
    hasPrev, restorePrev,
  }
}
