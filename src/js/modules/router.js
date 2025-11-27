/**
 * 路由模块
 * 处理 SPA 路由
 */

import { $ } from '../utils/dom.js';
import { disconnectScrollAnimations } from './scroll.js';

// 路由处理函数映射
const routes = {};

// 默认路由
let defaultRoute = 'home';

/**
 * 注册路由
 * @param {string} name - 路由名称
 * @param {Function} handler - 路由处理函数
 */
export function registerRoute(name, handler) {
    routes[name] = handler;
}

/**
 * 设置默认路由
 * @param {string} name - 路由名称
 */
export function setDefaultRoute(name) {
    defaultRoute = name;
}

/**
 * 解析当前 hash
 * @returns {{ route: string, param: string|null }}
 */
export function parseHash() {
    const hash = window.location.hash || `#${defaultRoute}`;
    
    // 匹配 #route/param 格式
    const match = hash.match(/^#([^/]+)(?:\/(.+))?$/);
    
    if (match) {
        return {
            route: match[1],
            param: match[2] || null
        };
    }
    
    return {
        route: defaultRoute,
        param: null
    };
}

/**
 * 导航到指定路由
 * @param {string} route - 路由名称
 * @param {string} param - 路由参数（可选）
 */
export function navigate(route, param = null) {
    const hash = param ? `#${route}/${param}` : `#${route}`;
    window.location.hash = hash;
}

/**
 * 处理路由变化
 */
export function handleRoute() {
    const content = $('#content');
    if (!content) return;
    
    // 断开滚动动画
    disconnectScrollAnimations();
    
    // 显示加载状态
    content.innerHTML = '<p style="text-align:center; padding: 50px; color: #888;">加载中...</p>';
    
    // 解析路由
    const { route, param } = parseHash();
    
    // 查找处理函数
    const handler = routes[route];
    
    if (handler) {
        handler(param);
    } else if (routes[defaultRoute]) {
        routes[defaultRoute]();
    } else {
        content.innerHTML = '<p style="text-align:center; padding: 50px; color: #888;">页面不存在</p>';
    }
}

/**
 * 初始化路由
 */
export function initRouter() {
    // 监听 hash 变化
    window.addEventListener('hashchange', handleRoute);
    
    // 处理初始路由
    handleRoute();
}

export default {
    register: registerRoute,
    setDefault: setDefaultRoute,
    parse: parseHash,
    navigate,
    handle: handleRoute,
    init: initRouter
};

