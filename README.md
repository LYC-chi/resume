# Resume Studio · 交互式在线简历编辑器

一个**零依赖、纯前端**的简历编辑器：可视化编辑 → 实时预览 → 一键发布到 GitHub Pages。
本仓库同时托管「刘晏池 · 个人简历」的在线页面。

---

## 目录结构

```
.
├── index.html              # 发布出去的简历页面（GitHub Pages 首页）
├── resume.json             # 简历数据（结构化 JSON，可被编辑器导入/导出）
├── editor/                 # 编辑器应用（纯静态，无构建依赖）
│   ├── index.html
│   ├── styles.css
│   ├── app.js              # 编辑器逻辑 + GitHub 发布流程
│   ├── template.js         # 简历文档生成器（浏览器 / Node 通用）
│   └── seed.js             # 初始简历数据
├── scripts/
│   └── build-resume.js     # 由 resume.json 生成 index.html 与 dist/
├── dist/                   # 构建产物（部署用，入口 = 编辑器）
├── resume.md               # 简历的 Markdown 版本
└── 刘晏池-个人简历.pdf      # 简历 PDF
```

## 快速开始

### 本地运行

编辑器是纯静态页面，但需通过 HTTP 打开（`file://` 下浏览器会拦截 iframe 预览）：

```bash
python -m http.server 8899
# 编辑器：http://127.0.0.1:8899/editor/
# 简历页：http://127.0.0.1:8899/index.html
```

### 重新生成简历页面

```bash
node scripts/build-resume.js
```

会读取 `resume.json`（不存在时用 `editor/seed.js` 初始化），生成：

- `index.html` —— GitHub Pages 用的简历页面
- `dist/` —— 可整目录部署的静态站点（入口是编辑器）

---

## 功能

**编辑**

- 模块化内容：个人信息、个人简介、教育背景、工作与实践经历、项目经验、专业技能、主修课程、获奖荣誉、**自定义模块**
- 每个列表模块均支持 新增 / 删除 / 上移 / 下移
- 模块可勾选显示或隐藏，并可自由调整在简历中的先后顺序
- 所有改动实时写入 `localStorage`（自动保存），并支持 JSON 导入 / 导出

**预览**

- 编辑区右侧实时渲染与「发布结果完全一致」的简历（同一个渲染器输出）
- 预览宽度可切换 自适应 / 手机 390 / 平板 768 / 宽屏 1200
- 可一键在新窗口打开，或直接打印 / 另存为 PDF

**模板**

- `经典单栏`：时间轴 + 双栏技能，适合投递与打印
- `侧栏版`：左侧深色信息栏 + 右侧主体，视觉冲击力强
- `极简 ATS`：纯文本单栏、无装饰，适合机器筛选
- 6 套预设配色，也可自定义主色与点缀色；支持字体与内容密度切换

**响应式**

- 桌面端：左侧编辑 + 右侧预览双栏
- 移动端 / 窄屏：单栏切换「编辑 ↔ 预览」，顶栏工具自动收纳

---

## 一键发布到 GitHub

编辑器内置 GitHub REST API 发布流程，会依次完成：

1. 校验 Token 并显示当前登录账号
2. 检查目标仓库；**不存在时自动创建**（公开仓库）
3. 推送简历页面到指定分支与路径（默认 `index.html`）
4. 可选推送 `resume.json` 数据文件
5. **自动启用 GitHub Pages** 并回传可访问的在线链接

### 需要 Personal Access Token

仅凭账号邮箱无法调用 GitHub API，发布时需要该账号下的 Token：

1. 打开 <https://github.com/settings/tokens/new?scopes=repo&description=Resume%20Studio>
2. Note 填 `Resume Studio`，Expiration 建议 90 天
3. 勾选 **`repo`** 权限
4. 生成并复制 `ghp_` 开头的 Token，粘贴到编辑器的发布弹窗

Token 只保存在你自己的浏览器 `localStorage` 中，不会写入任何文件，也不会上传到第三方；
不想保存时取消勾选「在本机浏览器记住 Token」即可。

> 发布地址默认为 `https://<用户名>.github.io/<仓库名>/`。
> Pages 首次部署通常需要 1–2 分钟生效。

---

## 隐私说明

- 仓库中不包含手机号、邮箱、密码、Token 等敏感信息
- `resume.json` 只保存简历展示所需的公开内容
- 原始 `.docx` 文件未加入仓库，避免元数据泄漏
- `.gitignore` 已排除 `dist/`、`.env`、`*.local` 等本地产物

## 最后更新时间

2026-09-21
