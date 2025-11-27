/**
 * 主题模块
 * 处理明暗主题切换
 */

import { $, toggleClass } from '../utils/dom.js';
import { getStorage, setStorage } from '../utils/helpers.js';
import { initializeParticles } from './particles.js';

// 主题常量
export const Theme = {
    LIGHT: 'light',
    DARK: 'dark'
};

// 存储键
const STORAGE_KEY = 'theme';

// 当前主题
let currentTheme = Theme.LIGHT;

/**
 * 获取系统偏好主题
 * @returns {string}
 */
function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? Theme.DARK 
        : Theme.LIGHT;
}

/**
 * 切换代码高亮主题
 */
function toggleHighlightTheme() {
    try {
        const light = $('#hl-theme-light');
        const dark = $('#hl-theme-dark');
        const isDark = currentTheme === Theme.DARK;
        
        if (light && dark) {
            light.disabled = isDark;
            dark.disabled = !isDark;
        }
    } catch (e) {
        console.error('切换高亮主题失败:', e);
    }
}

/**
 * 应用主题
 * @param {string} theme - 主题名称
 */
export function applyTheme(theme) {
    currentTheme = theme;
    const html = document.documentElement;
    const body = document.body;
    const themeButton = $('#themeToggle');
    
    const isDark = theme === Theme.DARK;
    
    // 切换类名
    toggleClass(html, 'dark-mode', isDark);
    toggleClass(body, 'dark-mode', isDark);
    
    // 更新按钮
    if (themeButton) {
        themeButton.innerHTML = isDark ? '☀️' : '🌙';
        themeButton.title = isDark ? '切换到白天模式' : '切换到夜间模式';
        themeButton.setAttribute('aria-label', themeButton.title);
    }
    
    // 保存主题
    setStorage(STORAGE_KEY, theme);
    
    // 重新初始化粒子动画
    initializeParticles();
    
    // 切换高亮主题
    toggleHighlightTheme();
}

/**
 * 切换主题
 */
export function toggleTheme() {
    const newTheme = currentTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    applyTheme(newTheme);
}

/**
 * 获取当前主题
 * @returns {string}
 */
export function getCurrentTheme() {
    return currentTheme;
}

/**
 * 检查是否为暗色主题
 * @returns {boolean}
 */
export function isDarkMode() {
    return currentTheme === Theme.DARK;
}

/**
 * 初始化主题
 */
export function initializeTheme() {
    // 获取保存的主题或系统偏好
    const savedTheme = getStorage(STORAGE_KEY);
    const initialTheme = savedTheme || getSystemTheme();
    
    // 应用初始主题
    applyTheme(initialTheme);
    
    // 绑定切换按钮
    const themeButton = $('#themeToggle');
    if (themeButton) {
        themeButton.addEventListener('click', toggleTheme);
    }
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getStorage(STORAGE_KEY)) {
            applyTheme(e.matches ? Theme.DARK : Theme.LIGHT);
        }
    });
}

export default {
    init: initializeTheme,
    toggle: toggleTheme,
    apply: applyTheme,
    get: getCurrentTheme,
    isDark: isDarkMode
};

