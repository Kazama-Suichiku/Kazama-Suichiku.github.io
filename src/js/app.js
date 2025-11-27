/**
 * 应用主入口
 * 初始化所有模块并启动应用
 */

import { $ } from './utils/dom.js';
import { initializeTheme } from './modules/theme.js';
import { initializeParticles } from './modules/particles.js';
import { initFirebase, onAuthStateChange, onArticlesChange, onCommentsChange, isAdmin } from './modules/firebase.js';
import { initAvatarUpload, loadAvatar } from './modules/avatar.js';
import { initBackToTop } from './modules/scroll.js';
import { updateAuthHeaderUI, showAuthModal } from './modules/modal.js';
import { initMarkdown } from './modules/markdown.js';
import { registerRoute, setDefaultRoute, initRouter, navigate } from './modules/router.js';

// 新增优化模块
import { setupGlobalErrorHandler } from './utils/error-handler.js';
import { initStorage } from './utils/storage.js';
import { createGlobalLoader, initReadingProgress, toggleReadingProgress } from './modules/loading.js';
import { initMobileNav } from './modules/mobile-nav.js';
import { initSEO, updateHomeSEO, updateArticleSEO, updateAboutSEO } from './modules/seo.js';

// 页面模块
import { showHome, setArticles, updateArticles, handleDeleteArticle, handlePageChange, getArticles } from './pages/home.js';
import { showArticle, setComments, handleDeleteComment } from './pages/article.js';
import { showEditForm } from './pages/edit.js';
import { showAbout } from './pages/about.js';
import { showArchive } from './pages/archive.js';

// 新功能模块
import { initGitHubContrib } from './modules/github-contrib.js';

/**
 * 初始化路由（带 SEO 更新）
 */
function setupRoutes() {
    setDefaultRoute('home');
    
    // 包装路由处理函数，添加 SEO 更新
    registerRoute('home', async () => {
        updateHomeSEO();
        toggleReadingProgress(false);
        await showHome();
    });
    
    registerRoute('article', async (id) => {
        toggleReadingProgress(true);
        const article = await showArticle(id);
        if (article) {
            updateArticleSEO(article);
        }
    });
    
    registerRoute('edit', async (id) => {
        toggleReadingProgress(false);
        await showEditForm(id);
    });
    
    registerRoute('about', () => {
        updateAboutSEO();
        toggleReadingProgress(false);
        showAbout();
    });
    
    registerRoute('archive', () => {
        toggleReadingProgress(false);
        showArchive();
    });
}

/**
 * 初始化全局事件处理
 */
function setupGlobalEvents() {
    // 事件委托处理
    document.addEventListener('click', async (e) => {
        const content = $('#content');
        
        // 关闭搜索建议
        if (!e.target.closest('.filters') && !e.target.closest('.search-suggestions')) {
            const suggestions = $('.search-suggestions');
            if (suggestions) suggestions.remove();
        }
        
        if (!content || !content.contains(e.target)) return;
        
        // 分页点击
        if (e.target.matches('.pagination button') && !e.target.disabled) {
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                handlePageChange(page);
            }
            return;
        }
        
        // 编辑按钮
        if (e.target.classList.contains('edit-button')) {
            const articleId = e.target.dataset.id;
            if (articleId) navigate('edit', articleId);
            return;
        }
        
        // 删除文章按钮
        if (e.target.classList.contains('delete-button')) {
            const articleId = e.target.dataset.id;
            if (articleId) await handleDeleteArticle(articleId);
            return;
        }
        
        // 删除评论按钮
        if (e.target.classList.contains('delete-comment-button')) {
            const commentId = e.target.dataset.commentId;
            const pushId = e.target.dataset.pushId;
            const articleId = $('.article-page')?.dataset.articleId;
            if (commentId && articleId) {
                await handleDeleteComment(commentId, pushId, articleId);
            }
            return;
        }
        
        // 文章链接点击
        const articleLink = e.target.closest('.article-link');
        if (articleLink) {
            e.preventDefault();
            const articleId = articleLink.dataset.id;
            if (articleId) navigate('article', articleId);
            return;
        }
    });
    
    // 表单提交委托
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form && form.classList && form.classList.contains('inline-reply-form')) {
            // 内联回复表单由各自模块处理
        }
    });
}

/**
 * 初始化数据监听
 */
function setupDataListeners() {
    // 监听文章变化
    onArticlesChange((articles) => {
        setArticles(articles);
        // 如果在首页，更新文章列表
        const hash = window.location.hash;
        if (!hash || hash === '#home') {
            if (typeof updateArticles === 'function') {
                updateArticles(1);
            }
        }
    });
    
    // 监听评论变化
    onCommentsChange((comments) => {
        setComments(comments);
        // 如果在文章页，更新评论
        const hash = window.location.hash;
        if (hash.startsWith('#article/')) {
            const articleId = hash.replace('#article/', '');
            // 重新渲染文章页以更新评论
            showArticle(articleId);
        }
    });
}

/**
 * 初始化认证状态监听
 */
function setupAuthListener() {
    onAuthStateChange((user) => {
        updateAuthHeaderUI();
        loadAvatar();
        
        // 刷新当前页面以更新权限相关 UI
        const hash = window.location.hash;
        if (!hash || hash === '#home') {
            showHome();
        }
    });
}

/**
 * 初始化应用
 */
async function initialize() {
    // 设置全局错误处理
    setupGlobalErrorHandler();
    
    // 设置年份
    const yearSpan = $('#currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    // 初始化 Firebase（异步，会检测是否需要代理）
    await initFirebase();
    
    // 初始化 Firebase Storage
    initStorage();
    
    // 初始化主题
    initializeTheme();
    
    // 初始化粒子动画（延迟加载）
    setTimeout(initializeParticles, 100);
    
    // 初始化 Markdown 渲染器
    initMarkdown();
    
    // 初始化头像上传
    initAvatarUpload();
    loadAvatar();
    
    // 初始化 SEO
    initSEO();
    
    // 创建全局加载器
    createGlobalLoader();
    
    // 初始化阅读进度条
    initReadingProgress();
    
    // 初始化移动端导航
    initMobileNav();
    
    // 初始化 GitHub 贡献图
    setTimeout(initGitHubContrib, 500);
    
    // 设置路由
    setupRoutes();
    
    // 初始化路由
    initRouter();
    
    // 初始化返回顶部
    initBackToTop();
    
    // 设置全局事件
    setupGlobalEvents();
    
    // 设置数据监听
    setupDataListeners();
    
    // 设置认证监听
    setupAuthListener();
    
    console.log('🎋 翠竹的博客 - 应用初始化完成');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initialize);

// 导出供外部使用
export { initialize };

