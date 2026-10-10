# Steven's Blog

个人博客源码。基于 **Hexo + NexT**，托管在 **GitHub Pages** 上，没有任何服务器和数据库。

**在线地址：<https://steven2004.github.io>**

---

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 站点框架 | Hexo 8 |
| 主题 | NexT 8.29（Pisces 双栏，通过 npm 安装） |
| 部署 | `hexo-deployer-git` → `gh-pages` 分支 → GitHub Pages |
| 评论 | Utterances（基于 GitHub Issue，免费无广告） |
| 数学公式 | `hexo-filter-mathjax` 服务端渲染成 SVG，不依赖前端脚本和 CDN |
| 其它 | 本地搜索、RSS/Atom、站点地图、字数统计与阅读时长、阅读进度条、阅读书签、Pjax 无刷新跳转、图片点击放大、链接预取、深色模式 |

---

## 目录结构

```text
steven2004.github.io/
├─ _config.yml              Hexo 站点配置：站点信息、URL、部署、feed/search/sitemap/mathjax
├─ _config.next.yml         NexT 主题配置：改主题只动这个文件
├─ package.json             依赖与 npm 脚本
├─ blog.cmd                 快捷命令入口（双击或命令行都行）
├─ scripts/blog.ps1         快捷命令的实现
├─ source/
│  ├─ _posts/               文章，一篇一个 Markdown 文件
│  ├─ _data/styles.styl     自定义样式
│  ├─ images/avatar.png     头像（换成你自己的）
│  ├─ tags/index.md         标签页
│  ├─ categories/index.md   分类页
│  ├─ about/index.md        关于页
│  └─ .nojekyll             关闭 GitHub Pages 的 Jekyll 处理
├─ scaffolds/               hexo new 的模板
├─ public/                  构建产物（已 gitignore，不提交）
└─ node_modules/            依赖（已 gitignore）
```

**两个配置文件的区别**：`_config.yml` 管站点，`_config.next.yml` 管主题。
主题装在 `node_modules/hexo-theme-next`，**不要去改那里的 `_config.yml`** —— 升级主题会被覆盖。

---

## 常用命令

项目根目录提供了 `blog.cmd` 快捷命令：

| 命令 | 作用 |
| --- | --- |
| `blog preview` | 本地预览，打开 <http://localhost:4000> |
| `blog new "文章标题" [slug]` | 新建文章；`slug` 是英文短名，决定网址 |
| `blog build` | 只构建到 `public/`，不发布 |
| `blog deploy` | 构建并发布站点到 `gh-pages` 分支 |
| `blog save [说明]` | 把源码提交并推送到 `main` 分支 |
| `blog publish [说明]` | `deploy` + `save`，日常发文章用这个 |
| `blog setup` | 首次初始化 Git 并关联 GitHub 仓库 |
| `blog status` | 查看 Git 状态、部署分支、文章列表 |
| `blog help` | 显示帮助 |

也可以完全不用脚本，直接用 Hexo 原生命令：

```bash
npx hexo new "文章标题"        # 新建文章
npx hexo server               # 本地预览
npx hexo clean && npx hexo generate   # 清理并构建
npx hexo deploy               # 部署（注意：只推送 public/）
npx hexo clean && npx hexo g && npx hexo d   # 一键三连
```

> Windows PowerShell 默认禁止运行脚本，如果直接用 `hexo`/`npm` 报「禁止运行脚本」，
> 执行一次 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 即可；
> 或者用 `blog.cmd`（它已经带上了绕过参数）。

---

## 第一次上线

1. **在 GitHub 上创建公开仓库**，名字必须是 `steven2004.github.io`。

2. **初始化本地仓库并关联远程**：

   ```text
   blog setup
   ```

   它会执行 `git init -b main`、添加远程 `origin`、提交并询问是否推送。

3. **发布站点**：

   ```text
   blog deploy
   ```

   这一步会把 `public/` 推到 `gh-pages` 分支。

4. **开启 Pages**：仓库 **Settings → Pages** →
   Source 选 `Deploy from a branch`，Branch 选 `gh-pages`，目录选 `/ (root)`，保存。

等一两分钟，访问 <https://steven2004.github.io> 就能看到了。

> **为什么分两个分支？**
> `main` 放源码（Markdown、配置），可以随时回滚和改主题；`gh-pages` 只放生成的 HTML。
> 源码和产物分开，仓库历史干净，也不会互相覆盖。

---

## 启用评论（Utterances）

评论功能已经配好，但需要你在 GitHub 上授权一次：

1. 打开 <https://github.com/apps/utterances>，点 **Install**，
   选 **Only select repositories**，勾中 `steven2004.github.io`。
2. 打开仓库 **Settings → General → Features**，勾上 **Issues**（评论以 Issue 形式存放）。

配置在 `_config.next.yml`：

```yaml
utterances:
  enable: true
  repo: steven2004/steven2004.github.io
  issue_term: pathname
  theme: preferred-color-scheme
```

> 仓库必须是**公开**的，Utterances 才能读写 Issue。
> 单篇文章不想开评论，在 front-matter 里写 `comments: false`。

---

## 写一篇新文章

```text
blog new "我的第一篇文章" my-first-post
```

会生成 `source/_posts/my-first-post.md`，内容长这样：

```yaml
---
title: "我的第一篇文章"
date: 2026-10-10 18:00:00
updated: 2026-10-10 18:00:00
categories:
  - 随笔
tags:
  - 待补充
description: 一句话摘要，会显示在首页列表里，记得改。
comments: true
---
```

改完内容后：

```text
blog preview                       # 本地确认效果
blog publish "post: 我的第一篇文章"   # 发布站点 + 同步源码
```

`description` **建议一定写**，它就是首页列表里显示的那段摘要。

> 中文标题会让网址变成一长串百分号编码。想要干净的网址，就给第二个参数一个英文 slug，
> 例如 `blog new "我的第一篇文章" my-first-post` 会得到 `/2026/10/10/my-first-post/`。

---

## 想改个人信息，改哪里

| 想改什么 | 改哪个文件 |
| --- | --- |
| 站点标题、副标题、描述、关键词、作者 | `_config.yml` 顶部 `# Site` |
| 站点网址、文章链接格式 | `_config.yml` 的 `url` / `permalink` |
| 头像 | 替换 `source/images/avatar.png` |
| GitHub / 邮箱 / RSS 等社交链接 | `_config.next.yml` 的 `social` |
| 关于页内容 | `source/about/index.md` |
| 菜单项 | `_config.next.yml` 的 `menu` |
| 主题配色、深色模式 | `_config.next.yml` 的 `scheme` / `darkmode` |
| 评论仓库 | `_config.next.yml` 的 `utterances.repo` |
| 页脚署名 | `_config.next.yml` 的 `footer` |
| 自定义 CSS | `source/_data/styles.styl`（已在 `custom_file_path.style` 启用） |
| 部署仓库和分支 | `_config.yml` 的 `deploy` |

---

## 常见问题

**构建出来的页面没有样式 / CSS 全部 404**
Jekyll 在捣乱。项目里已经有 `source/.nojekyll`（Hexo 会复制到 `public/` 根目录），
确认它存在即可。如果手动删过，重新建一个空文件。

**公式显示成红色错误框**
多半是 LaTeX 里「反斜杠 + 半角标点」被 Markdown 吃掉了一层。
本站公式在 markdown 之后渲染，所以这类地方要写**两个反斜杠**：

| 想要的 LaTeX | markdown 里写 |
| --- | --- |
| `\\`（矩阵换行） | `\\\\` |
| `\,` `\;`（空格） | `\\,` `\\;` |
| `\{` `\}`（字面大括号） | `\\{` `\\}` |

后面跟字母的命令不受影响：`\int`、`\sqrt`、`\sum`、`\alpha` 照常写。
另外别忘了文章 front-matter 里的 `mathjax: true`。

**`hexo init` 用 pnpm 装依赖失败（ERR_PNPM_IGNORED_BUILDS）**
pnpm 默认不执行依赖的构建脚本。删掉 `node_modules`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`，
改用 `npm install`。本项目统一用 npm。

**推送失败 / 提示要密码**
GitHub 早就不能用账号密码推了。去 **Settings → Developer settings → Personal access tokens**
生成一个 token 当密码用，或者改用 SSH：

```bash
git remote set-url origin git@github.com:steven2004/steven2004.github.io.git
```

**部署完了访问还是旧内容**
GitHub Pages 有缓存，等 1-2 分钟；也可以在 Pages 设置里点一次重新构建。
本地则是浏览器缓存，`Ctrl+F5` 强制刷新。

**想换主题**
优先用 npm 装的主题：`npm install hexo-theme-xxx`，然后 `_config.yml` 里改 `theme: xxx`，
并且新建 `_config.xxx.yml` 写该主题的配置。Hexo 会自动到 `node_modules/hexo-theme-*` 里找。

**升级依赖和主题**

```bash
npm update            # 升级 Hexo 与插件
npm update hexo-theme-next   # 只升级主题
```

因为主题配置写在 `_config.next.yml`，升级不会覆盖你的设置。

---

## 参考

- [Hexo 官方文档](https://hexo.io/docs/)
- [NexT 主题文档](https://theme-next.js.org/docs/)
- [NexT 标签插件（note / tabs / label / button 等）](https://theme-next.js.org/docs/tag-plugins/)
- [hexo-filter-mathjax](https://github.com/next-theme/hexo-filter-mathjax)
- [Utterances](https://utteranc.es/)
