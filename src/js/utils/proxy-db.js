/**
 * 代理数据库访问模块
 * 当直连 Firebase 失败时，通过 Cloudflare Worker 代理访问
 */

import { PROXY_CONFIG, FIREBASE_CONFIG } from '../config.js';

// 是否使用代理（自动检测）
let useProxy = false;
let proxyChecked = false;

/**
 * 检测是否需要使用代理
 * @returns {Promise<boolean>}
 */
export async function checkProxyNeeded() {
    if (proxyChecked) return useProxy;
    
    if (!PROXY_CONFIG.enabled) {
        proxyChecked = true;
        useProxy = false;
        return false;
    }
    
    try {
        // 尝试直连 Firebase
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROXY_CONFIG.timeout);
        
        const response = await fetch(`${FIREBASE_CONFIG.databaseURL}/.json?shallow=true`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('✅ Firebase 直连成功，无需代理');
            useProxy = false;
        } else {
            console.log('⚠️ Firebase 直连失败，切换到代理模式');
            useProxy = true;
        }
    } catch (error) {
        console.log('⚠️ Firebase 直连超时或失败，切换到代理模式:', error.message);
        useProxy = true;
    }
    
    proxyChecked = true;
    return useProxy;
}

/**
 * 强制使用代理
 */
export function forceUseProxy() {
    useProxy = true;
    proxyChecked = true;
}

/**
 * 获取是否正在使用代理
 * @returns {boolean}
 */
export function isUsingProxy() {
    return useProxy;
}

/**
 * 通过代理读取数据
 * @param {string} path - 数据路径
 * @returns {Promise<any>}
 */
export async function proxyGet(path) {
    const url = `${PROXY_CONFIG.url}/${path}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('代理读取失败:', error);
        throw error;
    }
}

/**
 * 通过代理写入数据
 * @param {string} path - 数据路径
 * @param {any} data - 数据
 * @returns {Promise<any>}
 */
export async function proxySet(path, data) {
    const url = `${PROXY_CONFIG.url}/${path}`;
    
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('代理写入失败:', error);
        throw error;
    }
}

/**
 * 通过代理推送数据（自动生成 key）
 * @param {string} path - 数据路径
 * @param {any} data - 数据
 * @returns {Promise<{name: string}>} - 返回包含生成的 key 的对象
 */
export async function proxyPush(path, data) {
    const url = `${PROXY_CONFIG.url}/${path}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('代理推送失败:', error);
        throw error;
    }
}

/**
 * 通过代理删除数据
 * @param {string} path - 数据路径
 * @returns {Promise<any>}
 */
export async function proxyDelete(path) {
    const url = `${PROXY_CONFIG.url}/${path}`;
    
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('代理删除失败:', error);
        throw error;
    }
}

/**
 * 通过代理更新数据（PATCH）
 * @param {string} path - 数据路径
 * @param {any} data - 要更新的数据
 * @returns {Promise<any>}
 */
export async function proxyUpdate(path, data) {
    const url = `${PROXY_CONFIG.url}/${path}`;
    
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('代理更新失败:', error);
        throw error;
    }
}

export default {
    checkProxyNeeded,
    forceUseProxy,
    isUsingProxy,
    get: proxyGet,
    set: proxySet,
    push: proxyPush,
    delete: proxyDelete,
    update: proxyUpdate
};

