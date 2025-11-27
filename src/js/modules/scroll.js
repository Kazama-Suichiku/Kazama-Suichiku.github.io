/**
 * 滚动相关模块
 * 处理滚动动画和返回顶部
 */

import { $, $$ } from '../utils/dom.js';
import { scrollTo } from '../utils/helpers.js';

// IntersectionObserver 实例
let intersectionObserver = null;

/**
 * 初始化滚动动画
 */
export function initScrollAnimations() {
    // 先断开之前的观察器
    disconnectScrollAnimations();
    
    const elements = $$('.animate-on-scroll');
    if (!elements.length) return;
    
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);
    
    elements.forEach(el => intersectionObserver.observe(el));
}

/**
 * 断开滚动动画观察器
 */
export function disconnectScrollAnimations() {
    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
    }
}

/**
 * 初始化返回顶部按钮
 */
export function initBackToTop() {
    const button = $('.back-to-top');
    if (!button) return;
    
    const toggleButton = () => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    };
    
    window.addEventListener('scroll', toggleButton);
    
    button.onclick = () => {
        scrollTo(0, 'smooth');
    };
}

export default {
    initAnimations: initScrollAnimations,
    disconnectAnimations: disconnectScrollAnimations,
    initBackToTop
};

