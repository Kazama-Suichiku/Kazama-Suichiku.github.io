/**
 * 粒子动画模块
 * 处理背景粒子效果
 */

import { PARTICLES_CONFIG } from '../config.js';
import { isTouchDevice } from '../utils/helpers.js';

// 视差处理器引用
let particleParallaxHandler = null;
let particleParallaxRaf = null;

/**
 * 获取当前主题颜色
 * @returns {{ primaryColor: string, secondaryColor: string }}
 */
function getThemeColors() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    return isDark ? PARTICLES_CONFIG.dark : PARTICLES_CONFIG.light;
}

/**
 * 销毁现有粒子实例
 */
function destroyParticles() {
    if (window.pJSDom && window.pJSDom.length) {
        window.pJSDom.forEach(p => {
            try {
                p.pJS.fn.vendors.destroypJS();
            } catch (e) {}
        });
        window.pJSDom = [];
    }
}

/**
 * 清理视差处理器
 */
function cleanupParallax() {
    if (particleParallaxHandler) {
        window.removeEventListener('mousemove', particleParallaxHandler);
        particleParallaxHandler = null;
    }
    if (particleParallaxRaf) {
        cancelAnimationFrame(particleParallaxRaf);
        particleParallaxRaf = null;
    }
}

/**
 * 初始化视差效果
 * @param {HTMLElement} canvasEl - 粒子容器元素
 */
function initParallax(canvasEl) {
    if (!canvasEl) return;
    
    particleParallaxHandler = (e) => {
        if (particleParallaxRaf) {
            cancelAnimationFrame(particleParallaxRaf);
        }
        
        particleParallaxRaf = requestAnimationFrame(() => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const x = (e.clientX - w / 2) / (w / 2); // -1 .. 1
            const y = (e.clientY - h / 2) / (h / 2);
            const tx = x * 8; // px
            const ty = y * 6; // px
            canvasEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
    };
    
    window.addEventListener('mousemove', particleParallaxHandler);
}

/**
 * 初始化粒子动画
 */
export function initializeParticles() {
    // 检查 particles.js 是否加载
    if (!window.particlesJS) {
        console.error('particles.js 未加载');
        return;
    }
    
    // 销毁现有实例
    destroyParticles();
    
    // 清理视差处理器
    cleanupParallax();
    
    // 获取主题颜色
    const { primaryColor, secondaryColor } = getThemeColors();
    
    // 在移动设备或小屏幕上禁用
    if (isTouchDevice() || window.innerWidth < PARTICLES_CONFIG.minWidth) {
        return;
    }
    
    // 初始化粒子
    particlesJS('particles-js', {
        particles: {
            number: { 
                value: 80, 
                density: { enable: true, value_area: 800 } 
            },
            color: { 
                value: [primaryColor, secondaryColor, '#ffffff'] 
            },
            shape: { 
                type: 'circle', 
                stroke: { width: 0.5, color: 'rgba(255,255,255,0.08)' } 
            },
            opacity: {
                value: 0.7,
                random: true,
                anim: { enable: true, speed: 1.2, opacity_min: 0.08, sync: false }
            },
            size: {
                value: 4,
                random: true,
                anim: { enable: true, speed: 2, size_min: 0.5, sync: false }
            },
            line_linked: {
                enable: true,
                distance: 160,
                color: primaryColor,
                opacity: 0.22,
                width: 1
            },
            move: {
                enable: true,
                speed: 0.9,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'window',
            events: {
                onhover: { enable: true, mode: ['grab', 'bubble'] },
                onclick: { enable: true, mode: ['push', 'bubble'] },
                resize: true
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 0.85 } },
                bubble: { distance: 180, size: 12, duration: 0.8, opacity: 0.95 },
                push: { particles_nb: 4 },
                repulse: { distance: 120, duration: 0.6 }
            }
        },
        retina_detect: true
    });
    
    // 初始化视差效果
    const canvasEl = document.getElementById('particles-js');
    initParallax(canvasEl);
    
    console.log('粒子动画已初始化');
}

export default {
    init: initializeParticles
};

