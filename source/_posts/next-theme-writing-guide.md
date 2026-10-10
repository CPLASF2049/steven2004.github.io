---
title: NexT 写作速查：Markdown 与主题特色标签
date: 2026-03-12 15:30:00
updated: 2026-03-12 15:30:00
categories:
  - 技术教程
tags:
  - NexT
  - Markdown
  - 写作
description: 一篇给自己用的速查表：Hexo 文章的 front-matter 写法、NexT 的 note/tabs 标签、代码块与复制按钮、数学公式、图片引用，以及摘要和目录的控制方式。
comments: true
mathjax: true
---

写文章时最烦的是「这个语法怎么写来着」。这篇是留给自己查的速查表，也顺便当作 NexT 各种标签的示例页。

## 一、文章骨架：front-matter

每篇 Markdown 开头用两个 `---` 包起来的部分叫 front-matter：

```yaml
---
title: 文章标题
date: 2026-03-12 15:30:00
updated: 2026-03-12 15:30:00
categories:
  - 技术教程
tags:
  - NexT
  - Markdown
description: 这里写的摘要会显示在首页列表里。
comments: true
mathjax: false
---
```

几个实用字段：

| 字段 | 作用 |
| --- | --- |
| `title` | 标题 |
| `date` | 发布时间，决定 URL 和排序 |
| `updated` | 更新时间，不写则不显示「更新于」 |
| `categories` | 分类，可以有层级（缩进写多级） |
| `tags` | 标签，数量不限 |
| `description` | 首页摘要，**强烈建议写** |
| `comments` | 单篇关闭评论设 `false` |
| `mathjax` | 该篇需要数学公式设 `true` |
| `toc` | 该篇关闭目录设 `false` |

{% note warning %}
`date` 写错会导致文章排序错乱。用 `hexo new "标题"` 生成的文章会自动填好时间，推荐用命令创建再改内容。
{% endnote %}

## 二、标题与目录

`##` 是二级标题、`###` 是三级。NexT 会自动把标题抓成右侧目录（Pisces 主题在侧边栏），层级深度由 `_config.next.yml` 里的 `toc.max_depth` 控制。

标题里**不要用特殊符号**，否则生成的锚点链接会变得很长很丑。

## 三、文字样式

```markdown
**加粗**  *斜体*  ~~删除线~~  `行内代码`
[链接文字](https://hexo.io)
![图片说明](/images/example.png)
```

效果：**加粗**、*斜体*、~~删除线~~、`行内代码`。

## 四、列表与表格

无序列表用 `-`，有序列表用 `1.`，嵌套靠缩进。表格用竖线分隔：

```markdown
| 命令 | 说明 |
| --- | --- |
| `hexo g` | 生成 |
| `hexo d` | 部署 |
```

## 五、代码块

三个反引号加语言名，NexT 会自动高亮并加上「复制」按钮：

````markdown
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```
````

渲染出来是这样：

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('Steven'));
```

## 六、NexT 特色标签

### 提示块 note

五种样式，写在文章里是这样：

```text
{% note default %}默认{% endnote %}
{% note primary %}主要{% endnote %}
{% note info %}信息{% endnote %}
{% note success %}成功{% endnote %}
{% note warning %}警告{% endnote %}
{% note danger %}危险{% endnote %}
```

实际效果：

{% note default %}
默认样式，用于普通补充说明。
{% endnote %}

{% note primary %}
主要样式，用于强调重点。
{% endnote %}

{% note info no-icon %}
信息样式，加上 `no-icon` 参数可以去掉左侧图标。
{% endnote %}

{% note success %}
成功样式，用于「这样做是对的」。
{% endnote %}

{% note warning %}
警告样式，用于容易踩坑的地方。
{% endnote %}

{% note danger %}
危险样式，用于「千万别这么干」。
{% endnote %}

在样式名后面**再写一段文字**，note 就会变成可点击展开的折叠块（标题就是那段文字）：

```text
{% note info 点我展开 %}
内容
{% endnote %}
```

### 选项卡 tabs

适合做「Windows / macOS / Linux」这种并列内容：

```text
{% tabs 标签名 %}
<!-- tab 第一页 -->
第一页的内容
<!-- endtab -->
<!-- tab 第二页 -->
第二页的内容
<!-- endtab -->
{% endtabs %}
```

效果：

{% tabs 安装方式 %}
<!-- tab npm -->
```bash
npm install hexo-theme-next
```
<!-- endtab -->

<!-- tab pnpm -->
```bash
pnpm add hexo-theme-next
```
<!-- endtab -->

<!-- tab yarn -->
```bash
yarn add hexo-theme-next
```
<!-- endtab -->
{% endtabs %}

{% note info %}
在**围栏代码块**（三个反引号）里直接写这些标签是安全的：Hexo 会先保护代码块、再解析标签，所以它们会原样显示，不会真的生效。

但要注意：**行内代码**（单个反引号包起来的内容）不受这层保护，里面写标签语法会被真的解析。想展示标签语法，请统一用围栏代码块。
{% endnote %}

### 折叠块

接上面的写法，`note` 带标题就是一个折叠块，适合放「展开才需要看」的补充内容：

{% note info 点我展开看看 %}
折叠里的内容可以是任意 Markdown，包括：

- 列表
- `行内代码`
- 甚至表格

| A | B |
| --- | --- |
| 1 | 2 |

{% endnote %}

### 标签与按钮

正文里想突出一个词，用 `label`：

```text
{% label primary@重要 %}  {% label success@已完成 %}  {% label default@普通 %}
```

效果：{% label primary@重要 %}  {% label success@已完成 %}  {% label default@普通 %}

需要点出去的按钮用 `button` 标签，参数依次是「链接、文字、图标」：

```text
{% btn https://hexo.io/, Hexo 官网, fa fa-home %}
```

{% btn https://hexo.io/, Hexo 官网, fa fa-home %}

## 七、数学公式

在 front-matter 里写 `mathjax: true`，然后就能用 LaTeX 语法了。

行内公式用单个美元符号，例如质能方程 $E = mc^2$ 直接写在句子里。

独立成行的公式用两个美元符号：

$$
\int_{-\infty}^{+\infty} e^{-x^2} \\, dx = \sqrt{\pi}
$$

求和的希腊字母、矩阵、多行公式都没问题：

$$
\mathbf{H} = -\sum_{i} p_i \log_2 p_i
\qquad
A = \begin{pmatrix} a & b \\\\ c & d \end{pmatrix}
$$

{% note warning 重要：反斜杠要写两个 %}
本站的公式是在 **markdown 渲染之后**才交给 MathJax 的，而 markdown 会把「反斜杠 + 半角标点」的转义吃掉一层。所以凡是「反斜杠后面紧跟半角标点」的地方，都要写**两个反斜杠**：

| 想得到的 LaTeX | markdown 里要写 |
| --- | --- |
| `\\`（矩阵换行、多行公式换行） | `\\\\` |
| `\,` `\;` `\:` `\!`（各种空格） | `\\,` `\\;` `\\:` `\\!` |
| `\{` `\}`（字面大括号） | `\\{` `\\}` |
| `\begin{eqnarray*}` 里的 `*` | `\*` |

后面跟字母的命令不受影响，照常写一个反斜杠即可：`\int`、`\sqrt`、`\frac`、`\sum`、`\alpha`、`\mathbf`。

写错了不会报错到页面上，但公式可能显示成一块红色错误提示，或者空格、换行悄悄消失 —— 预览时留意一下。
{% endnote %}

## 八、图片

图片放在 `source/images/` 下，用绝对路径引用：

```markdown
![说明文字](/images/example.png)
```

这样做的好处是所有文章共用一份图片，路径统一。缺点是文章多了以后目录会很乱 —— 那时可以打开站点配置里的 `post_asset_folder: true`，改成每篇文章一个同名文件夹。

图片点击会自动放大（`fancybox: true`）。

## 九、摘要与「阅读全文」

首页显示多少内容，取决于 front-matter 里的 `description`。写了 `description`，首页就只显示它；没写的话，NexT 会截取正文前半段。

也可以手动在正文里插一行 `<!-- more -->`，它之前的内容就是摘要。

## 十、写作流程

```bash
hexo new "文章标题"      # 生成 source/_posts/文章标题.md
hexo server             # 打开 http://localhost:4000 实时预览
hexo clean && hexo g && hexo d   # 满意后发布
```

发布完别忘了把源码也提交上去：

```bash
git add . && git commit -m "post: 文章标题" && git push
```

## 小结

日常真正高频用到的其实就几样：**front-matter 写对、`description` 写上、`note` 划重点、`tabs` 做并列、代码块标语言**。剩下的用到再回来查就行。
