/**
 * 通知模块
 * 处理全局通知提示
 */

import { $, createElement, remove } from '../utils/dom.js';

// 通知类型
export const NotificationType = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR: 'error'
};

// 默认显示时间（毫秒）
const DEFAULT_DURATION = 3500;

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型
 * @param {number} duration - 显示时间
 */
export function showNotification(message, type = NotificationType.INFO, duration = DEFAULT_DURATION) {
    // 移除已存在的通知
    const existing = $('.notification');
    if (existing) {
        remove(existing);
    }
    
    // 创建通知元素
    const notification = createElement('div', {
        className: `notification ${type}`,
        onClick: () => remove(notification)
    }, message);
    
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        if (document.body.contains(notification)) {
            remove(notification);
        }
    }, duration);
}

// 便捷方法
export const notify = {
    info: (message, duration) => showNotification(message, NotificationType.INFO, duration),
    success: (message, duration) => showNotification(message, NotificationType.SUCCESS, duration),
    error: (message, duration) => showNotification(message, NotificationType.ERROR, duration)
};

export default notify;

