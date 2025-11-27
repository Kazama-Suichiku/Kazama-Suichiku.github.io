/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function}
 */
export function throttle(fn, limit = 100) {
    let inThrottle = false;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * HTML 转义
 * @param {string} str - 要转义的字符串
 * @returns {string}
 */
export function escapeHtml(str) {
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return String(str).replace(/[&<>"']/g, s => escapeMap[s]);
}

/**
 * 高亮文本中的搜索关键词
 * @param {string} text - 原文本
 * @param {string} query - 搜索关键词
 * @returns {string}
 */
export function highlightText(text, query) {
    if (!text || !query) return text || '';
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        return String(text).replace(regex, '<mark>$1</mark>');
    } catch (e) {
        return text;
    }
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期对象或字符串
 * @param {string} format - 格式（默认 YYYY-MM-DD）
 * @returns {string}
 */
export function formatDate(date = new Date(), format = 'YYYY-MM-DD') {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

/**
 * 安全获取 localStorage
 * @param {string} key - 键名
 * @param {*} defaultValue - 默认值
 * @returns {*}
 */
export function getStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

/**
 * 安全设置 localStorage
 * @param {string} key - 键名
 * @param {*} value - 值
 */
export function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('localStorage 保存失败:', e);
    }
}

/**
 * 截取文本并添加省略号
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string}
 */
export function truncate(text, maxLength = 120) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

/**
 * 检查是否为触摸设备
 * @returns {boolean}
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 平滑滚动到指定位置
 * @param {number} top - 目标位置
 * @param {string} behavior - 滚动行为
 */
export function scrollTo(top = 0, behavior = 'smooth') {
    window.scrollTo({ top, behavior });
}

