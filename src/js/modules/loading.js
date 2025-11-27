/**
 * 加载状态和骨架屏模块
 */

import { $, createElement } from '../utils/dom.js';

// 加载状态
let isLoading = false;

/**
 * 创建骨架屏 HTML
 * @param {string} type - 类型 (article-list/article-detail/comments)
 * @param {number} count - 数量
 * @returns {string}
 */
export function createSkeletonHTML(type = 'article-list', count = 3) {
    switch (type) {
        case 'article-list':
            return Array(count).fill(0).map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-image skeleton-animate"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate" style="width: 60%;"></div>
                        <div class="skeleton-meta skeleton-animate"></div>
                    </div>
                </div>
            `).join('');
            
        case 'article-detail':
            return `
                <div class="skeleton-article-detail">
                    <div class="skeleton-detail-title skeleton-animate"></div>
                    <div class="skeleton-detail-meta skeleton-animate"></div>
                    <div class="skeleton-detail-image skeleton-animate"></div>
                    <div class="skeleton-detail-content">
                        <div class="skeleton-text skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate" style="width: 80%;"></div>
                        <div class="skeleton-text skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate" style="width: 70%;"></div>
                    </div>
                </div>
            `;
            
        case 'comments':
            return Array(count).fill(0).map(() => `
                <div class="skeleton-comment">
                    <div class="skeleton-comment-header">
                        <div class="skeleton-avatar skeleton-animate"></div>
                        <div class="skeleton-name skeleton-animate"></div>
                    </div>
                    <div class="skeleton-comment-body">
                        <div class="skeleton-text skeleton-animate"></div>
                        <div class="skeleton-text skeleton-animate" style="width: 70%;"></div>
                    </div>
                </div>
            `).join('');
            
        default:
            return `<div class="skeleton-loading skeleton-animate"></div>`;
    }
}

/**
 * 显示骨架屏
 * @param {HTMLElement|string} container - 容器
 * @param {string} type - 骨架屏类型
 * @param {number} count - 数量
 */
export function showSkeleton(container, type = 'article-list', count = 3) {
    const el = typeof container === 'string' ? $(container) : container;
    if (!el) return;
    
    el.innerHTML = createSkeletonHTML(type, count);
}

/**
 * 创建全局加载指示器
 */
export function createGlobalLoader() {
    if ($('#globalLoader')) return;
    
    const loader = createElement('div', {
        id: 'globalLoader',
        className: 'global-loader'
    }, `
        <div class="loader-spinner"></div>
        <div class="loader-text">加载中...</div>
    `);
    
    document.body.appendChild(loader);
}

/**
 * 显示全局加载
 * @param {string} text - 加载文本
 */
export function showGlobalLoading(text = '加载中...') {
    isLoading = true;
    let loader = $('#globalLoader');
    
    if (!loader) {
        createGlobalLoader();
        loader = $('#globalLoader');
    }
    
    const textEl = loader.querySelector('.loader-text');
    if (textEl) {
        textEl.textContent = text;
    }
    
    loader.classList.add('visible');
}

/**
 * 隐藏全局加载
 */
export function hideGlobalLoading() {
    isLoading = false;
    const loader = $('#globalLoader');
    if (loader) {
        loader.classList.remove('visible');
    }
}

/**
 * 检查是否正在加载
 * @returns {boolean}
 */
export function isGlobalLoading() {
    return isLoading;
}

/**
 * 创建阅读进度条
 */
export function createReadingProgress() {
    if ($('#readingProgress')) return;
    
    const progressBar = createElement('div', {
        id: 'readingProgress',
        className: 'reading-progress'
    });
    
    document.body.appendChild(progressBar);
}

/**
 * 更新阅读进度
 */
export function updateReadingProgress() {
    const progressBar = $('#readingProgress');
    if (!progressBar) return;
    
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    progressBar.style.width = `${Math.min(100, progress)}%`;
}

/**
 * 初始化阅读进度条
 */
export function initReadingProgress() {
    createReadingProgress();
    
    // 节流更新
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateReadingProgress();
                ticking = false;
            });
            ticking = true;
        }
    });
}

/**
 * 显示/隐藏阅读进度条
 * @param {boolean} show
 */
export function toggleReadingProgress(show) {
    const progressBar = $('#readingProgress');
    if (progressBar) {
        progressBar.style.display = show ? 'block' : 'none';
        if (show) {
            updateReadingProgress();
        }
    }
}

/**
 * 创建页面切换过渡动画
 */
export function createPageTransition() {
    if ($('#pageTransition')) return;
    
    const transition = createElement('div', {
        id: 'pageTransition',
        className: 'page-transition'
    });
    
    document.body.appendChild(transition);
}

/**
 * 执行页面切换动画
 * @param {Function} callback - 切换完成后的回调
 */
export async function doPageTransition(callback) {
    const transition = $('#pageTransition');
    if (!transition) {
        createPageTransition();
    }
    
    const el = $('#pageTransition');
    el.classList.add('active');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (callback) {
        await callback();
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    el.classList.remove('active');
}

/**
 * 按钮加载状态
 * @param {HTMLElement} button - 按钮元素
 * @param {boolean} loading - 是否加载中
 * @param {string} loadingText - 加载时的文本
 */
export function setButtonLoading(button, loading, loadingText = '处理中...') {
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
        button.classList.remove('loading');
    }
}

export default {
    createSkeletonHTML,
    showSkeleton,
    showGlobalLoading,
    hideGlobalLoading,
    isGlobalLoading,
    initReadingProgress,
    toggleReadingProgress,
    doPageTransition,
    setButtonLoading
};

