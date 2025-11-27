# 翠竹的博客 (Kazama-Suichiku's Blog)

一个现代化的个人博客网站，采用模块化架构设计，易于维护和扩展。

## 🌟 特性

### 核心功能
- 📱 响应式设计，支持多种设备
- 🌙 明暗主题切换
- ✨ 粒子动画背景
- 📝 Markdown 编辑器支持
- 💬 评论系统（支持嵌套回复）
- 🔐 Firebase 用户认证
- 🖼️ 图片预览和图库功能
- 🔍 文章搜索和分类筛选

### 性能优化
- ⚡ Firebase Storage 图片存储（支持 CDN）
- 🦴 骨架屏加载状态
- 📊 阅读进度条
- 🔄 统一错误处理
- 📱 移动端优化导航

### SEO 优化
- 🏷️ 完整的 Meta 标签
- 🗺️ Sitemap 站点地图
- 🤖 robots.txt 爬虫配置
- 📄 404 错误页面
- 🔗 Open Graph 社交分享

### 安全特性
- 🛡️ Firebase 安全规则
- ⏱️ 评论速率限制
- 🔒 XSS 防护 (DOMPurify)
- 👮 管理员身份验证

## 📁 项目结构

```
├── index.html              # 主入口 HTML 文件
├── 404.html                # 404 错误页面
├── sitemap.xml             # 站点地图
├── robots.txt              # 爬虫配置
├── firebase.rules.json     # Firebase 安全规则
├── README.md               # 项目说明文档
├── src/                    # 源代码目录
│   ├── css/               # 样式文件
│   │   ├── base/          # 基础样式
│   │   │   ├── variables.css   # CSS 变量定义
│   │   │   ├── reset.css       # 重置样式
│   │   │   └── typography.css  # 排版样式
│   │   ├── layouts/       # 布局样式
│   │   │   ├── header.css      # 头部导航
│   │   │   ├── container.css   # 主容器
│   │   │   ├── sidebar.css     # 侧边栏
│   │   │   └── footer.css      # 页脚
│   │   ├── components/    # 组件样式
│   │   │   ├── buttons.css     # 按钮
│   │   │   ├── forms.css       # 表单
│   │   │   ├── cards.css       # 卡片
│   │   │   ├── modal.css       # 模态框
│   │   │   ├── pagination.css  # 分页
│   │   │   ├── notification.css # 通知
│   │   │   ├── particles.css   # 粒子背景
│   │   │   ├── scrollbar.css   # 滚动条
│   │   │   ├── animations.css  # 动画
│   │   │   ├── editor.css      # 编辑器
│   │   │   ├── skeleton.css    # 骨架屏
│   │   │   ├── loading.css     # 加载状态
│   │   │   └── mobile-nav.css  # 移动端导航
│   │   ├── pages/         # 页面样式
│   │   │   ├── article.css     # 文章详情页
│   │   │   └── about.css       # 关于页面
│   │   └── main.css       # 样式入口文件
│   └── js/                # JavaScript 文件
│       ├── config.js      # 配置文件
│       ├── app.js         # 应用入口
│       ├── utils/         # 工具函数
│       │   ├── dom.js          # DOM 操作
│       │   ├── helpers.js      # 通用工具
│       │   ├── image.js        # 图片处理
│       │   ├── storage.js      # Firebase Storage
│       │   ├── error-handler.js # 错误处理
│       │   └── rate-limiter.js # 速率限制
│       ├── modules/       # 功能模块
│       │   ├── notification.js # 通知模块
│       │   ├── theme.js        # 主题模块
│       │   ├── particles.js    # 粒子动画
│       │   ├── firebase.js     # Firebase 模块
│       │   ├── modal.js        # 模态框模块
│       │   ├── scroll.js       # 滚动模块
│       │   ├── markdown.js     # Markdown 模块
│       │   ├── avatar.js       # 头像模块
│       │   ├── router.js       # 路由模块
│       │   ├── loading.js      # 加载状态模块
│       │   ├── mobile-nav.js   # 移动端导航
│       │   └── seo.js          # SEO 模块
│       └── pages/         # 页面模块
│           ├── home.js         # 首页
│           ├── article.js      # 文章详情
│           ├── edit.js         # 文章编辑
│           └── about.js        # 关于页面
└── assets/                # 静态资源
    ├── images/            # 图片资源
    └── icons/             # 图标资源
```

## 🏗️ 架构说明

### CSS 架构

采用模块化 CSS 架构，按功能分类：

- **base/**: 基础样式，包括 CSS 变量、重置样式、排版
- **layouts/**: 布局相关样式
- **components/**: 可复用组件样式
- **pages/**: 特定页面样式

### JavaScript 架构

采用 ES6 模块化架构：

- **config.js**: 集中管理所有配置（Firebase、管理员、分类等）
- **utils/**: 工具函数库
- **modules/**: 功能模块（单一职责原则）
- **pages/**: 页面逻辑模块

### 路由系统

使用 Hash 路由实现 SPA：

- `#home` - 首页（文章列表）
- `#article/{id}` - 文章详情
- `#edit/{id}` - 编辑文章（管理员）
- `#about` - 关于页面

## 🚀 快速开始

### 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/Kazama-Suichiku/Kazama-Suichiku.github.io.git
cd Kazama-Suichiku.github.io
```

2. 使用本地服务器运行（推荐使用 VS Code 的 Live Server 插件）

3. 打开浏览器访问 `http://localhost:5500`

### 部署

项目可直接部署到 GitHub Pages：

1. 确保仓库名为 `username.github.io`
2. 推送代码到 `main` 分支
3. 访问 `https://username.github.io`

## 🔧 配置说明

所有配置集中在 `src/js/config.js` 文件中：

```javascript
// Firebase 配置
export const FIREBASE_CONFIG = { ... };

// 管理员配置
export const ADMIN_CONFIG = {
    email: 'admin@example.com',
    avatarUid: '...'
};

// 文章分类
export const CATEGORIES = ['技术', '生活', '其他'];

// 分页配置
export const PAGINATION = {
    perPage: 5,
    maxVisiblePages: 5
};

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
    comment: {
        maxRequests: 3,
        windowMs: 60000,      // 1分钟
        blockDuration: 300000  // 5分钟
    }
};
```

## 🔒 安全配置

### Firebase 安全规则

将 `firebase.rules.json` 中的规则部署到 Firebase Console：

```json
{
  "rules": {
    "articles": {
      ".read": true,
      ".write": "auth != null && auth.token.email == 'admin@example.com'"
    },
    "comments": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### 速率限制

评论系统内置速率限制，防止恶意刷评论：
- 每分钟最多 3 条评论
- 超限后封禁 5 分钟

## 📦 依赖

- [Firebase](https://firebase.google.com/) - 用户认证、数据库、存储
- [Particles.js](https://vincentgarreau.com/particles.js/) - 粒子动画
- [EasyMDE](https://github.com/Ionaru/easy-markdown-editor) - Markdown 编辑器
- [Marked.js](https://marked.js.org/) - Markdown 解析
- [DOMPurify](https://github.com/cure53/DOMPurify) - XSS 防护
- [Highlight.js](https://highlightjs.org/) - 代码高亮
- [Font Awesome](https://fontawesome.com/) - 图标库
- [Google Fonts](https://fonts.google.com/) - 字体

## 🔄 更新日志

### v2.0.0 (2025-01)
- ✨ 重构为模块化架构
- ✨ 添加 Firebase Storage 支持
- ✨ 添加骨架屏和加载状态
- ✨ 添加阅读进度条
- ✨ 添加移动端导航优化
- ✨ 添加 SEO 优化（Meta/Sitemap/404）
- ✨ 添加评论速率限制
- ✨ 添加统一错误处理
- 🔒 增强安全性（Firebase 规则）

### v1.0.0
- 🎉 初始版本发布

## 📄 许可证

MIT License

## 👤 作者

**Kazama_Suichiku**

- 知乎: [@Kazama_Suichiku](https://www.zhihu.com/people/48-52-52-27-65)
- Bilibili: [@Kazama_Suichiku](https://space.bilibili.com/56807642)
- GitHub: [@Kazama-Suichiku](https://github.com/Kazama-Suichiku)
