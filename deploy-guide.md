# 旅行伴侣 — 部署指南

> 给小马看的，照着做就行

## 一、项目在哪

- **本地代码**：`/root/.openclaw/workspace/projects/travel-companion/`
- **GitHub 仓库**：https://github.com/Katesonlin/travel-companion
- **线上地址**：https://katesonlin.github.io/travel-companion/

## 二、怎么上线的（GitHub Pages）

整个流程就三步：

### 第一步：GitHub 建仓库

1. 打开 https://github.com/new
2. 仓库名填 `travel-companion`
3. 选 **Public**（必须公开，GitHub Pages 免费版要求）
4. 其他都不勾，保持空仓库
5. 点 **Create repository**

### 第二步：本地推代码

```bash
cd /root/.openclaw/workspace/projects/travel-companion

# 初始化 git（只需第一次）
git init
git add -A
git commit -m "init: travel companion"

# 关联远程仓库（只需第一次）
git remote add origin git@github.com:Katesonlin/travel-companion.git

# 推送
git push -u origin master
```

### 第三步：开启 GitHub Pages

1. 打开仓库 → **Settings** → 左侧 **Pages**
2. **Source** 选 `master` 分支，目录选 `/ (root)`
3. 点 **Save**

等 1~3 分钟，访问 `https://你的用户名.github.io/travel-companion/` 就上线了。

## 三、后续怎么更新

改完代码，三行命令搞定：

```bash
git add -A
git commit -m "改了什么"
git push
```

推完自动部署，几分钟后线上就更新。

## 四、服务器 SSH Key 配置

如果服务器没有 SSH key，先配一个：

```bash
# 生成 key
ssh-keygen -t ed25519 -C "你的邮箱" -f ~/.ssh/github_key

# 查看公钥，复制到 GitHub → Settings → SSH and GPG keys → New SSH key
cat ~/.ssh/github_key.pub

# 配置 SSH config，让 git 自动用这个 key
cat > ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_key
  IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
```

测试连接：
```bash
ssh -T git@github.com
# 看到 "Hi Katesonlin! You've been successfully authenticated..." 就对了
```

## 五、项目结构

```
travel-companion/
├── index.html      ← 主页面（HTML 结构）
├── style.css       ← 样式（UI 设计规范）
├── app.js          ← 主逻辑（行程 CRUD、拖拽、搜索）
├── db.js           ← IndexedDB 封装（本地存储）
├── utils.js        ← 工具函数（uid、日期、toast）
├── seed.js         ← 预填数据（马来西亚 7 天 6 晚行程）
└── manifest.json   ← PWA 清单（可添加到手机桌面）
```

## 六、技术栈

- **纯前端**：HTML + CSS + JS，零框架
- **存储**：浏览器 IndexedDB，全离线可用
- **部署**：GitHub Pages 静态托管，免费、无需服务器
- **UI 规范**：Inter 字体、4px 间距系统、参考图风格
