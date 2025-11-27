/**
 * 阅读模式模块
 * 提供纯净的阅读体验，隐藏所有干扰元素
 */

let isReadingMode = false;
let readingModeButton = null;

/**
 * 创建阅读模式按钮
 */
function createReadingModeButton() {
    if (readingModeButton) return;
    
    readingModeButton = document.createElement('button');
    readingModeButton.className = 'reading-mode-toggle';
    readingModeButton.innerHTML = '<i class="fas fa-book-reader"></i>';
    readingModeButton.title = '进入阅读模式';
    readingModeButton.setAttribute('aria-label', '切换阅读模式');
    
    readingModeButton.addEventListener('click', toggleReadingMode);
    
    document.body.appendChild(readingModeButton);
}

/**
 * 切换阅读模式
 */
export function toggleReadingMode() {
    isReadingMode = !isReadingMode;
    
    if (isReadingMode) {
        enterReadingMode();
    } else {
        exitReadingMode();
    }
}

/**
 * 进入阅读模式
 */
function enterReadingMode() {
    document.body.classList.add('reading-mode');
    
    if (readingModeButton) {
        readingModeButton.innerHTML = '<i class="fas fa-times"></i>';
        readingModeButton.title = '退出阅读模式';
    }
    
    // 添加 ESC 键退出
    document.addEventListener('keydown', handleEscKey);
    
    // 滚动到文章顶部
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
        articleContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * 退出阅读模式
 */
function exitReadingMode() {
    document.body.classList.remove('reading-mode');
    
    if (readingModeButton) {
        readingModeButton.innerHTML = '<i class="fas fa-book-reader"></i>';
        readingModeButton.title = '进入阅读模式';
    }
    
    document.removeEventListener('keydown', handleEscKey);
}

/**
 * ESC 键处理
 */
function handleEscKey(e) {
    if (e.key === 'Escape' && isReadingMode) {
        exitReadingMode();
        isReadingMode = false;
    }
}

/**
 * 显示阅读模式按钮（仅在文章页显示）
 */
export function showReadingModeButton() {
    if (!readingModeButton) {
        createReadingModeButton();
    }
    readingModeButton.classList.add('visible');
}

/**
 * 隐藏阅读模式按钮
 */
export function hideReadingModeButton() {
    if (readingModeButton) {
        readingModeButton.classList.remove('visible');
    }
    // 如果在阅读模式中，退出
    if (isReadingMode) {
        exitReadingMode();
        isReadingMode = false;
    }
}

/**
 * 初始化阅读模式
 */
export function initReadingMode() {
    createReadingModeButton();
}

/**
 * 获取当前阅读模式状态
 */
export function isInReadingMode() {
    return isReadingMode;
}

export default {
    init: initReadingMode,
    toggle: toggleReadingMode,
    show: showReadingModeButton,
    hide: hideReadingModeButton,
    isActive: isInReadingMode
};

