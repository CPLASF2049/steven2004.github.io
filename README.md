# Steven's Blog

个人博客源码。基于 **Hexo + Fluid**，托管在 **GitHub Pages** 上，没有服务器、没有数据库。

**在线地址：<https://CPLASF2049.github.io/steven2004.github.io>**
**源码仓库：<https://github.com/CPLASF2049/steven2004.github.io>**

---

## 先搞清楚这个站点的网址

GitHub Pages 有两种站点，网址格式不一样：

| 类型 | 仓库名要求 | 网址 |
| --- | --- | --- |
| 用户主页站点 | 必须叫 `你的用户名.github.io` | `https://你的用户名.github.io` |
| 项目站点 | 任意仓库名 | `https://你的用户名.github.io/仓库名` |

决定是哪种的，是「**仓库名是否等于 `用户名.github.io`**」。

当前仓库是 `CPLASF2049/steven2004.github.io` —— 用户名是 `CPLASF2049`，仓库名不是 `CPLASF2049.github.io`，
所以它是**项目站点**，网址多一层仓库名：

```text
https://CPLASF2049.github.io/steven2004.github.io
```

这也是 `_config.yml` 里必须有 `root: /steven2004.github.io/` 的原因（见下方常见问题），
本地预览地址也会带上这一层：<http://localhost:4000/steven2004.github.io/>

> **想换成干净的根域名 `https://CPLASF2049.github.io`？**
> 把仓库改名为 `CPLASF2049.github.io`（Settings → General → Rename），然后改两个地方：
> `_config.yml` 里 `url: https://CPLASF2049.github.io`、`root: /`，重新 `blog publish` 即可。

---

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 站点框架 | Hexo 8 |
| 主题 | [Fluid](https://hexo.fluid-dev.com/)（npm 安装，卡片式首页、暗色模式、本地搜索、右侧目录） |
| Markdown 渲染 | `hexo-renderer-markdown-it` |
| 数学公式 | `@renbaoshuo/markdown-it-katex` + KaTeX，**构建时**渲染成 HTML，页面不依赖前端公式脚本 |
| 评论 | Utterances（基于 GitHub Issue，免费无广告） |
| 部署 | `hexo-deployer-git` → `gh-pages` 分支 → GitHub Pages |
| CDN | 主题默认使用 360 前端静态资源库，国内访问较快 |

---

## 目录结构

```text
steven2004.github.io/
├─ _config.yml              Hexo 站点配置：站点信息、url/root、部署、markdown、feed/search/sitemap
├─ _config.fluid.yml        Fluid 主题配置：改主题只动这个文件
├─ package.json             依赖与 npm 脚本
├─ blog.cmd                 快捷命令入口
├─ tools/blog.ps1           快捷命令的实现（别放进 scripts\，那是 Hexo 保留目录）
├─ source/
│  ├─ _posts/               文章，一篇一个 Markdown 文件
│  ├─ about/index.md        关于页（layout: about）
│  ├─ css/custom.css        自定义样式
│  ├─ img/                  头像、头图、封面、favicon
│  └─ .nojekyll             关闭 GitHub Pages 的 Jekyll 处理
├─ scaffolds/               hexo new 的模板
├─ public/                  构建产物（已 gitignore，不提交）
└─ node_modules/            依赖（已 gitignore）
```

**两个配置文件的区别**：`_config.yml` 管站点，`_config.fluid.yml` 管主题。
主题装在 `node_modules/hexo-theme-fluid`，**不要去改那里的 `_config.yml`** —— 升级主题会被覆盖。

归档页 `/archives/`、分类页 `/categories/`、标签页 `/tags/` 都由 Hexo 的生成器自动产出，
**不需要**自己建页面文件（这一点和 NexT 不一样）。

---

## 常用命令

项目根目录提供了 `blog.cmd` 快捷命令：

| 命令 | 作用 |
| --- | --- |
| `blog preview` | 本地预览，地址 <http://localhost:4000/steven2004.github.io/> |
| `blog new "文章标题" [slug]` | 新建文章；`slug` 是英文短名，决定网址 |
| `blog build` | 只构建到 `public/`，不发布 |
| `blog deploy` | 构建并发布站点到 `gh-pages` 分支 |
| `blog save [说明]` | 把源码提交并推送到 `main` 分支 |
| `blog publish [说明]` | `deploy` + `save`，日常发文章用这个 |
| `blog setup` | 初始化 Git 并关联 GitHub 仓库 |
| `blog status` | 查看 Git 状态、部署分支、文章列表 |
| `blog help` | 显示帮助 |

也可以完全不用脚本，直接用 Hexo 原生命令：

```bash
npx hexo new "文章标题"        # 新建文章
npx hexo server               # 本地预览（注意地址带仓库名前缀）
npx hexo clean && npx hexo generate   # 清理并构建
npx hexo deploy               # 部署：把 public/ 推到 gh-pages 分支
npx hexo clean && npx hexo g && npx hexo d   # 一键三连
```

> Windows PowerShell 默认禁止运行脚本，如果直接用 `hexo`/`npm` 报「禁止运行脚本」，
> 执行一次 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 即可；
> 或者用 `blog.cmd`（它已经带上了绕过参数）。

---

## 部署流程

**源码在 `main` 分支**，**产出的静态网页在 `gh-pages` 分支**。

```text
blog publish "post: 新文章标题"
```

等价于：

```bash
npx hexo clean && npx hexo generate && npx hexo deploy   # 发布站点
git add -A && git commit -m "..." && git push             # 同步源码
```

`hexo-deployer-git` 会把 `public/` 目录推送到远程的 `gh-pages` 分支。

推完之后去开启 Pages：

```text
https://github.com/CPLASF2049/steven2004.github.io/settings/pages
```

- **Source** 选 `Deploy from a branch`
- **Branch** 选 `gh-pages`，目录选 `/ (root)`
- 点 **Save**，等 1-2 分钟

然后访问 <https://CPLASF2049.github.io/steven2004.github.io>。

> 想了解这个站点的代码结构和这份文档的全部内容，看仓库的 README 即可。

---

## 启用评论（Utterances）

评论已经配好，但需要你在 GitHub 上授权一次：

1. 打开 <https://github.com/apps/utterances>，点 **Install**，
   选 **Only select repositories**，勾中 `steven2004.github.io`。
2. 打开仓库 **Settings → General → Features**，勾上 **Issues**（评论以 Issue 形式存放）。

配置在 `_config.fluid.yml`：

```yaml
post:
  comments:
    enable: true
    type: utterances

utterances:
  repo: CPLASF2049/steven2004.github.io
  issue_term: pathname
  label: utterances
  theme: github-light
  theme_dark: github-dark
```

> 仓库必须是**公开**的，Utterances 才能读写 Issue。
> 单篇文章不想开评论，在 front-matter 里写 `comments: false`。

---

## 写一篇新文章

```text
blog new "我的新笔记" my-new-note
```

会生成 `source/_posts/my-new-note.md`，内容长这样：

```yaml
---
title: "我的新笔记"
date: 2026-10-10 21:00:00
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
blog publish "post: 我的新笔记"      # 发布站点 + 同步源码
```

**常用 front-matter 字段**

| 字段 | 作用 |
| --- | --- |
| `title` | 标题 |
| `date` | 发布时间，决定网址与排序 |
| `categories` | 分类 |
| `tags` | 标签 |
| `description` | 首页卡片上的摘要 |
| `index_img` | 首页卡片封面，不写则用 `/img/cover.jpg` |
| `banner_img` | 文章页头图，不写则用 `/img/banner.jpg` |
| `comments` | 设为 `false` 关闭该篇评论 |
| `sticky` | 数字越大越靠前（置顶） |

**文章之间互相引用**，用 Hexo 的 `post_link` 标签（会自动带上正确的路径前缀）：

```text
{% post_link my-new-note %}
```

不要写成 `[文字]({% post_link my-new-note %})` —— markdown 会把尖括号当链接地址剥掉，标签就废了。

---

## 数学公式

公式用 **KaTeX 在构建阶段**渲染（`hexo-renderer-markdown-it` + `@renbaoshuo/markdown-it-katex`），
所以 LaTeX 可以**照标准写法写**：

- 行内：`$E = mc^2$`
- 行间：单独一行 `$$` 包起来
- 矩阵换行照旧写 `\\`，空格写 `\,`，**不需要**为了迁就 markdown 而写四个反斜杠

```latex
$$
A \otimes B = \begin{pmatrix} a_{11}B & a_{12}B \\ a_{21}B & a_{22}B \end{pmatrix}
$$
```

主题配置里 `post.math.engine: katex` 只负责引入 KaTeX 的样式表（`static_prefix.katex`，默认走国内 CDN）。
如果公式渲染异常，先确认 `_config.yml` 里的 `markdown.plugins` 还带着 `@renbaoshuo/markdown-it-katex`，
以及 `katex` 的版本和 `static_prefix.katex` 指向的版本一致。

> **为什么不用默认的 `hexo-renderer-marked`？**
> 它在公式之前先处理反斜杠转义，`\\` 会变成 `\`、`\,` 会变成 `,`，矩阵会散架。
> markdown-it 的公式插件是在转义之前就把整段公式取走的，所以没有这个问题。

---

## 页面动效

代码分两处：`source/css/custom.css` 负责表现，`source/js/custom.js` 负责逻辑。
效果向 [AnZhiYu 主题](https://docs.anheyu.com/) 上几个有代表性的做法看齐。

| 效果 | 说明 | 位置 |
| --- | --- | --- |
| 卡片跟随光晕 + 3D 倾斜 | 鼠标在卡片上移动时，柔光跟着走、边框发光，卡片轻微倾斜 | `.index-card` |
| 列表项跟随柔光 | 归档 / 分类 / 标签页的列表项只跟随发光，不倾斜 | `.list-group-item` |
| 鼠标点击爱心 | 点击处冒出几颗上浮的爱心 | 全局 |
| 滚动进入视口淡入 | 首屏之下的内容滚进视野时播一次淡入上滑 | 全局 |
| 标签卖萌 | 切走标签页时标题变成「不要走！再看看嘛！」，回来再变回来 | 全局 |
| 页脚运行时间 | 页脚显示「本站已运行 X 天 X 时 X 分 X 秒」，每秒刷新 | 页脚 |
| 控制台问候 | 按 F12 能看到带样式的问候与运行时间 | 控制台 |
| 导航栏滚动阴影 | 页面滚动后给顶部导航栏加一层阴影 | `#navbar` |

卡片的坐标通过 CSS 变量传给样式表：

| 变量 | 含义 |
| --- | --- |
| `--mx` / `--my` | 光标在卡片内的百分比位置，给跟随光晕 |
| `--rx` / `--ry` | 卡片的倾斜角度 |

**想调强弱**：卡片倾斜幅度在 `source/js/custom.js` 的 `TILT_MAX`（度，默认 3.5），
每次点击冒几颗心是 `HEART_COUNT`；动画时长在 `source/css/custom.css` 里。
**运行时间的起点**是 `custom.js` 里的 `LAUNCH`（默认按第一篇博客的日期），改成你自己的上线时间即可。

**两点设计上的取舍**，以后改的时候留意：

- 滚动淡入是「默认可见、进入视口才补一段入场动画」，而不是「先藏起来再显示」。
  这样即使观察机制因为某些原因没触发，内容也不会被藏住。
- 触屏设备，以及系统开启「减少动态效果」（`prefers-reduced-motion: reduce`）时，
  动作类效果（卡片光晕/倾斜、点击爱心、滚动淡入）自动不启用；
  标签卖萌、运行时间、导航栏阴影这些纯文字/状态类效果保留。

---

## 液态玻璃（Liquid Glass）

顶部导航项和分页项是液态玻璃：**CSS 负责玻璃的底、边、高光，SVG 滤镜负责折射**。

| 位置 | 作用 |
| --- | --- |
| `source/js/custom.js` 的 `initLiquidGlassFilter()` | 往页面注入 SVG 滤镜 `#liquid-glass-filter` |
| `source/css/custom.css` 的「液态玻璃」段落 | 把玻璃效果用到导航项与分页项 |
| `_config.fluid.yml` 的 `navbar.ground_glass` | 让导航栏半透明 + 模糊，玻璃才有内容可折射 |

每个玻璃元素由三层叠出来：

1. `::before` 用 `backdrop-filter: blur()` 抓到身后的画面，再用 `filter: url(#liquid-glass-filter)` 把它折射一下
2. 元素自身的浅色渐变底，撑出玻璃的体积感
3. `box-shadow` 做内上高光、内下反光、外投影，形成玻璃的厚边

文字是元素的子元素，不经过滤镜，所以始终清晰。

**调参的地方**：

| 想改什么 | 改哪里 |
| --- | --- |
| 模糊强度 | `custom.css` 里的 `blur(3px)` |
| 折射强度 | `custom.js` 里 `feDisplacementMap` 的 `scale`（默认 25） |
| 形变粗细 | `custom.js` 里 `feTurbulence` 的 `baseFrequency`（默认 `0.02 0.024`，越低越像厚玻璃） |
| 导航栏透明度 | `_config.fluid.yml` 的 `navbar.ground_glass.alpha`（默认 0.72） |

> **模糊和折射是此消彼长的。** 模糊太大，背景被抹平，折射就看不出来了 ——
> 实测 6px 模糊时折射造成的像素差异只有 0.99/255（基本看不见），降到 3px 后是 2.40。
> 所以调模糊时记得一起看折射还在不在。

**兼容性**：`filter: url()` 引用不到时这条声明会失效，`backdrop-filter` 的模糊依然生效，
最差情况退化成普通磨砂玻璃，不会坏掉。

---

## 想改个人信息，改哪里

| 想改什么 | 改哪个文件 |
| --- | --- |
| 站点标题、副标题、描述、关键词、作者 | `_config.yml` 顶部 `# Site` |
| 站点网址、子路径、文章链接格式 | `_config.yml` 的 `url` / `root` / `permalink` |
| 导航栏标题、菜单项 | `_config.fluid.yml` 的 `navbar` |
| 首页头图、副标题打字机文字 | `_config.fluid.yml` 的 `index` |
| 文章默认封面 | `_config.fluid.yml` 的 `post.default_index_img`，或替换 `source/img/cover.jpg` |
| 头像 | 替换 `source/img/avatar.png` |
| 关于页 | `_config.fluid.yml` 的 `about` + `source/about/index.md` |
| 页面配色、暗色模式 | `_config.fluid.yml` 的 `color` / `dark_mode` |
| 评论仓库 | `_config.fluid.yml` 的 `utterances.repo` |
| 自定义 CSS | `source/css/custom.css`（已在 `custom_css` 里启用） |
| 页脚文字 | `_config.fluid.yml` 的 `footer.content` |
| 部署仓库和分支 | `_config.yml` 的 `deploy` |

---

## 常见问题

**推送失败：`Recv failure: Connection was reset` 或 `Failed to connect to github.com:443`**

国内直连 GitHub 经常被重置，这不是仓库配置的问题。两个办法：

1. 打开代理软件的**系统代理**开关（Clash Verge 之类），再执行 `blog publish`；
2. 或者只给这一次命令挂上代理（Clash Verge 默认混合端口是 7897）：

```powershell
$env:HTTP_PROXY  = 'http://127.0.0.1:7897'
$env:HTTPS_PROXY = 'http://127.0.0.1:7897'
blog publish "post: 新文章"
```

判断是不是网络问题：`git ls-remote --heads origin` 能返回分支列表就说明通了。

**加粗/斜体没生效，页面上直接显示了 `**` 星号**

CommonMark 的「左右翼」规则碰上中文标点会失灵。加粗的收尾 `**` 如果**紧跟在全角标点后面、又被汉字接着**，它就不被认为是合法的收尾标记：

```markdown
❌ 在复旦大学读**科学智能（AI4S）**方向的硕士。      → 收尾 ** 前是「）」，失效
✅ 在复旦大学读**科学智能**（AI4S）方向的硕士。      → 收尾 ** 前是汉字，正常
✅ 在复旦大学读 **科学智能（AI4S）** 方向的硕士。    → 两侧加空格，正常
```

**规则**：加粗内容尽量不要以全角标点（`）`、`。`、`，`、`：` 等）结尾。
写完可以在浏览器里扫一眼，或者构建后检查产物里还有没有字面的 `**`。

**页面完全没样式，CSS/JS 全部 404**

项目站点最常见的坑：`_config.yml` 里的 `root` 不对。

- `url` 决定「文章自己的永久链接长什么样」
- `root` 决定「页面里引用 CSS、JS、图片、菜单时前面加什么」

项目站点必须是 `root: /steven2004.github.io/`（前后斜杠都不能少）。
只改了 `url` 没改 `root`（默认 `/`），页面就会去找 `https://CPLASF2049.github.io/css/main.css`
—— 而文件其实在 `/steven2004.github.io/css/main.css`，于是裸奔。

**本地预览打开是空的 / 文章页 404**

因为站点部署在子路径，本地地址也要带上前缀：

```text
http://localhost:4000/steven2004.github.io/
```

**公式显示成红色错误框**

先看 `_config.yml` 的 `markdown.plugins` 里有没有 `@renbaoshuo/markdown-it-katex`。
如果只有个别公式报错，多半是那个公式用了 KaTeX 不支持的写法。
KaTeX 支持范围见 <https://katex.org/docs/supported>。

**搜索没结果**

`_config.yml` 的 `search.path` 必须和 `_config.fluid.yml` 的 `search.path` / `generate_path`
都指向同一个文件（本项目统一用 `local-search.xml`）。

**构建出来的页面还可能有 Jekyll 的干扰**

GitHub Pages 默认会用 Jekyll 处理分支内容，而 Jekyll 会忽略下划线开头的目录。
项目里已经有 `source/.nojekyll`，并且 `deploy.ignore_hidden: false` 保证它会被推到 `gh-pages`。

**推送失败 / 提示要密码**

GitHub 早就不能用账号密码推了。去 **Settings → Developer settings → Personal access tokens**
生成一个 token 当密码用，或者改用 SSH：

```bash
git remote set-url origin git@github.com:CPLASF2049/steven2004.github.io.git
```

**部署完了访问还是旧内容**

GitHub Pages 有缓存，等 1-2 分钟；也可以在 Pages 设置里点一次重新构建。
本地则是浏览器缓存，`Ctrl+F5` 强制刷新。

**升级依赖和主题**

```bash
npm update                    # 升级 Hexo 与插件
npm update hexo-theme-fluid   # 只升级主题
```

因为主题配置写在 `_config.fluid.yml`，升级不会覆盖你的设置。

---

## 参考

- [Hexo 官方文档](https://hexo.io/docs/)
- [Fluid 主题文档](https://hexo.fluid-dev.com/docs/guide/)
- [Fluid 图标库](https://hexo.fluid-dev.com/docs/icon/)
- [GitHub Pages 项目站点与用户站点](https://docs.github.com/pages/getting-started-with-github-pages/what-is-github-pages)
- [KaTeX 支持的 LaTeX 语法](https://katex.org/docs/supported)
- [Utterances](https://utteranc.es/)
