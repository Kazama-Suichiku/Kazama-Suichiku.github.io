/**
 * 标签系统模块
 */

import { escapeHtml } from '../utils/helpers.js';

/**
 * 从文章列表中提取所有标签
 * @param {Array} articles - 文章数组
 * @returns {Array} - 标签数组（带计数）
 */
export function extractTags(articles) {
    const tagCount = {};
    
    articles.forEach(article => {
        const tags = article.tags || [];
        tags.forEach(tag => {
            if (tag && tag.trim()) {
                const normalizedTag = tag.trim();
                tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
            }
        });
    });
    
    // 转换为数组并按数量排序
    return Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * 按标签筛选文章
 * @param {Array} articles - 文章数组
 * @param {string} tag - 标签名
 * @returns {Array}
 */
export function filterByTag(articles, tag) {
    if (!tag) return articles;
    return articles.filter(article => {
        const tags = article.tags || [];
        return tags.some(t => t.toLowerCase() === tag.toLowerCase());
    });
}

/**
 * 创建标签云 HTML
 * @param {Array} tags - 标签数组
 * @param {string} activeTag - 当前选中的标签
 * @returns {string}
 */
export function createTagCloud(tags, activeTag = '') {
    if (!tags || tags.length === 0) return '';
    
    const maxCount = Math.max(...tags.map(t => t.count));
    
    let html = '<div class="tag-cloud">';
    html += '<span class="tag-cloud-title">标签</span>';
    html += '<div class="tag-list">';
    
    tags.forEach(tag => {
        // 根据数量计算大小级别 (1-5)
        const sizeLevel = Math.ceil((tag.count / maxCount) * 5);
        const isActive = tag.name === activeTag;
        
        html += `
            <a href="#home?tag=${encodeURIComponent(tag.name)}" 
               class="tag-item size-${sizeLevel} ${isActive ? 'active' : ''}"
               data-tag="${escapeHtml(tag.name)}">
                ${escapeHtml(tag.name)}
                <span class="tag-count">${tag.count}</span>
            </a>
        `;
    });
    
    html += '</div></div>';
    return html;
}

/**
 * 创建文章标签显示 HTML
 * @param {Array} tags - 标签数组
 * @returns {string}
 */
export function createArticleTags(tags) {
    if (!tags || tags.length === 0) return '';
    
    let html = '<div class="article-tags">';
    tags.forEach(tag => {
        html += `<a href="#home?tag=${encodeURIComponent(tag)}" class="article-tag">${escapeHtml(tag)}</a>`;
    });
    html += '</div>';
    return html;
}

/**
 * 创建标签输入组件 HTML
 * @param {Array} existingTags - 已有标签
 * @param {Array} suggestedTags - 建议标签
 * @returns {string}
 */
export function createTagInput(existingTags = [], suggestedTags = []) {
    const tagsStr = existingTags.join(', ');
    
    let html = `
        <div class="tag-input-wrapper">
            <label for="articleTags">标签</label>
            <input type="text" id="articleTags" value="${escapeHtml(tagsStr)}" 
                   placeholder="输入标签，用逗号分隔（如：Unity, Shader, 教程）">
            <div class="tag-suggestions">
    `;
    
    if (suggestedTags.length > 0) {
        html += '<span class="suggestion-label">常用标签：</span>';
        suggestedTags.slice(0, 10).forEach(tag => {
            html += `<button type="button" class="tag-suggestion" data-tag="${escapeHtml(tag.name)}">${escapeHtml(tag.name)}</button>`;
        });
    }
    
    html += '</div></div>';
    return html;
}

/**
 * 解析标签输入
 * @param {string} input - 输入字符串
 * @returns {Array}
 */
export function parseTagInput(input) {
    if (!input) return [];
    return input
        .split(/[,，、]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= 20)
        .slice(0, 10); // 最多10个标签
}

export default {
    extractTags,
    filterByTag,
    createTagCloud,
    createArticleTags,
    createTagInput,
    parseTagInput
};

