/**
 * 速率限制器模块
 * 防止恶意刷评论等操作
 */

import { getStorage, setStorage } from './helpers.js';

// 默认配置
const DEFAULT_CONFIG = {
    maxRequests: 5,      // 最大请求数
    windowMs: 60000,     // 时间窗口（毫秒）
    blockDuration: 300000 // 封禁时长（毫秒）
};

// 存储键前缀
const STORAGE_PREFIX = 'rate_limit_';

/**
 * 速率限制器类
 */
class RateLimiter {
    constructor(name, config = {}) {
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.storageKey = STORAGE_PREFIX + name;
    }
    
    /**
     * 获取当前状态
     * @returns {Object}
     */
    getState() {
        const state = getStorage(this.storageKey, {
            requests: [],
            blockedUntil: null
        });
        return state;
    }
    
    /**
     * 保存状态
     * @param {Object} state
     */
    saveState(state) {
        setStorage(this.storageKey, state);
    }
    
    /**
     * 清理过期的请求记录
     * @param {Array} requests
     * @returns {Array}
     */
    cleanExpiredRequests(requests) {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        return requests.filter(timestamp => timestamp > windowStart);
    }
    
    /**
     * 检查是否被封禁
     * @returns {boolean}
     */
    isBlocked() {
        const state = this.getState();
        if (state.blockedUntil && Date.now() < state.blockedUntil) {
            return true;
        }
        return false;
    }
    
    /**
     * 获取剩余封禁时间（秒）
     * @returns {number}
     */
    getBlockedTimeRemaining() {
        const state = this.getState();
        if (state.blockedUntil) {
            const remaining = Math.ceil((state.blockedUntil - Date.now()) / 1000);
            return Math.max(0, remaining);
        }
        return 0;
    }
    
    /**
     * 检查是否可以执行操作
     * @returns {{ allowed: boolean, message?: string, retryAfter?: number }}
     */
    check() {
        const state = this.getState();
        const now = Date.now();
        
        // 检查是否被封禁
        if (state.blockedUntil && now < state.blockedUntil) {
            const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
            return {
                allowed: false,
                message: `操作过于频繁，请 ${retryAfter} 秒后再试`,
                retryAfter
            };
        }
        
        // 清理过期记录
        const validRequests = this.cleanExpiredRequests(state.requests);
        
        // 检查是否超过限制
        if (validRequests.length >= this.config.maxRequests) {
            // 封禁用户
            state.blockedUntil = now + this.config.blockDuration;
            state.requests = validRequests;
            this.saveState(state);
            
            const retryAfter = Math.ceil(this.config.blockDuration / 1000);
            return {
                allowed: false,
                message: `操作过于频繁，请 ${retryAfter} 秒后再试`,
                retryAfter
            };
        }
        
        return { allowed: true };
    }
    
    /**
     * 记录一次请求
     */
    record() {
        const state = this.getState();
        const validRequests = this.cleanExpiredRequests(state.requests);
        validRequests.push(Date.now());
        state.requests = validRequests;
        this.saveState(state);
    }
    
    /**
     * 尝试执行操作
     * @returns {{ allowed: boolean, message?: string }}
     */
    tryAcquire() {
        const result = this.check();
        if (result.allowed) {
            this.record();
        }
        return result;
    }
    
    /**
     * 重置限制器
     */
    reset() {
        this.saveState({
            requests: [],
            blockedUntil: null
        });
    }
}

// 预定义的限制器
const limiters = {
    // 评论限制：每分钟最多 3 条
    comment: new RateLimiter('comment', {
        maxRequests: 3,
        windowMs: 60000,
        blockDuration: 300000 // 5分钟
    }),
    
    // 登录限制：每分钟最多 5 次
    login: new RateLimiter('login', {
        maxRequests: 5,
        windowMs: 60000,
        blockDuration: 600000 // 10分钟
    }),
    
    // 文章发布限制：每小时最多 10 篇
    article: new RateLimiter('article', {
        maxRequests: 10,
        windowMs: 3600000,
        blockDuration: 1800000 // 30分钟
    }),
    
    // 图片上传限制：每分钟最多 20 张
    upload: new RateLimiter('upload', {
        maxRequests: 20,
        windowMs: 60000,
        blockDuration: 300000 // 5分钟
    })
};

/**
 * 获取限制器
 * @param {string} name - 限制器名称
 * @returns {RateLimiter}
 */
export function getLimiter(name) {
    return limiters[name] || new RateLimiter(name);
}

/**
 * 创建自定义限制器
 * @param {string} name - 名称
 * @param {Object} config - 配置
 * @returns {RateLimiter}
 */
export function createLimiter(name, config) {
    return new RateLimiter(name, config);
}

/**
 * 带速率限制的函数包装器
 * @param {string} limiterName - 限制器名称
 * @param {Function} fn - 要执行的函数
 * @param {Function} onBlocked - 被阻止时的回调
 * @returns {Function}
 */
export function withRateLimit(limiterName, fn, onBlocked = null) {
    const limiter = getLimiter(limiterName);
    
    return async function (...args) {
        const result = limiter.tryAcquire();
        
        if (!result.allowed) {
            if (onBlocked) {
                onBlocked(result);
            }
            throw new Error(result.message);
        }
        
        return await fn.apply(this, args);
    };
}

export { RateLimiter };

export default {
    getLimiter,
    createLimiter,
    withRateLimit,
    limiters
};

