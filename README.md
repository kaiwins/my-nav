# 我的导航

个人导航站:常用链接分组管理、搜索直达、拖拽排序、导入导出备份。
纯前端项目(Vue 3 + Vite),数据保存在浏览器 localStorage,**不需要任何后端服务器**。

## 功能

- 侧栏固定:页面滚动时侧栏始终可见;点击分类跳转到对应分组(不过滤内容),滚动时高亮自动跟随
- 右下角「回到顶部 / 跳到底部」悬浮按钮
- 分组可拖拽排序(带插入位置指示线),16 种预设颜色 + 自定义取色器
- 文字卡片:只需要填「名称 + 网址」;**网站图标自动获取**(直连站点 favicon → favicon.im 镜像 → 分类色点兜底),零配置;长名字自动换行完整显示
- 页面内管理:卡片悬停出现编辑按钮,删除为应用内二次确认,不用原生弹窗
- 拖拽排序:拖动卡片可调整顺序、跨分类移动
- 搜索:`Ctrl + K` 聚焦,Enter 直达第一个结果,Esc 清空
- 备份:侧栏底部「导出备份 / 导入」,JSON 文件,方便换浏览器或换电脑迁移

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:5190(端口在 `vite.config.js` 固定,若被占用请先释放)

## 部署到 GitHub Pages(免费)

`vite.config.js` 的 `base` 已设为相对路径 `./`,任意子路径都能正常加载。

**方式一:一键部署到 gh-pages 分支(推荐,无需额外授权)**

```bash
npm run deploy
```

构建产物会提交为 `gh-pages` 分支并推送。首次部署后,到仓库 **Settings → Pages → Build and deployment → Source 选 `Deploy from a branch`**,Branch 选 `gh-pages` / `(root)`,保存即可。之后每次更新内容,再跑一次 `npm run deploy` 就会自动发布到:

```
https://<你的用户名>.github.io/my-nav/
```

也可以用 GitHub CLI 一条命令开启(需要登录 gh):

```bash
gh api repos/<你的用户名>/my-nav/pages -X POST --input - <<< '{"build_type":"legacy","source":{"branch":"gh-pages","path":"/"}}'
```

**方式二:GitHub Actions 自动部署**

仓库本地留有 `.github/workflows/deploy.yml`(未入库),推送 workflow 文件需要 git 凭据具备 `workflow` 权限:

```bash
gh auth refresh -s workflow
```

授权后取消 `.gitignore` 里对该文件的忽略并提交推送,再把 Settings → Pages 的 Source 切到 `GitHub Actions` 即可:每次 `git push` 自动构建发布。

本地预览构建产物:`npm run build && npm run preview`

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
