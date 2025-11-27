/**
 * 统一错误处理模块
 */

import notify from '../modules/notification.js';

// 错误类型
export const ErrorType = {
    NETWORK: 'network',
    AUTH: 'auth',
    VALIDATION: 'validation',
    STORAGE: 'storage',
    UNKNOWN: 'unknown'
};

// 错误消息映射
const ERROR_MESSAGES = {
    'auth/user-not-found': '用户不存在',
    'auth/wrong-password': '密码错误',
    'auth/email-already-in-use': '邮箱已被注册',
    'auth/weak-password': '密码强度不足，至少需要6位',
    'auth/invalid-email': '邮箱格式不正确',
    'auth/too-many-requests': '请求过于频繁，请稍后再试',
    'auth/network-request-failed': '网络连接失败',
    'storage/unauthorized': '没有权限上传文件',
    'storage/canceled': '上传已取消',
    'storage/unknown': '存储服务出错',
    'permission-denied': '没有操作权限',
    'unavailable': '服务暂时不可用',
    'network-error': '网络连接失败，请检查网络'
};

/**
 * 解析错误消息
 * @param {Error|string} error - 错误对象或消息
 * @returns {string}
 */
export function parseErrorMessage(error) {
    if (!error) return '未知错误';
    
    // 字符串错误
    if (typeof error === 'string') {
        return error;
    }
    
    // Firebase 错误
    if (error.code && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }
    
    // 自定义消息
    if (error.message) {
        // 检查是否是已知错误消息
        for (const [code, msg] of Object.entries(ERROR_MESSAGES)) {
            if (error.message.includes(code)) {
                return msg;
            }
        }
        return error.message;
    }
    
    return '操作失败，请重试';
}

/**
 * 判断错误类型
 * @param {Error} error - 错误对象
 * @returns {string}
 */
export function getErrorType(error) {
    if (!error) return ErrorType.UNKNOWN;
    
    const code = error.code || '';
    const message = error.message || '';
    
    if (code.startsWith('auth/')) {
        return ErrorType.AUTH;
    }
    
    if (code.startsWith('storage/')) {
        return ErrorType.STORAGE;
    }
    
    if (code === 'permission-denied' || message.includes('permission')) {
        return ErrorType.AUTH;
    }
    
    if (code === 'unavailable' || message.includes('network') || message.includes('Network')) {
        return ErrorType.NETWORK;
    }
    
    return ErrorType.UNKNOWN;
}

/**
 * 安全执行异步函数
 * @param {Function} fn - 要执行的异步函数
 * @param {Object} options - 选项
 * @returns {Promise<any>}
 */
export async function safeAsync(fn, options = {}) {
    const {
        fallback = null,
        showError = true,
        errorMessage = null,
        onError = null,
        retries = 0,
        retryDelay = 1000
    } = options;
    
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.error(`操作失败 (尝试 ${attempt + 1}/${retries + 1}):`, error);
            
            // 如果还有重试机会，等待后重试
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
        }
    }
    
    // 所有重试都失败了
    if (showError) {
        const message = errorMessage || parseErrorMessage(lastError);
        notify.error(message);
    }
    
    if (onError) {
        onError(lastError);
    }
    
    return fallback;
}

/**
 * 创建带超时的 Promise
 * @param {Promise} promise - 原始 Promise
 * @param {number} timeout - 超时时间（毫秒）
 * @param {string} timeoutMessage - 超时消息
 * @returns {Promise}
 */
export function withTimeout(promise, timeout = 10000, timeoutMessage = '操作超时') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(timeoutMessage)), timeout);
        })
    ]);
}

/**
 * 全局错误处理器
 */
export function setupGlobalErrorHandler() {
    // 未捕获的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的 Promise 错误:', event.reason);
        
        // 不显示某些已知的无害错误
        const message = event.reason?.message || '';
        if (message.includes('ResizeObserver') || message.includes('Script error')) {
            return;
        }
        
        // 显示友好的错误提示
        const errorType = getErrorType(event.reason);
        if (errorType === ErrorType.NETWORK) {
            notify.error('网络连接失败，请检查网络');
        }
    });
    
    // 全局 JS 错误
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
        // 大多数情况下不需要显示给用户
    });
}

/**
 * 验证函数 - 创建验证器
 * @param {Object} rules - 验证规则
 * @returns {Function}
 */
export function createValidator(rules) {
    return (data) => {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            
            // 必填检查
            if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
                errors[field] = rule.message || `${field} 不能为空`;
                continue;
            }
            
            // 跳过空值的其他检查
            if (!value) continue;
            
            // 最小长度
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = rule.message || `${field} 至少需要 ${rule.minLength} 个字符`;
            }
            
            // 最大长度
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = rule.message || `${field} 不能超过 ${rule.maxLength} 个字符`;
            }
            
            // 正则匹配
            if (rule.pattern && !rule.pattern.test(value)) {
                errors[field] = rule.message || `${field} 格式不正确`;
            }
            
            // 自定义验证
            if (rule.validate && !rule.validate(value)) {
                errors[field] = rule.message || `${field} 验证失败`;
            }
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    };
}

export default {
    parse: parseErrorMessage,
    getType: getErrorType,
    safeAsync,
    withTimeout,
    setupGlobalErrorHandler,
    createValidator
};

