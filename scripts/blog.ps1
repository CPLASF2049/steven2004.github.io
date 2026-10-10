<#
  blog.ps1 —— 博客日常操作脚本

  一般不用直接运行它，在项目根目录用 blog.cmd 更方便：
      blog preview              本地预览
      blog new "文章标题" [slug] 新建文章
      blog build                只构建，不发布
      blog deploy               构建并发布站点（推送到 gh-pages）
      blog save [提交说明]       把源码提交并推送到 main
      blog publish [提交说明]    发布站点 + 同步源码（最常用）
      blog setup                首次初始化 Git 并关联 GitHub 仓库
      blog status               看一眼当前状态
      blog help                 显示帮助

  也可以直接用 PowerShell 运行：
      powershell -ExecutionPolicy Bypass -File scripts\blog.ps1 preview
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('help', 'preview', 'new', 'build', 'deploy', 'save', 'publish', 'setup', 'status')]
    [string]$Action = 'help',

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Rest = @()
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch { }

$Root    = Split-Path -Parent $PSScriptRoot
$HexoCmd = Join-Path $Root 'node_modules\.bin\hexo.cmd'
$SiteUrl = 'https://steven2004.github.io'
$RepoUrl = 'https://github.com/steven2004/steven2004.github.io.git'
$SiteName = 'Steven 的博客'

function Write-Head { param([string]$Text) Write-Host ''; Write-Host "== $Text ==" -ForegroundColor Cyan }
function Write-Info { param([string]$Text, [string]$Color = 'Gray') Write-Host "   $Text" -ForegroundColor $Color }
function Die { param([string]$Text) Write-Host ''; Write-Host "x  $Text" -ForegroundColor Red; exit 1 }

function Assert-Hexo {
    if (-not (Test-Path -LiteralPath $HexoCmd)) {
        Die "没有找到 Hexo（$HexoCmd）。`n     请先在项目目录执行：npm install"
    }
}

function Invoke-Hexo {
    param([string[]]$HexoArgs)
    Assert-Hexo
    Push-Location $Root
    try {
        & $HexoCmd @HexoArgs
        if ($LASTEXITCODE -ne 0) { Die "hexo $($HexoArgs -join ' ') 执行失败（退出码 $LASTEXITCODE）" }
    } finally { Pop-Location }
}

function Invoke-Git {
    param([string[]]$GitArgs)
    Push-Location $Root
    try {
        & git @GitArgs
        if ($LASTEXITCODE -ne 0) { Die "git $($GitArgs -join ' ') 执行失败（退出码 $LASTEXITCODE）" }
    } finally { Pop-Location }
}

function Get-GitOutput {
    param([string[]]$GitArgs)
    Push-Location $Root
    try { return (& git @GitArgs 2>$null) } finally { Pop-Location }
}

function Show-Help {
    Write-Host ''
    Write-Host "  $SiteName —— 博客操作脚本" -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  用法：blog <命令> [参数]' -ForegroundColor White
    Write-Host ''
    Write-Host '    preview               本地预览（http://localhost:4000）'
    Write-Host '    new "标题" [slug]     新建文章；slug 是英文短名，用于生成网址'
    Write-Host '    build                 只构建到 public/，不发布'
    Write-Host '    deploy                构建并发布站点到 gh-pages 分支'
    Write-Host '    save [说明]           把源码提交并推送到 main 分支'
    Write-Host '    publish [说明]        deploy + save，日常发文章用这个'
    Write-Host '    setup                 首次初始化 Git 并关联 GitHub 仓库'
    Write-Host '    status                查看当前状态'
    Write-Host ''
    Write-Host '  例子：' -ForegroundColor White
    Write-Host '    blog new "我的第一篇文章" my-first-post'
    Write-Host '    blog preview'
    Write-Host '    blog publish "post: 我的第一篇文章"'
    Write-Host ''
}

function Invoke-Preview {
    Assert-Hexo
    Write-Head '本地预览'
    Write-Info "浏览器打开： http://localhost:4000" 'Green'
    Write-Info '按 Ctrl+C 停止'
    Write-Host ''
    Push-Location $Root
    try { & $HexoCmd server } finally { Pop-Location }
}

function Invoke-New {
    $title = if ($Rest.Count -ge 1) { $Rest[0] } else { '' }
    if ([string]::IsNullOrWhiteSpace($title)) {
        Write-Host ''
        $title = Read-Host '  文章标题'
    }
    if ([string]::IsNullOrWhiteSpace($title)) { Die '标题不能为空。' }

    $slug = if ($Rest.Count -ge 2) { $Rest[1] } else { '' }

    if ([string]::IsNullOrWhiteSpace($slug)) {
        # 没给 slug 就用标题当文件名，去掉 Windows 文件名不允许的字符
        $fileName = ($title -replace '[\\/:*?"<>|]', '').Trim()
    } else {
        $fileName = ($slug -replace '[\\/:*?"<>|]', '').Trim()
    }
    if ([string]::IsNullOrWhiteSpace($fileName)) { Die '文件名不能为空，请换一个标题或指定 slug。' }

    $postsDir = Join-Path $Root 'source\_posts'
    if (-not (Test-Path -LiteralPath $postsDir)) { New-Item -ItemType Directory -Force -Path $postsDir | Out-Null }

    $path = Join-Path $postsDir ($fileName + '.md')
    if (Test-Path -LiteralPath $path) {
        Die "文章已存在：$path`n     换个标题，或者手动打开它继续写。"
    }

    $now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $safeTitle = $title.Replace('"', '\"')
    $template = @'
---
title: "__TITLE__"
date: __DATE__
updated: __DATE__
categories:
  - 随笔
tags:
  - 待补充
description: 一句话摘要，会显示在首页列表里，记得改。
comments: true
---

在这里开始写正文。

<!-- more -->

## 小标题

正文内容。
'@
    $content = $template.Replace('__TITLE__', $safeTitle).Replace('__DATE__', $now)
    [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))

    $urlPath = if ([string]::IsNullOrWhiteSpace($slug)) { $fileName } else { $fileName }
    Write-Head '已创建文章'
    Write-Info $path 'Green'
    Write-Info "预计网址：$SiteUrl/$(Get-Date -Format 'yyyy/MM/dd')/$urlPath/"
    Write-Info '标题、分类、标签、摘要都在文件开头的 front-matter 里改。'
    Write-Host ''

    if ($env:EDITOR) {
        Write-Info "用 $($env:EDITOR) 打开..."
        & $env:EDITOR $path
    } else {
        Write-Info '没设置 $env:EDITOR，可以用编辑器手动打开它。'
        Write-Info '想自动打开，可以设置： setx EDITOR notepad'
    }
    Write-Host ''
}

function Invoke-Build {
    Write-Head '构建站点'
    Invoke-Hexo @('clean')
    Invoke-Hexo @('generate')
    Write-Info '构建完成，产物在 public/ 目录。' 'Green'
}

function Publish-Site {
    Write-Head '构建并发布'
    Invoke-Hexo @('clean')
    Invoke-Hexo @('generate')
    Invoke-Hexo @('deploy')
    Write-Host ''
    Write-Info "站点地址：$SiteUrl" 'Green'
    Write-Info 'GitHub 需要 1-2 分钟构建，稍后刷新即可。'
    Write-Info '第一次部署的话，记得去仓库 Settings -> Pages，把 Source 选成 gh-pages 分支。'
    Write-Host ''
}

function Save-Source {
    param([string[]]$MessageArgs)

    Write-Head '提交并推送源码'
    if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
        Die "还没有初始化 Git。先运行：blog setup"
    }

    $status = Get-GitOutput @('status', '--porcelain')
    if ($status) {
        Invoke-Git @('add', '-A')
        $message = if ($MessageArgs -and $MessageArgs.Count -gt 0) {
            $MessageArgs -join ' '
        } else {
            'chore: 更新博客源码 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
        }
        Invoke-Git @('commit', '-m', $message)
    } else {
        Write-Info '没有需要提交的改动。'
    }

    $branch = (Get-GitOutput @('rev-parse', '--abbrev-ref', 'HEAD') | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($branch)) { $branch = 'main' }

    try {
        Invoke-Git @('push', '-u', 'origin', $branch)
    } catch {
        Write-Host ''
        Write-Info '推送失败。常见原因：' 'Yellow'
        Write-Info '1. 还没在 GitHub 上创建仓库 steven2004.github.io'
        Write-Info '2. HTTPS 推送需要 Personal Access Token，而不是账号密码'
        Write-Info '   （GitHub 设置 -> Developer settings -> Personal access tokens）'
        Write-Info '3. 或者改用 SSH：git remote set-url origin git@github.com:steven2004/steven2004.github.io.git'
        throw
    }
    Write-Host ''
    Write-Info "源码已推送到 origin/$branch" 'Green'
    Write-Host ''
}

function Invoke-Setup {
    Write-Head '初始化 Git 并关联 GitHub'
    Write-Info "远程仓库：$RepoUrl"

    if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
        Invoke-Git @('init', '-b', 'main')
        Write-Info '已执行 git init -b main'
    } else {
        Write-Info '已经是一个 Git 仓库了。'
    }

    $remotes = @(Get-GitOutput @('remote'))
    if ($remotes -contains 'origin') {
        Invoke-Git @('remote', 'set-url', 'origin', $RepoUrl)
        Write-Info '已更新 origin 地址'
    } else {
        Invoke-Git @('remote', 'add', 'origin', $RepoUrl)
        Write-Info '已添加 origin'
    }

    Invoke-Git @('add', '-A')
    $status = Get-GitOutput @('status', '--porcelain')
    if ($status) {
        Invoke-Git @('commit', '-m', 'chore: 初始化博客项目')
    } else {
        Write-Info '没有需要提交的改动。'
    }

    Write-Host ''
    Write-Info '接下来请手动确认两件事：' 'Yellow'
    Write-Info '1. GitHub 上已经创建了公开仓库 steven2004.github.io'
    Write-Info '2. 本地已经配置好推送凭据（Personal Access Token 或 SSH 密钥）'
    Write-Host ''
    $answer = Read-Host '  现在推送源码到 main 吗？(y/N)'
    if ($answer -match '^[Yy]') {
        Invoke-Git @('push', '-u', 'origin', 'main')
        Write-Info '源码已推送。' 'Green'
    } else {
        Write-Info '已跳过推送。之后可以运行：blog save'
    }

    Write-Host ''
    Write-Head '首次上线还差两步'
    Write-Info '1. 运行 blog deploy —— 把站点发布到 gh-pages 分支'
    Write-Info '2. 仓库 Settings -> Pages：Source 选 Deploy from a branch，'
    Write-Info '   Branch 选 gh-pages，目录选 / (root)，保存'
    Write-Info "然后访问 $SiteUrl 就能看到了。"
    Write-Host ''
}

function Invoke-Status {
    Write-Head 'Git 状态'
    if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
        Write-Info '还不是 Git 仓库，运行 blog setup 初始化。' 'Yellow'
    } else {
        & git -C $Root status -sb
        Write-Host ''
        Write-Host '   远程仓库：' -NoNewline; & git -C $Root remote -v
        Write-Host ''
        Write-Host '   最近提交：'
        & git -C $Root log --oneline -5
    }

    Write-Head '部署配置'
    $cfgPath = Join-Path $Root '_config.yml'
    if (Test-Path -LiteralPath $cfgPath) {
        $cfg = Get-Content -LiteralPath $cfgPath -Raw
        $repo = [regex]::Match($cfg, '(?m)^\s*repo:\s*(\S+)')
        $branch = [regex]::Match($cfg, '(?m)^\s*branch:\s*(\S+)')
        if ($repo.Success) { Write-Info "仓库：$($repo.Groups[1].Value)" }
        if ($branch.Success) { Write-Info "分支：$($branch.Groups[1].Value)  （GitHub Pages 从这里发布）" }
    }

    Write-Head '文章'
    $postsDir = Join-Path $Root 'source\_posts'
    if (Test-Path -LiteralPath $postsDir) {
        $posts = Get-ChildItem -LiteralPath $postsDir -Filter *.md
        Write-Info "共 $($posts.Count) 篇文章："
        $posts | Sort-Object LastWriteTime -Descending | Select-Object -First 8 | ForEach-Object {
            Write-Info ("  {0}  ({1})" -f $_.Name, $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))
        }
    }
    Write-Host ''
}

switch ($Action) {
    'help'    { Show-Help }
    'preview' { Invoke-Preview }
    'new'     { Invoke-New }
    'build'   { Invoke-Build }
    'deploy'  { Publish-Site }
    'save'    { Save-Source -MessageArgs $Rest }
    'publish' { Publish-Site; Save-Source -MessageArgs $Rest }
    'setup'   { Invoke-Setup }
    'status'  { Invoke-Status }
}
