/**
 * Markdown 渲染模块
 * 处理 Markdown 解析和增强
 */

import { showImageModal } from './modal.js';

/**
 * 初始化 Markdown 渲染器
 */
export function initMarkdown() {
    try {
        if (window.marked && window.hljs) {
            marked.setOptions({
                highlight: function(code, lang) {
                    try {
                        if (lang && hljs.getLanguage(lang)) {
                            return hljs.highlight(code, { language: lang }).value;
                        }
                        return hljs.highlightAuto(code).value;
                    } catch (e) {
                        return hljs.highlightAuto(code).value;
                    }
                },
                langPrefix: 'hljs language-'
            });
        }
    } catch (e) {
        console.error('Markdown 初始化失败:', e);
    }
}

/**
 * 渲染 Markdown 内容
 * @param {string} content - Markdown 内容
 * @returns {string} - HTML 内容
 */
export function renderMarkdown(content) {
    if (!content) return '';
    
    try {
        const rawHtml = marked.parse(content);
        // 使用 DOMPurify 过滤 XSS
        return window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
    } catch (e) {
        console.error('Markdown 渲染失败:', e);
        return content;
    }
}

/**
 * 增强渲染后的 Markdown 内容
 * @param {HTMLElement} container - 容器元素
 */
export function enhanceRenderedMarkdown(container) {
    if (!container) return;
    
    // 1) 代码高亮
    try {
        if (window.hljs) {
            container.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    } catch (e) {}
    
    // 2) 图片懒加载并绑定 lightbox
    container.querySelectorAll('img').forEach(img => {
        // LQIP 支持
        const src = img.getAttribute('src');
        const lqip = img.getAttribute('data-lqip');
        
        if (lqip) {
            img.style.filter = 'blur(6px)';
            img.style.transition = 'filter 400ms ease, opacity 400ms ease';
            img.src = lqip;
            
            const fullImg = new Image();
            fullImg.onload = () => {
                img.src = src;
                img.style.filter = 'blur(0)';
                img.style.opacity = '1';
            };
            fullImg.src = src;
        }
        
        if (!img.getAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        img.style.cursor = 'zoom-in';
        img.onclick = (e) => {
            e.stopPropagation();
            showImageModal(img.src);
        };
        
        img.style.opacity = img.style.opacity || '1';
    });
    
    // 3) 外部链接在新标签打开
    container.querySelectorAll('a').forEach(a => {
        try {
            const href = a.getAttribute('href') || '';
            if (href.startsWith('http') && !href.includes(location.host)) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        } catch (e) {}
    });
    
    // 4) 代码复制按钮
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.copy-code-btn')) return;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-code-btn';
        btn.setAttribute('aria-label', '复制代码');
        btn.innerHTML = '复制';
        
        btn.onclick = async () => {
            try {
                const code = pre.querySelector('code');
                const text = code ? code.innerText : pre.innerText;
                await navigator.clipboard.writeText(text);
                btn.textContent = '已复制';
                setTimeout(() => btn.textContent = '复制', 1200);
            } catch (e) {
                btn.textContent = '复制失败';
                setTimeout(() => btn.textContent = '复制', 1200);
            }
        };
        
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
    
    // 5) 生成目录 (TOC)
    generateTOC(container);
}

/**
 * 生成文章目录
 * @param {HTMLElement} container - 内容容器
 */
function generateTOC(container) {
    const article = container.closest('.article-page');
    if (!article) return;
    
    let toc = article.querySelector('.article-toc');
    if (toc) return; // 已存在
    
    const headings = container.querySelectorAll('h1,h2,h3');
    if (headings.length <= 1) return;
    
    toc = document.createElement('nav');
    toc.className = 'article-toc';
    
    let html = '<strong>📑 目录</strong><ul>';
    headings.forEach((h, index) => {
        // 生成唯一且稳定的 ID
        const headingId = 'heading-' + index + '-' + h.textContent.replace(/\s+/g, '-').substring(0, 20);
        h.id = headingId;
        const level = parseInt(h.tagName.substring(1), 10);
        html += `<li class="toc-level-${level}"><a href="javascript:void(0)" data-target="${headingId}">${h.textContent}</a></li>`;
    });
    html += '</ul>';
    
    toc.innerHTML = html;
    
    // 绑定点击事件 - 平滑滚动到目标位置
    toc.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = link.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // 计算滚动位置，考虑固定 header 的高度
                const headerHeight = 80;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // 更新当前激活的目录项
                toc.querySelectorAll('a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // 滚动时高亮当前章节
    setupTOCHighlight(toc, headings);
    
    article.insertBefore(toc, article.firstChild);
}

/**
 * 设置目录滚动高亮
 * @param {HTMLElement} toc - 目录元素
 * @param {NodeList} headings - 标题元素列表
 */
function setupTOCHighlight(toc, headings) {
    let ticking = false;
    
    const updateHighlight = () => {
        const headerHeight = 100;
        let currentHeading = null;
        
        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            if (rect.top <= headerHeight + 50) {
                currentHeading = heading;
            }
        });
        
        if (currentHeading) {
            toc.querySelectorAll('a').forEach(a => {
                if (a.getAttribute('data-target') === currentHeading.id) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });
        }
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHighlight();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // 初始高亮
    setTimeout(updateHighlight, 100);
}

export default {
    init: initMarkdown,
    render: renderMarkdown,
    enhance: enhanceRenderedMarkdown
};

