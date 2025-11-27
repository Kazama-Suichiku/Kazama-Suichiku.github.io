/**
 * 首页模块
 * 处理文章列表页面
 */

import { $, setHTML } from '../utils/dom.js';
import { highlightText, truncate, escapeHtml, debounce } from '../utils/helpers.js';
import { CATEGORIES, PAGINATION, ANIMATION_CONFIG } from '../config.js';
import { isAdmin, onArticlesChange, deleteArticle, saveArticle } from '../modules/firebase.js';
import { initScrollAnimations, disconnectScrollAnimations } from '../modules/scroll.js';
import { showImageModal } from '../modules/modal.js';
import notify from '../modules/notification.js';
import { compressImage } from '../utils/image.js';
import { showSkeleton } from '../modules/loading.js';
import { getLimiter } from '../utils/rate-limiter.js';

// 文章数据
let articles = [];

// 当前页码
let currentPage = 1;

// 当前筛选条件
let currentCategory = '';
let currentQuery = '';

/**
 * 设置文章数据
 * @param {Array} data - 文章数组
 */
export function setArticles(data) {
    articles = data || [];
}

/**
 * 获取文章数据
 * @returns {Array}
 */
export function getArticles() {
    return articles;
}

/**
 * 渲染文章列表
 * @param {Array} filteredArticles - 筛选后的文章
 * @param {string} query - 搜索关键词
 * @param {number} page - 页码
 */
function renderArticles(filteredArticles, query = '', page = 1) {
    const articleList = $('.article-list');
    if (!articleList) return;
    
    // 移除旧的分页
    const existingPagination = $('.pagination');
    if (existingPagination) existingPagination.remove();
    
    articleList.innerHTML = '';
    
    const perPage = PAGINATION.perPage;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedArticles = filteredArticles.slice(start, end);
    
    if (paginatedArticles.length === 0) {
        articleList.innerHTML = `
            <div class="empty animate-on-scroll">
                ${page === 1 ? '没有找到匹配的文章！' : '已到达最后一页。'}
            </div>
        `;
        initScrollAnimations();
        return;
    }
    
    paginatedArticles.forEach(article => {
        if (!article || !article.id) return;
        
        const div = document.createElement('div');
        div.className = 'article animate-on-scroll';
        
        const summary = truncate((article.content || '').replace(/\n/g, ' '), 120);
        const imageSrc = (Array.isArray(article.images) && article.images[0]) ? article.images[0] : '';
        
        div.innerHTML = `
            ${imageSrc ? `<img src="${imageSrc}" alt="${escapeHtml(article.title || '文章')} 图片" onerror="this.style.display='none';">` : ''}
            <div class="content">
                <h2><a href="#article/${article.id}" class="article-link" data-id="${article.id}">${highlightText(escapeHtml(article.title || '无题'), query)}</a></h2>
                <p>${highlightText(escapeHtml(summary), query)}</p>
                <p>分类: ${escapeHtml(article.category || '其他')} | 日期: ${article.date || '未知'}</p>
                <div class="article-actions">
                    ${isAdmin() ? `
                        <button class="edit-button" data-id="${article.id}" title="编辑文章">编辑</button>
                        <button class="delete-button" data-id="${article.id}" title="删除文章">删除</button>
                    ` : ''}
                </div>
            </div>
        `;
        
        articleList.appendChild(div);
        
        // 图片点击预览
        const img = div.querySelector('img');
        if (img && imageSrc) {
            img.style.cursor = 'pointer';
            img.onclick = (e) => {
                e.stopPropagation();
                showImageModal(imageSrc);
            };
        }
    });
    
    // 渲染分页
    renderPagination(filteredArticles.length, page, articleList);
    
    initScrollAnimations();
}

/**
 * 渲染分页
 * @param {number} total - 总数
 * @param {number} page - 当前页
 * @param {HTMLElement} container - 容器
 */
function renderPagination(total, page, container) {
    const perPage = PAGINATION.perPage;
    const totalPages = Math.ceil(total / perPage);
    
    if (totalPages <= 1) return;
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination animate-on-scroll';
    
    // 上一页
    pagination.innerHTML = page > 1
        ? `<button data-page="${page - 1}" title="上一页">«</button>`
        : `<button disabled title="已是首页">«</button>`;
    
    // 页码
    const maxPages = PAGINATION.maxVisiblePages;
    let startPage = Math.max(1, page - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
        pagination.innerHTML += `<button data-page="1">1</button>`;
        if (startPage > 2) pagination.innerHTML += `<span>...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `<button ${i === page ? 'class="active"' : ''} data-page="${i}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pagination.innerHTML += `<span>...</span>`;
        pagination.innerHTML += `<button data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // 下一页
    pagination.innerHTML += page < totalPages
        ? `<button data-page="${page + 1}" title="下一页">»</button>`
        : `<button disabled title="已是末页">»</button>`;
    
    container.insertAdjacentElement('afterend', pagination);
}

/**
 * 更新文章列表
 * @param {number} page - 页码
 */
export function updateArticles(page = 1) {
    currentPage = page;
    
    let filteredArticles = [...articles].reverse();
    
    if (currentCategory) {
        filteredArticles = filteredArticles.filter(a => a.category === currentCategory);
    }
    
    if (currentQuery) {
        const query = currentQuery.toLowerCase();
        filteredArticles = filteredArticles.filter(a => 
            (a.title || '').toLowerCase().includes(query) || 
            (a.content || '').toLowerCase().includes(query)
        );
    }
    
    renderArticles(filteredArticles, currentQuery, page);
}

/**
 * 渲染新文章表单（管理员）
 */
function renderAdminNewArticle() {
    const container = $('#adminNewArticleContainer');
    if (!container) return;
    
    if (!isAdmin()) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <details class="new-article-toggle animate-on-scroll" style="animation-delay: 0.1s;">
            <summary>发布新文章 »</summary>
            <form id="newArticleForm" class="new-article-form" novalidate>
                <label for="newArticleTitle">标题:</label>
                <input type="text" id="newArticleTitle" required>
                <label for="newArticleCategory">分类:</label>
                <select id="newArticleCategory" required>
                    <option value="" disabled selected>选择分类</option>
                    ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <label for="newArticleContent">内容:</label>
                <textarea id="newArticleContent" required></textarea>
                <label for="newArticleImage">图片（最多5张）:</label>
                <input type="file" id="newArticleImage" accept="image/jpeg,image/png" multiple>
                <div class="image-preview" id="newImagePreview">
                    <p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>
                </div>
                <button type="submit">发布文章</button>
            </form>
        </details>
    `;
    
    bindNewArticleForm();
}

/**
 * 绑定新文章表单事件
 */
function bindNewArticleForm() {
    const form = $('#newArticleForm');
    if (!form) return;
    
    const imageInput = form.querySelector('#newArticleImage');
    const previewContainer = form.querySelector('#newImagePreview');
    let newArticleFiles = [];
    
    if (imageInput && previewContainer) {
        imageInput.onchange = async function() {
            newArticleFiles = Array.from(this.files);
            previewContainer.innerHTML = '';
            
            if (newArticleFiles.length > 5) {
                notify.error('最多可上传5张图片');
                this.value = '';
                newArticleFiles = [];
                previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
                return;
            }
            
            if (newArticleFiles.length > 0) {
                for (const file of newArticleFiles) {
                    try {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.alt = "新图片预览";
                            img.style.cssText = 'max-width:80px; max-height:80px; border-radius:4px; margin:5px;';
                            previewContainer.appendChild(img);
                        };
                        reader.readAsDataURL(file);
                    } catch (err) {
                        notify.error(`无法预览图片 ${file.name}`);
                    }
                }
            } else {
                previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
            }
        };
    }
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const title = $('#newArticleTitle').value.trim();
        const category = $('#newArticleCategory').value;
        const content = $('#newArticleContent').value.trim();
        
        if (!title || !category || !content) {
            notify.error('请填写标题、分类和内容');
            return;
        }
        
        let compressedImages = [];
        if (newArticleFiles.length > 0) {
            notify.info('正在处理图片...');
            const promises = newArticleFiles.map(f => 
                compressImage(f, false).catch(err => {
                    notify.error(`图片${f.name}处理失败: ${err.message}`);
                    return null;
                })
            );
            compressedImages = (await Promise.all(promises)).filter(i => i !== null);
            newArticleFiles = [];
        }
        
        const date = new Date().toISOString().split('T')[0];
        const newId = Date.now().toString();
        
        const newArticle = {
            id: newId,
            title,
            category,
            content,
            date,
            images: compressedImages
        };
        
        await saveArticle(newArticle);
        
        form.reset();
        if (previewContainer) {
            previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
        }
        
        const details = $('.new-article-toggle');
        if (details) details.open = false;
        
        notify.success('文章发布成功');
    };
}

/**
 * 显示首页
 */
export function showHome() {
    disconnectScrollAnimations();
    
    const content = $('#content');
    if (!content) return;
    
    content.innerHTML = `
        <h1 class="animate-on-scroll">文章列表</h1>
        <div class="filters animate-on-scroll" style="animation-delay: 0.05s;">
            <select id="categoryFilter" title="按分类筛选">
                <option value="">所有分类</option>
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <input type="text" id="searchInput" placeholder="搜索文章..." title="输入关键词搜索">
        </div>
        <div id="adminNewArticleContainer"></div>
        <div class="article-list"></div>
    `;
    
    const categoryFilter = $('#categoryFilter');
    const searchInput = $('#searchInput');
    
    // 恢复筛选状态
    if (categoryFilter && currentCategory) {
        categoryFilter.value = currentCategory;
    }
    if (searchInput && currentQuery) {
        searchInput.value = currentQuery;
    }
    
    // 分类筛选
    if (categoryFilter) {
        categoryFilter.onchange = () => {
            currentCategory = categoryFilter.value;
            updateArticles(1);
        };
    }
    
    // 搜索
    if (searchInput) {
        const handleSearch = debounce(() => {
            currentQuery = searchInput.value.trim();
            updateArticles(1);
            renderSearchSuggestions();
        }, 300);
        
        searchInput.oninput = handleSearch;
        
        searchInput.onblur = () => {
            setTimeout(() => {
                const suggestions = searchInput.parentNode.querySelector('.search-suggestions');
                if (suggestions && !suggestions.matches(':hover')) {
                    suggestions.remove();
                }
            }, 150);
        };
    }
    
    renderAdminNewArticle();
    updateArticles(currentPage);
}

/**
 * 渲染搜索建议
 */
function renderSearchSuggestions() {
    const searchInput = $('#searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const suggestionsContainer = searchInput.parentNode;
    
    let suggestions = suggestionsContainer.querySelector('.search-suggestions');
    if (suggestions) suggestions.remove();
    
    if (!query) return;
    
    suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    
    const matches = articles.filter(a => 
        (a.title || '').toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (matches.length) {
        suggestions.innerHTML = matches.map(a => `
            <div class="suggestion" title="${escapeHtml(a.title || '')}">${highlightText(escapeHtml(a.title || '无题'), query)}</div>
        `).join('');
        
        suggestionsContainer.appendChild(suggestions);
        
        suggestions.querySelectorAll('.suggestion').forEach(el => {
            el.onclick = () => {
                const originalTitle = el.getAttribute('title') || el.textContent;
                searchInput.value = originalTitle;
                suggestions.remove();
                currentQuery = originalTitle;
                updateArticles(1);
            };
        });
    }
}

/**
 * 处理文章删除
 * @param {string} articleId - 文章 ID
 */
export async function handleDeleteArticle(articleId) {
    const article = articles.find(a => String(a.id) === String(articleId));
    const msg = `确定删除文章 "${article ? article.title : '此文章'}"？`;
    
    if (!window.confirm(msg)) return;
    
    await deleteArticle(articleId);
    notify.success('文章已删除');
    updateArticles(currentPage);
}

/**
 * 处理分页点击
 * @param {number} page - 页码
 */
export function handlePageChange(page) {
    updateArticles(page);
    
    const listTop = $('.article-list')?.offsetTop || $('#content').offsetTop;
    window.scrollTo({ top: listTop - 70, behavior: 'smooth' });
}

export default {
    show: showHome,
    setArticles,
    getArticles,
    updateArticles,
    handleDeleteArticle,
    handlePageChange
};

