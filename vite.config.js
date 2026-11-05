import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 用相对路径,构建产物部署在任意子路径(如 GitHub Pages 项目页)都能正常加载
// dev server 固定端口,避免被其他项目占用
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { port: 5190, strictPort: true },
})
