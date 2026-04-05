/**
 * 粒子动画模块
 * 处理背景粒子效果
 */

import { PARTICLES_CONFIG } from '../config.js';
import { isTouchDevice } from '../utils/helpers.js';

// 视差处理器引用
let particleParallaxHandler = null;
let particleParallaxRaf = null;
let particlesVisibilityHandlerBound = false;

function getParticlesProfile() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    const lowEndDevice = cores <= 4 || memory <= 4;

    return {
        reducedMotion,
        saveData,
        lowEndDevice,
        disableParticles: reducedMotion || saveData,
        particleCount: lowEndDevice ? 32 : 56,
        enableHoverEffects: !lowEndDevice,
        enableRetina: !lowEndDevice && window.devicePixelRatio <= 1.5,
        enableParallax: !lowEndDevice
    };
}

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
 * @param {ReturnType<typeof getParticlesProfile>} profile - 性能档位
 */
function initParallax(canvasEl, profile) {
    if (!canvasEl || !profile.enableParallax) return;
    
    particleParallaxHandler = (e) => {
        if (particleParallaxRaf) {
            cancelAnimationFrame(particleParallaxRaf);
        }
        
        particleParallaxRaf = requestAnimationFrame(() => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const x = (e.clientX - w / 2) / (w / 2); // -1 .. 1
            const y = (e.clientY - h / 2) / (h / 2);
            const tx = x * 5; // px
            const ty = y * 4; // px
            canvasEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
    };
    
    window.addEventListener('mousemove', particleParallaxHandler);
}

function ensureVisibilityHandler() {
    if (particlesVisibilityHandlerBound) return;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cleanupParallax();
            destroyParticles();
            return;
        }

        initializeParticles();
    });

    particlesVisibilityHandlerBound = true;
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

    ensureVisibilityHandler();

    const profile = getParticlesProfile();
    
    // 获取主题颜色
    const { primaryColor, secondaryColor } = getThemeColors();
    
    // 在移动设备或小屏幕上禁用
    if (
        document.hidden ||
        isTouchDevice() ||
        window.innerWidth < PARTICLES_CONFIG.minWidth ||
        profile.disableParticles
    ) {
        return;
    }
    
    // 初始化粒子
    particlesJS('particles-js', {
        particles: {
            number: { 
                value: profile.particleCount, 
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
                value: profile.lowEndDevice ? 0.55 : 0.65,
                random: true,
                anim: {
                    enable: !profile.lowEndDevice,
                    speed: 0.9,
                    opacity_min: 0.1,
                    sync: false
                }
            },
            size: {
                value: profile.lowEndDevice ? 3.2 : 3.8,
                random: true,
                anim: {
                    enable: !profile.lowEndDevice,
                    speed: 1.4,
                    size_min: 0.8,
                    sync: false
                }
            },
            line_linked: {
                enable: true,
                distance: profile.lowEndDevice ? 130 : 150,
                color: primaryColor,
                opacity: profile.lowEndDevice ? 0.16 : 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: profile.lowEndDevice ? 0.55 : 0.75,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: profile.enableHoverEffects, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: {
                grab: { distance: 120, line_linked: { opacity: 0.65 } },
                bubble: { distance: 160, size: 9, duration: 0.6, opacity: 0.9 },
                push: { particles_nb: 2 },
                repulse: { distance: 120, duration: 0.6 }
            }
        },
        retina_detect: profile.enableRetina
    });
    
    // 初始化视差效果
    const canvasEl = document.getElementById('particles-js');
    initParallax(canvasEl, profile);
    
    console.log('粒子动画已初始化');
}

export default {
    init: initializeParticles
};

