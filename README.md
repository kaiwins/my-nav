# 我的导航

个人导航站:常用链接分组管理、搜索直达、拖拽排序、导入导出备份。
纯前端项目(Vue 3 + Vite),数据保存在浏览器 localStorage,**不需要任何后端服务器**。

## 功能

- 侧栏分组:添加 / 编辑(悬停分类出现铅笔,或双击)/ 删除分类,16 种预设颜色 + 自定义取色器
- 文字卡片:只需要填「名称 + 网址」,不用准备任何图标
- 页面内管理:卡片悬停出现编辑按钮,删除为应用内二次确认,不用原生弹窗
- 拖拽排序:拖动卡片可调整顺序、跨分类移动,带插入位置指示线
- 搜索:`Ctrl + K` 聚焦,Enter 直达第一个结果,Esc 清空
- 入场动画:分组与卡片错开浮起;悬停上浮 + 分类色光环;按压缩放
- 备份:侧栏底部「导出备份 / 导入」,JSON 文件,方便换浏览器或换电脑迁移

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:5190(端口在 `vite.config.js` 固定,若被占用请先释放)

## 部署到 GitHub Pages(免费)

构建产物是纯静态文件,可直接托管在 GitHub Pages:

1. 在 GitHub 新建一个仓库,例如 `my-nav`
2. 在本目录下推送代码:

```bash
git init -b main
git add .
git commit -m "feat: 我的导航站"
git remote add origin https://github.com/<你的用户名>/my-nav.git
git push -u origin main
```

3. 打开仓库页面 → **Settings → Pages → Build and deployment → Source 选择 `GitHub Actions`**
4. 完成。之后每次 `git push` 会自动构建并发布到:

```
https://<你的用户名>.github.io/my-nav/
```

说明:

- 仓库里已内置自动部署 workflow(`.github/workflows/deploy.yml`),无需额外配置
- `vite.config.js` 的 `base` 已设为相对路径 `./`,部署在任意子路径都能正常加载
- 本地预览构建产物:`npm run build && npm run preview`

## 数据说明

| 事项 | 说明 |
| --- | --- |
| 存储位置 | 浏览器 `localStorage`(key: `my-nav-data-v1`) |
| 多设备同步 | 不支持(纯前端无后端),用「导出备份 / 导入」手动迁移 |
| 换浏览器 | 数据不会跟着走,同样用导出 / 导入 |
| 清空数据 | 控制台执行 `localStorage.removeItem('my-nav-data-v1')` 后刷新 |

## 自定义

- 修改默认分类和初始链接:`src/store.js` 里的 `defaultData()`
- 修改分类可选颜色:`src/store.js` 里的 `PALETTE`
- 主题色 / 圆角 / 间距等:`src/style.css` 顶部的 CSS 变量
