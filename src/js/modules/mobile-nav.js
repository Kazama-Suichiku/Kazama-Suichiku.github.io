/**
 * 移动端导航模块
 */

import { $, $$, createElement, toggleClass, on } from '../utils/dom.js';

// 状态
let isMenuOpen = false;
let hamburgerBtn = null;
let mobileMenu = null;
let overlay = null;

/**
 * 创建汉堡菜单按钮
 */
function createHamburgerButton() {
    if ($('#hamburgerBtn')) return;
    
    hamburgerBtn = createElement('button', {
        id: 'hamburgerBtn',
        className: 'hamburger-btn',
        'aria-label': '打开菜单',
        'aria-expanded': 'false'
    }, `
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
    `);
    
    // 插入到导航栏
    const nav = $('header nav');
    if (nav) {
        nav.appendChild(hamburgerBtn);
    }
}

/**
 * 创建移动端菜单
 */
function createMobileMenu() {
    if ($('#mobileMenu')) return;
    
    // 获取原有导航链接
    const navLinks = $$('header nav ul li a');
    const linksHTML = Array.from(navLinks).map(link => {
        if (link.closest('.theme-toggle-button') || link.id === 'themeToggle') return '';
        return `<a href="${link.getAttribute('href')}" class="mobile-nav-link">${link.textContent}</a>`;
    }).filter(Boolean).join('');
    
    mobileMenu = createElement('div', {
        id: 'mobileMenu',
        className: 'mobile-menu'
    }, `
        <div class="mobile-menu-header">
            <span class="mobile-menu-title">🎋 翠竹的博客</span>
            <button class="mobile-menu-close" aria-label="关闭菜单">×</button>
        </div>
        <nav class="mobile-nav">
            ${linksHTML}
        </nav>
        <div class="mobile-menu-footer">
            <button id="mobileThemeToggle" class="mobile-theme-toggle">
                <span class="theme-icon">🌙</span>
                <span class="theme-text">切换主题</span>
            </button>
        </div>
    `);
    
    document.body.appendChild(mobileMenu);
}

/**
 * 创建遮罩层
 */
function createOverlay() {
    if ($('#menuOverlay')) return;
    
    overlay = createElement('div', {
        id: 'menuOverlay',
        className: 'menu-overlay'
    });
    
    document.body.appendChild(overlay);
}

/**
 * 打开菜单
 */
export function openMenu() {
    isMenuOpen = true;
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
    
    if (mobileMenu) {
        mobileMenu.classList.add('open');
    }
    
    if (overlay) {
        overlay.classList.add('visible');
    }
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭菜单
 */
export function closeMenu() {
    isMenuOpen = false;
    
    if (hamburgerBtn) {
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    
    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
    
    if (overlay) {
        overlay.classList.remove('visible');
    }
    
    // 恢复背景滚动
    document.body.style.overflow = '';
}

/**
 * 切换菜单
 */
export function toggleMenu() {
    if (isMenuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

/**
 * 更新主题按钮状态
 */
export function updateThemeButton() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const mobileThemeBtn = $('#mobileThemeToggle');
    
    if (mobileThemeBtn) {
        const icon = mobileThemeBtn.querySelector('.theme-icon');
        const text = mobileThemeBtn.querySelector('.theme-text');
        
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        if (text) text.textContent = isDark ? '切换到白天' : '切换到夜间';
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 汉堡按钮点击
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMenu);
    }
    
    // 关闭按钮
    const closeBtn = $('.mobile-menu-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }
    
    // 遮罩层点击
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }
    
    // 导航链接点击后关闭菜单
    const navLinks = $$('.mobile-nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
    
    // 主题切换按钮
    const mobileThemeBtn = $('#mobileThemeToggle');
    if (mobileThemeBtn) {
        mobileThemeBtn.addEventListener('click', () => {
            // 触发原有的主题切换
            const themeBtn = $('#themeToggle');
            if (themeBtn) {
                themeBtn.click();
            }
            updateThemeButton();
        });
    }
    
    // ESC 关闭菜单
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
    
    // 窗口大小变化时关闭菜单
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMenu();
        }
    });
}

/**
 * 初始化移动端导航
 */
export function initMobileNav() {
    // 只在移动端初始化
    createHamburgerButton();
    createMobileMenu();
    createOverlay();
    bindEvents();
    updateThemeButton();
    
    // 监听主题变化
    const observer = new MutationObserver(() => {
        updateThemeButton();
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
}

/**
 * 检查是否为移动端
 * @returns {boolean}
 */
export function isMobile() {
    return window.innerWidth <= 768;
}

export default {
    init: initMobileNav,
    open: openMenu,
    close: closeMenu,
    toggle: toggleMenu,
    isMobile
};

