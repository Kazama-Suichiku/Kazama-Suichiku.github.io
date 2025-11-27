/**
 * DOM 操作工具函数
 */

/**
 * 安全获取 DOM 元素
 * @param {string} selector - CSS 选择器
 * @returns {Element|null}
 */
export function $(selector) {
    return document.querySelector(selector);
}

/**
 * 获取所有匹配的 DOM 元素
 * @param {string} selector - CSS 选择器
 * @returns {NodeList}
 */
export function $$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * 创建 DOM 元素
 * @param {string} tag - 标签名
 * @param {Object} attrs - 属性对象
 * @param {string|Element|Array} children - 子元素
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                el.dataset[dataKey] = dataValue;
            });
        } else {
            el.setAttribute(key, value);
        }
    });
    
    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    el.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            el.innerHTML = children;
        } else if (children instanceof Element) {
            el.appendChild(children);
        }
    }
    
    return el;
}

/**
 * 安全设置 innerHTML
 * @param {Element} el - 目标元素
 * @param {string} html - HTML 内容
 */
export function setHTML(el, html) {
    if (el) {
        el.innerHTML = html;
    }
}

/**
 * 添加事件监听器（支持事件委托）
 * @param {Element|string} target - 目标元素或选择器
 * @param {string} event - 事件类型
 * @param {Function} handler - 事件处理函数
 * @param {string} delegateSelector - 委托选择器（可选）
 */
export function on(target, event, handler, delegateSelector = null) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    
    if (delegateSelector) {
        el.addEventListener(event, (e) => {
            const delegateTarget = e.target.closest(delegateSelector);
            if (delegateTarget && el.contains(delegateTarget)) {
                handler.call(delegateTarget, e, delegateTarget);
            }
        });
    } else {
        el.addEventListener(event, handler);
    }
}

/**
 * 移除元素
 * @param {Element|string} target - 目标元素或选择器
 */
export function remove(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
}

/**
 * 切换类名
 * @param {Element} el - 目标元素
 * @param {string} className - 类名
 * @param {boolean} force - 强制添加或移除
 */
export function toggleClass(el, className, force) {
    if (el) {
        el.classList.toggle(className, force);
    }
}

/**
 * 显示/隐藏元素
 * @param {Element} el - 目标元素
 * @param {boolean} show - 是否显示
 */
export function setVisible(el, show) {
    if (el) {
        el.style.display = show ? '' : 'none';
    }
}

