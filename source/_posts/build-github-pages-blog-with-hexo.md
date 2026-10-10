---
title: 从零搭建 GitHub Pages 博客：Hexo + NexT 完全指南
date: 2026-02-25 11:00:00
updated: 2026-02-25 11:00:00
categories:
  - 技术教程
tags:
  - GitHub Pages
  - Hexo
  - NexT
  - 博客搭建
description: 从零开始用 Hexo + NexT 搭建托管在 GitHub Pages 上的个人博客，包含环境准备、主题安装、搜索/RSS/评论/数学公式等功能的完整配置，以及新版 NexT 与旧教程的差异和踩坑记录。
comments: true
---

没有服务器、不买域名、不备案，也能有一个完全属于自己、可以长期使用的技术博客。这篇文章记录我把本站从零搭起来的完整过程，顺便把旧教程里已经过时的部分修正掉。

## 为什么是 GitHub Pages + Hexo

**GitHub Pages** 是 GitHub 提供的免费静态托管服务。每个账号都能免费拿到一个根域名 `https://你的用户名.github.io`，再挂任意多个项目站点。免费、自带 CDN、不需要任何运维。

**Hexo** 是一个 Node.js 写的静态博客框架：

- 文章就是 Markdown 文件，存在 Git 仓库里，永远不会丢
- 生成的是纯静态 HTML，没有数据库、没有后端
- 主题和插件生态丰富，想加功能基本都有现成方案

这套组合的定位很明确：**只负责写 Markdown，其他都交给工具**。

## 一、环境准备

### 安装 Node.js 和 Git

去 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本，[Git 官网](https://git-scm.com/) 下载安装。装完确认一下：

```bash
node --version   # 类似 v20.x.x / v22.x.x
npm --version
git --version
```

### 配置 Git 身份

```bash
git config --global user.name "CPLASF2049"
git config --global user.email "你的邮箱@example.com"
```

### 创建仓库：先搞清楚两种站点

这一步最容易踩坑。GitHub Pages 有**两种**站点，网址格式完全不同：

| 类型 | 仓库名要求 | 网址 |
| --- | --- | --- |
| 用户主页站点 | 必须叫 `你的用户名.github.io` | `https://你的用户名.github.io` |
| 项目站点 | 任意仓库名 | `https://你的用户名.github.io/仓库名` |

关键点：**决定是不是主页站点的，是「仓库名 == 用户名.github.io」，而不是「仓库名里有没有 .github.io」**。

以本站为例：账号是 `CPLASF2049`，仓库叫 `steven2004.github.io`。仓库名不等于 `CPLASF2049.github.io`，所以它是**项目站点**：

```text
账号：CPLASF2049
仓库：steven2004.github.io
访问地址：https://CPLASF2049.github.io/steven2004.github.io   ← 多一层仓库名
```

{% note warning %}
**想清楚你要哪种。**

- 想要 `https://CPLASF2049.github.io` 这种干净根域名 → 仓库名必须叫 **`CPLASF2049.github.io`**，然后 `url: https://CPLASF2049.github.io`、`root: /`。
- 想要 `https://steven2004.github.io` → 那需要有一个**用户名就叫 steven2004** 的 GitHub 账号，并在它下面建同名仓库。用户名是什么，根域名就是什么，改不了。
{% endnote %}

新建仓库时选 **Public**（私有仓库的 Pages 有限制，而且 Utterances 评论必须用公开仓库）。

## 二、初始化 Hexo 项目

```bash
# 安装 Hexo 命令行工具
npm install -g hexo-cli

# 初始化项目（会拉取 hexo-starter 脚手架）
hexo init steven2004.github.io
cd steven2004.github.io

# 安装依赖
npm install
```

{% note danger %}
**踩坑记录：别让 pnpm 插手。**
如果你的机器上装了 pnpm，`hexo init` 可能自动用 pnpm 装依赖，然后因为 `ERR_PNPM_IGNORED_BUILDS`（pnpm 默认不执行依赖的构建脚本）而失败。
要么执行 `pnpm approve-builds` 放行 `hexo-util`，要么干脆删掉 `node_modules`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`，改用 `npm install` 重装。本项目统一使用 npm。
{% endnote %}

先看看默认效果：

```bash
hexo generate    # 生成静态文件到 public/
hexo server      # 启动本地服务器
```

打开 <http://localhost:4000> 就能看到默认的 landscape 主题。

## 三、安装 NexT 主题

### 旧教程 vs 现在

网上大量教程让你这样装主题：

```bash
git clone https://github.com/theme-next/hexo-theme-next themes/next
```

**这个仓库（`theme-next/hexo-theme-next`）已经停止维护了**，停留在 v7.8.0（2020 年）。它现在的新家是 [`next-theme/hexo-theme-next`](https://github.com/next-theme/hexo-theme-next)，已经是 v8.x。

而且 v8 官方更推荐用 npm 安装，而不是 clone 到 `themes/`：

```bash
npm install hexo-theme-next
```

Hexo 5.0 之后会自动去 `node_modules/hexo-theme-*` 里找主题，所以只需要在站点 `_config.yml` 里写：

```yaml
theme: next
```

这样升级主题只要 `npm update hexo-theme-next`，配置文件也不会被覆盖。

### 主题配置写在哪

NexT v8 支持「Alternate Theme Config」：不要改 `node_modules/hexo-theme-next/_config.yml`，而是在**站点根目录**新建 `_config.next.yml`，只写你要覆盖的项。

```
steven2004.github.io/
├── _config.yml          # Hexo 站点配置
├── _config.next.yml     # NexT 主题配置（覆盖主题默认值）★
├── source/
└── package.json
```

好处很直接：主题升级不会冲突，出问题也好排查。

## 四、配置站点 `_config.yml`

需要改的核心几项：

```yaml
# 站点信息
title: Steven's Blog
subtitle: '记录技术、工具与生活'
description: >-
  Steven 的个人博客，记录编程、开发工具、学习笔记与日常思考。
keywords: 博客, 技术, 编程, Hexo, NexT
author: Steven
language: zh-CN
timezone: 'Asia/Shanghai'

# 站点地址（必须写对，否则 RSS、站点地图、搜索里的链接全是错的）
url: https://CPLASF2049.github.io/steven2004.github.io
# 子路径部署的关键：项目站点的根路径就是 /仓库名/，前后斜杠都不能少
root: /steven2004.github.io/
permalink: :year/:month/:day/:title/

# 主题
theme: next

# 部署
deploy:
  type: git
  repo: https://github.com/CPLASF2049/steven2004.github.io.git
  branch: gh-pages
```

{% note danger %}
**`root` 是项目站点最容易漏的一行。**

`url` 决定「文章自己的永久链接长什么样」，`root` 决定「页面里引用 CSS、JS、图片、菜单时前面加什么」。
项目站点只改 `url` 不改 `root`（默认是 `/`），生成出来的页面会去 `https://CPLASF2049.github.io/css/main.css` 找样式表 —— 而文件其实在 `/steven2004.github.io/css/main.css`，结果就是**页面裸奔、完全没样式**。

用户主页站点（仓库名 == `用户名.github.io`）保持 `root: /` 即可。
{% endnote %}

{% note info %}
`updated_option` 建议设成 `'date'`。默认的 `'mtime'` 会让「更新于」跟着文件修改时间走 —— 每次重新 clone 仓库，所有文章的修改时间都变成今天，页面上看起来就像全站刚更新过。
{% endnote %}

## 五、安装必需插件

```bash
# 一键部署到 Git
npm install hexo-deployer-git --save

# RSS / Atom 订阅
npm install hexo-generator-feed --save

# 本地搜索（生成 search.xml）
npm install hexo-generator-searchdb --save

# 站点地图，利于 SEO
npm install hexo-generator-sitemap --save

# 字数统计与阅读时长
npm install hexo-word-counter --save

# 数学公式（服务端渲染）
npm install hexo-filter-mathjax --save
```

对应在 `_config.yml` 末尾加上：

```yaml
feed:
  type: atom
  path: atom.xml
  limit: 20
  content: true

search:
  path: search.xml
  field: post
  content: true
  format: html
  limit: 10000

sitemap:
  path: sitemap.xml

mathjax:
  tags: none
  single_dollars: true
  every_page: false
```

## 六、配置主题 `_config.next.yml`

挑几个关键项说明，完整配置见项目里的文件。

### 样式和外观

```yaml
# Muse（经典单栏）| Mist（紧凑）| Pisces（双栏）| Gemini（现代双栏）
scheme: Pisces
darkmode: true          # 跟随系统自动切换深色模式
```

### 菜单

格式是 `名称: 链接 || 图标`，名称用英文 key 时会自动套用 NexT 的中文翻译：

```yaml
menu:
  home: / || fa fa-home
  about: /about/ || fa fa-user
  tags: /tags/ || fa fa-tags
  categories: /categories/ || fa fa-th
  archives: /archives/ || fa fa-archive
```

### 阅读体验四件套

```yaml
back2top:
  enable: true
  scrollpercent: true   # 按钮上显示阅读百分比

reading_progress:
  enable: true          # 顶部阅读进度条
  position: top
  color: "#37c6c0"
  height: 3px

bookmark:
  enable: true          # 记录阅读位置
  save: auto

pjax: true              # 无刷新页面切换
```

### 本地搜索

```yaml
local_search:
  enable: true
  preload: true
```

### 评论：Utterances

旧教程会让你建 `source/_data/comments.swig` 再挂到 `custom_file_path.postBodyEnd` 上。**NexT v8 已经内置了 Utterances**，不用再自己写模板：

```yaml
comments:
  active: utterances
  storage: true

utterances:
  enable: true
  repo: CPLASF2049/steven2004.github.io
  issue_term: pathname
  theme: preferred-color-scheme
```

启用前还要做两件事：

1. 打开 <https://github.com/apps/utterances> 点 Install，选 **Only select repositories**，勾中博客仓库
2. 仓库 **Settings → General → Features** 勾上 **Issues**（评论是以 Issue 形式存放的）

{% note warning %}
仓库必须是**公开**的，Utterances 才能读写 Issue。
{% endnote %}

### 数学公式

NexT v8 自带 MathJax 和 KaTeX 两种前端渲染引擎，但本站用的是**服务端渲染**：
装 `hexo-filter-mathjax`，在 `hexo generate` 阶段就把 LaTeX 渲染成 SVG，页面不用等 CDN 下载脚本，国内访问更快、也没有闪烁。

```yaml
# 站点 _config.yml：服务端渲染的数学公式
mathjax:
  tags: none
  single_dollars: true
  every_page: false
  packages:            # ams 提供 pmatrix / cases / align 等环境，必须加
    - ams

# 主题 _config.next.yml：把前端渲染关掉，否则会重复加载用不上的脚本
math:
  every_page: false
  mathjax:
    enable: false
  katex:
    enable: false
```

然后在需要公式的文章 front-matter 里加一行 `mathjax: true` 即可。

{% note warning %}
这套组合有一个反直觉的地方：插件在 **markdown 渲染之后**才运行，而 markdown 会吃掉一层反斜杠转义。所以「反斜杠 + 半角标点」要写两个反斜杠 —— 矩阵换行写 `\\\\`，细空格写 `\\,`。详细对照表见 {% post_link next-theme-writing-guide %}。
{% endnote %}

## 七、创建标签页、分类页、关于页

页面不是靠主题菜单生成的，要自己建源文件：

```bash
hexo new page tags
hexo new page categories
hexo new page about
```

然后改对应文件的 front-matter：

```yaml
# source/tags/index.md
---
title: 标签
type: tags
comments: false
---

# source/categories/index.md
---
title: 分类
type: categories
comments: false
---
```

{% note info %}
`type` 是关键：`tags` 会渲染成标签云，`categories` 渲染成分组列表。**关于页不需要 `type`**，直接写正文就行。
{% endnote %}

## 八、部署到 GitHub Pages

### 推荐做法：源码和产物分两个分支

- `main` 分支：放博客源码（Markdown、配置、主题配置），用 Git 管理
- `gh-pages` 分支：放 `hexo generate` 生成的 `public/`，由 GitHub Pages 发布

### 首次推送源码

```bash
git init -b main
git add .
git commit -m "chore: init blog"
git remote add origin https://github.com/CPLASF2049/steven2004.github.io.git
git push -u origin main
```

### 生成并部署

```bash
hexo clean
hexo generate
hexo deploy
```

`hexo-deployer-git` 会把 `public/` 推到 `gh-pages` 分支。

### 最后一步：开启 Pages

到仓库 **Settings → Pages**（地址可以直接敲）：

```text
https://github.com/CPLASF2049/steven2004.github.io/settings/pages
```

- **Source** 选 `Deploy from a branch`
- **Branch** 选 `gh-pages`，目录选 `/ (root)`
- 保存，等一两分钟

然后访问 <https://CPLASF2049.github.io/steven2004.github.io> —— 上线了。

{% note info %}
GitHub 在 Pages 设置页面上给出的地址，会带上仓库名这一层子路径，这正是项目站点的特征。
{% endnote %}

{% note warning %}
**CSS/JS 全部 404、页面裸奔**，两个常见原因：

1. `_config.yml` 里漏了 `root: /steven2004.github.io/`（项目站点必踩）
2. Jekyll 在捣乱 —— GitHub Pages 默认会用 Jekyll 处理分支内容，而 Jekyll 会忽略下划线开头的目录。在 `source/.nojekyll` 放一个空文件（Hexo 会把它复制到 `public/` 根目录）就能关掉 Jekyll。
{% endnote %}

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `hexo new "文章标题"` | 新建文章 |
| `hexo new page "页面名"` | 新建页面 |
| `hexo server` | 本地预览 <http://localhost:4000> |
| `hexo generate` / `hexo g` | 生成静态文件 |
| `hexo clean` | 清理缓存和 `public/` |
| `hexo deploy` / `hexo d` | 部署到 GitHub |
| `hexo clean && hexo g && hexo d` | 一键三连，最常用 |

## 日常写作流程

```bash
hexo new "我的新文章"     # 写 source/_posts/我的新文章.md
hexo server              # 本地看效果
hexo clean && hexo g && hexo d   # 满意了就发布
```

源码记得一起提交：

```bash
git add . && git commit -m "post: 我的新文章" && git push
```

## 踩坑清单

{% tabs 踩坑记录 %}
<!-- tab pnpm -->
`hexo init` 若走 pnpm 安装依赖，会因 `ERR_PNPM_IGNORED_BUILDS` 中断。删掉 pnpm 的 `node_modules` 与锁文件后改用 `npm install`。
<!-- endtab -->

<!-- tab PowerShell -->
Windows PowerShell 默认禁止运行脚本，`npm.ps1` 会报「禁止运行脚本」。解决方式：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`，或直接用 `npm.cmd`。
<!-- endtab -->

<!-- tab 主题目录 -->
用 npm 装主题后，`themes/next/` 目录不存在是正常的 —— 主题在 `node_modules/hexo-theme-next/`。别照着旧教程去改那里的 `_config.yml`。
<!-- endtab -->

<!-- tab 中文乱码 -->
Windows 终端默认 GBK，`hexo` 输出中文可能乱码。执行 `chcp 65001` 切到 UTF-8 即可。
<!-- endtab -->
{% endtabs %}

## 小结

整套流程可以压缩成四步：

1. 建 `用户名.github.io` 仓库
2. `hexo init` + `npm install` 起项目
3. `npm install hexo-theme-next` 装主题，配置写在 `_config.next.yml`
4. `hexo clean && hexo g && hexo d` 发布，Settings → Pages 选 `gh-pages`

没有服务器费用，没有数据库，没有备案。剩下的就是坚持写。
