/**
 * 视觉效果模块
 * 包含打字机效果、鼠标跟随光效、3D卡片效果等
 */

// ==================== 打字机效果 ====================

/**
 * 打字机效果
 * @param {HTMLElement} element - 目标元素
 * @param {string} text - 要显示的文字
 * @param {Object} options - 配置选项
 */
export function typeWriter(element, text, options = {}) {
    const {
        speed = 50,           // 打字速度（毫秒）
        delay = 0,            // 开始延迟
        cursor = true,        // 是否显示光标
        cursorChar = '|',     // 光标字符
        onComplete = null     // 完成回调
    } = options;

    let index = 0;
    element.textContent = '';
    
    if (cursor) {
        element.classList.add('typewriter-cursor');
        element.dataset.cursor = cursorChar;
    }

    const type = () => {
        if (index < text.length) {
            element.textContent = text.slice(0, index + 1);
            index++;
            setTimeout(type, speed);
        } else {
            if (cursor) {
                // 打字完成后光标闪烁几次后消失
                setTimeout(() => {
                    element.classList.remove('typewriter-cursor');
                }, 2000);
            }
            if (onComplete) onComplete();
        }
    };

    setTimeout(type, delay);
}

/**
 * 初始化侧边栏打字机效果
 */
export function initTypewriterBio() {
    const bioElement = document.querySelector('.profile-bio');
    if (!bioElement) return;

    const originalText = bioElement.textContent;
    bioElement.dataset.fullText = originalText;
    
    // 延迟启动，等待页面加载完成
    setTimeout(() => {
        typeWriter(bioElement, originalText, {
            speed: 60,
            delay: 500,
            cursor: true
        });
    }, 300);
}

// ==================== 鼠标跟随光效 ====================

let mouseGlow = null;
let mouseX = 0;
let mouseY = 0;
let glowX = 0;
let glowY = 0;
let animationId = null;
let glowMoveHandler = null;
let glowLeaveHandler = null;
let glowVisibilityHandler = null;
let lastPointerMoveAt = 0;
let glowInitialized = false;

function getEffectsProfile() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData === true;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;

    return {
        reducedMotion,
        saveData,
        lowEndDevice: cores <= 4 || memory <= 4,
        disableContinuousEffects: reducedMotion || saveData || cores <= 4 || memory <= 4
    };
}

/**
 * 创建鼠标跟随光效元素
 */
function createMouseGlow() {
    if (mouseGlow) return;
    
    mouseGlow = document.createElement('div');
    mouseGlow.className = 'mouse-glow';
    document.body.appendChild(mouseGlow);
}

/**
 * 更新光效位置（使用缓动效果）
 */
function updateGlowPosition() {
    if (!mouseGlow) {
        animationId = null;
        return;
    }

    // 缓动系数，越小越平滑
    const ease = 0.18;
    const dx = mouseX - glowX;
    const dy = mouseY - glowY;
    
    glowX += dx * ease;
    glowY += dy * ease;
    
    mouseGlow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
    
    const pointerIsActive = performance.now() - lastPointerMoveAt < 120;
    const stillMoving = Math.abs(dx) > 0.35 || Math.abs(dy) > 0.35;

    if (pointerIsActive || stillMoving) {
        animationId = requestAnimationFrame(updateGlowPosition);
    } else {
        animationId = null;
    }
}

function ensureGlowAnimation() {
    if (!animationId) {
        animationId = requestAnimationFrame(updateGlowPosition);
    }
}

/**
 * 初始化鼠标跟随光效
 */
export function initMouseGlow() {
    const profile = getEffectsProfile();

    // 移动端不启用
    if (window.innerWidth < 768 || profile.disableContinuousEffects) return;
    
    createMouseGlow();

    if (glowMoveHandler) return;

    glowMoveHandler = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        lastPointerMoveAt = performance.now();

        if (!glowInitialized) {
            glowX = mouseX;
            glowY = mouseY;
            glowInitialized = true;
        }

        if (mouseGlow && !mouseGlow.classList.contains('visible')) {
            mouseGlow.classList.add('visible');
        }

        ensureGlowAnimation();
    };

    glowLeaveHandler = () => {
        if (mouseGlow) {
            mouseGlow.classList.remove('visible');
        }
    };

    glowVisibilityHandler = () => {
        if (document.hidden && mouseGlow) {
            mouseGlow.classList.remove('visible');
        }
    };

    document.addEventListener('mousemove', glowMoveHandler, { passive: true });
    document.addEventListener('mouseleave', glowLeaveHandler);
    document.addEventListener('visibilitychange', glowVisibilityHandler);
}

/**
 * 销毁鼠标跟随光效
 */
export function destroyMouseGlow() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (glowMoveHandler) {
        document.removeEventListener('mousemove', glowMoveHandler);
        glowMoveHandler = null;
    }
    if (glowLeaveHandler) {
        document.removeEventListener('mouseleave', glowLeaveHandler);
        glowLeaveHandler = null;
    }
    if (glowVisibilityHandler) {
        document.removeEventListener('visibilitychange', glowVisibilityHandler);
        glowVisibilityHandler = null;
    }
    if (mouseGlow) {
        mouseGlow.remove();
        mouseGlow = null;
    }
    glowInitialized = false;
}

// ==================== 3D 卡片悬浮效果 ====================

/**
 * 初始化 3D 卡片效果
 * @param {string} selector - 卡片选择器
 */
export function init3DCards(selector = '.article-card') {
    const profile = getEffectsProfile();
    if (profile.reducedMotion || profile.saveData) return;

    const cards = document.querySelectorAll(selector);
    
    cards.forEach(card => {
        // 避免重复绑定
        if (card.dataset.has3d) return;
        card.dataset.has3d = 'true';
        
        card.addEventListener('mousemove', handle3DMove);
        card.addEventListener('mouseleave', handle3DLeave);
        card.addEventListener('mouseenter', handle3DEnter);
    });
}

function handle3DMove(e) {
    const card = e.currentTarget;
    if (card._cardAnimationFrame) {
        cancelAnimationFrame(card._cardAnimationFrame);
    }

    card._cardAnimationFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;
        card.style.setProperty('--glare-x', `${glareX}%`);
        card.style.setProperty('--glare-y', `${glareY}%`);
        card._cardAnimationFrame = null;
    });
}

function handle3DLeave(e) {
    const card = e.currentTarget;
    if (card._cardAnimationFrame) {
        cancelAnimationFrame(card._cardAnimationFrame);
        card._cardAnimationFrame = null;
    }
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    card.classList.remove('card-3d-active');
}

function handle3DEnter(e) {
    const card = e.currentTarget;
    card.classList.add('card-3d-active');
}

// ==================== 页面切换动画 ====================

/**
 * 页面切换动画
 * @param {HTMLElement} container - 内容容器
 * @param {Function} renderFn - 渲染函数
 * @param {string} direction - 动画方向 'in' | 'out' | 'left' | 'right'
 */
export async function pageTransition(container, renderFn, direction = 'fade') {
    if (!container) return;
    
    // 添加退出动画
    container.classList.add('page-exit', `page-exit-${direction}`);
    
    // 等待退出动画完成
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 执行渲染
    await renderFn();
    
    // 移除退出类，添加进入类
    container.classList.remove('page-exit', `page-exit-${direction}`);
    container.classList.add('page-enter', `page-enter-${direction}`);
    
    // 清理进入类
    setTimeout(() => {
        container.classList.remove('page-enter', `page-enter-${direction}`);
    }, 300);
}

// ==================== 视差滚动效果 ====================

let parallaxElements = [];
let parallaxAnimationId = null;

/**
 * 初始化视差滚动效果
 */
export function initParallax() {
    // 收集所有视差元素
    parallaxElements = [
        { element: document.querySelector('#particles-js'), speed: 0.3 },
        { element: document.querySelector('.sidebar'), speed: 0.1 },
    ].filter(item => item.element);
    
    if (parallaxElements.length === 0) return;
    
    // 使用 passive 监听器提高性能
    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
}

function updateParallax() {
    const scrollY = window.pageYOffset;
    
    parallaxElements.forEach(({ element, speed }) => {
        const yPos = -(scrollY * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
}

/**
 * 销毁视差效果
 */
export function destroyParallax() {
    window.removeEventListener('scroll', updateParallax);
    parallaxElements.forEach(({ element }) => {
        if (element) element.style.transform = '';
    });
    parallaxElements = [];
}

// ==================== 统一初始化 ====================

/**
 * 初始化所有视觉效果
 */
export function initAllEffects() {
    initTypewriterBio();
    initMouseGlow();
    // 视差滚动效果已禁用（用户反馈不好看）
    // initParallax();
    
    // 3D 卡片效果在文章列表渲染后调用
}

export default {
    typeWriter,
    initTypewriterBio,
    initMouseGlow,
    destroyMouseGlow,
    init3DCards,
    pageTransition,
    initParallax,
    destroyParallax,
    initAllEffects
};

