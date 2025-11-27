/**
 * 文章导航模块
 * 上一篇/下一篇
 */

import { escapeHtml, truncate } from '../utils/helpers.js';

/**
 * 获取上一篇和下一篇文章
 * @param {Array} articles - 文章数组（已排序）
 * @param {string} currentId - 当前文章 ID
 * @returns {{prev: Object|null, next: Object|null}}
 */
export function getAdjacentArticles(articles, currentId) {
    const index = articles.findIndex(a => String(a.id) === String(currentId));
    
    if (index === -1) {
        return { prev: null, next: null };
    }
    
    return {
        prev: index > 0 ? articles[index - 1] : null,
        next: index < articles.length - 1 ? articles[index + 1] : null
    };
}

/**
 * 创建上下篇导航 HTML
 * @param {Object} prev - 上一篇文章
 * @param {Object} next - 下一篇文章
 * @returns {string}
 */
export function createArticleNav(prev, next) {
    if (!prev && !next) return '';
    
    let html = '<nav class="article-nav">';
    
    if (prev) {
        html += `
            <a href="#article/${prev.id}" class="nav-item nav-prev">
                <span class="nav-label">
                    <i class="fas fa-chevron-left"></i>
                    上一篇
                </span>
                <span class="nav-title">${escapeHtml(truncate(prev.title, 40))}</span>
            </a>
        `;
    } else {
        html += '<div class="nav-item nav-prev empty"></div>';
    }
    
    if (next) {
        html += `
            <a href="#article/${next.id}" class="nav-item nav-next">
                <span class="nav-label">
                    下一篇
                    <i class="fas fa-chevron-right"></i>
                </span>
                <span class="nav-title">${escapeHtml(truncate(next.title, 40))}</span>
            </a>
        `;
    } else {
        html += '<div class="nav-item nav-next empty"></div>';
    }
    
    html += '</nav>';
    return html;
}

/**
 * 计算阅读时间
 * @param {string} content - 文章内容
 * @returns {number} - 分钟数
 */
export function calculateReadingTime(content) {
    if (!content) return 1;
    
    // 中文按字数计算，英文按单词计算
    // 假设阅读速度：中文 400字/分钟，英文 200词/分钟
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    
    const minutes = Math.ceil(chineseChars / 400 + englishWords / 200);
    return Math.max(1, minutes);
}

/**
 * 创建文章元信息 HTML
 * @param {Object} article - 文章对象
 * @param {Object} options - 选项
 * @returns {string}
 */
export function createArticleMeta(article, options = {}) {
    const { showReadingTime = true, showViews = false, views = 0 } = options;
    const readingTime = calculateReadingTime(article.content);
    
    let html = '<div class="article-meta">';
    
    // 日期
    if (article.date) {
        html += `<span class="meta-item"><i class="fas fa-calendar-alt"></i> ${article.date}</span>`;
    }
    
    // 分类
    if (article.category) {
        html += `<span class="meta-item"><i class="fas fa-folder"></i> ${escapeHtml(article.category)}</span>`;
    }
    
    // 阅读时间
    if (showReadingTime) {
        html += `<span class="meta-item"><i class="fas fa-clock"></i> 约 ${readingTime} 分钟</span>`;
    }
    
    // 阅读量
    if (showViews) {
        html += `<span class="meta-item"><i class="fas fa-eye"></i> ${views} 次阅读</span>`;
    }
    
    html += '</div>';
    return html;
}

export default {
    getAdjacentArticles,
    createArticleNav,
    calculateReadingTime,
    createArticleMeta
};

