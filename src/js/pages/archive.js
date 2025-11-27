/**
 * 文章归档页面模块
 */

import { $, setHTML } from '../utils/dom.js';
import { escapeHtml } from '../utils/helpers.js';
import { initScrollAnimations } from '../modules/scroll.js';
import { getArticles } from './home.js';

/**
 * 按年月分组文章
 * @param {Array} articles - 文章数组
 * @returns {Object} - 分组后的对象
 */
function groupArticlesByDate(articles) {
    const groups = {};
    
    articles.forEach(article => {
        if (!article.date) return;
        
        // 解析日期 YYYY-MM-DD
        const [year, month] = article.date.split('-');
        const key = `${year}-${month}`;
        
        if (!groups[key]) {
            groups[key] = {
                year,
                month,
                articles: []
            };
        }
        groups[key].articles.push(article);
    });
    
    // 按日期降序排序
    return Object.values(groups).sort((a, b) => {
        return `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`);
    });
}

/**
 * 获取月份中文名
 * @param {string} month - 月份数字
 * @returns {string}
 */
function getMonthName(month) {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                    '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months[parseInt(month, 10) - 1] || month;
}

/**
 * 显示归档页面
 */
export function showArchive() {
    const content = $('#content');
    if (!content) return;
    
    const articles = getArticles();
    const groups = groupArticlesByDate(articles);
    const totalCount = articles.length;
    
    let html = `
        <div class="archive-page">
            <h1 class="archive-title animate-on-scroll">文章归档</h1>
            <p class="archive-summary animate-on-scroll">共 ${totalCount} 篇文章</p>
            
            <div class="archive-timeline">
    `;
    
    groups.forEach((group, groupIndex) => {
        html += `
            <div class="archive-group animate-on-scroll" style="animation-delay: ${groupIndex * 0.1}s">
                <div class="archive-header">
                    <span class="archive-year">${group.year}</span>
                    <span class="archive-month">${getMonthName(group.month)}</span>
                    <span class="archive-count">${group.articles.length} 篇</span>
                </div>
                <ul class="archive-list">
        `;
        
        group.articles.forEach(article => {
            const day = article.date.split('-')[2] || '';
            html += `
                <li class="archive-item">
                    <span class="archive-day">${day}</span>
                    <a href="#article/${article.id}" class="archive-link">${escapeHtml(article.title)}</a>
                    <span class="archive-category">${escapeHtml(article.category || '')}</span>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    initScrollAnimations();
}

export default {
    show: showArchive
};

