/**
 * 代理数据库访问模块
 * 当直连 Firebase 失败时，通过 Cloudflare Worker 代理访问
 */

import { PROXY_CONFIG, FIREBASE_CONFIG } from '../config.js';

// 是否使用代理（自动检测）
let useProxy = false;
let proxyChecked = false;

/** 带重试的 fetch（缓解偶发 ERR_CONNECTION_CLOSED） */
async function fetchWithRetry(url, init, retries = 2, delayMs = 400) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetch(url, init);
        } catch (e) {
            lastError = e;
            if (attempt < retries) {
                await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

/**
 * 检测是否需要使用代理
 * 支持强制代理模式和自动检测模式
 * @returns {Promise<boolean>}
 */
export async function checkProxyNeeded() {
    if (proxyChecked) return useProxy;
    
    // 代理功能未启用
    if (!PROXY_CONFIG.enabled) {
        proxyChecked = true;
        useProxy = false;
        console.log('ℹ️ 代理功能未启用，使用直连模式');
        return false;
    }
    
    // 强制使用代理模式（推荐国内用户使用）
    if (PROXY_CONFIG.forceProxy) {
        proxyChecked = true;
        useProxy = true;
        console.log('🔄 已启用强制代理模式');
        
        // 验证代理服务是否可用
        try {
            const proxyResponse = await fetch(`${PROXY_CONFIG.url}/health`);
            if (proxyResponse.ok) {
                console.log('✅ 代理服务正常');
            }
        } catch (e) {
            console.warn('⚠️ 代理服务检测失败，但仍尝试使用:', e.message);
        }
        
        return true;
    }
    
    // 自动检测模式：尝试直连 Firebase
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROXY_CONFIG.timeout);
        
        const response = await fetch(`${FIREBASE_CONFIG.databaseURL}/articles.json?shallow=true&limitToFirst=1`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            await response.json(); // 确保能解析响应
            console.log('✅ Firebase 直连成功，无需代理');
            useProxy = false;
        } else {
            console.log('⚠️ Firebase 直连响应异常，切换到代理模式');
            useProxy = true;
        }
    } catch (error) {
        console.log('⚠️ Firebase 直连失败，切换到代理模式:', error.message);
        useProxy = true;
    }
    
    proxyChecked = true;
    
    // 如果需要代理，验证代理服务
    if (useProxy) {
        try {
            const proxyResponse = await fetch(`${PROXY_CONFIG.url}/health`);
            if (proxyResponse.ok) {
                console.log('✅ 代理服务正常，已启用代理模式');
            }
        } catch (e) {
            console.warn('⚠️ 代理服务检测失败:', e.message);
        }
    }
    
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
 * 构造代理请求 URL。Firebase REST 支持 ?auth=idToken；Worker 会把查询串转发到 Firebase。
 * 仅依赖 Header 时，若线上 Worker 未重新部署则仍会 401，故写入类请求必须带 query。
 * @param {string} path
 * @param {string|null} [idToken]
 */
function buildProxyUrl(path, idToken = null) {
    const base = `${PROXY_CONFIG.url.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
    if (!idToken) {
        return base;
    }
    const u = new URL(base);
    u.searchParams.set('auth', idToken);
    return u.toString();
}

/**
 * 通过代理读取数据
 * @param {string} path - 数据路径
 * @returns {Promise<any>}
 */
export async function proxyGet(path) {
    const url = buildProxyUrl(path);
    
    try {
        const response = await fetchWithRetry(url, {
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
 * @param {string|null} [idToken] - Firebase ID Token（写入 Firebase 规则要求 auth 时必填）
 * @returns {Promise<any>}
 */
export async function proxySet(path, data, idToken = null) {
    const url = buildProxyUrl(path, idToken);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }
        const response = await fetch(url, {
            method: 'PUT',
            headers,
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
 * @param {string|null} [idToken] - Firebase ID Token
 * @returns {Promise<{name: string}>} - 返回包含生成的 key 的对象
 */
export async function proxyPush(path, data, idToken = null) {
    const url = buildProxyUrl(path, idToken);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers,
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
 * @param {string|null} [idToken] - Firebase ID Token
 * @returns {Promise<any>}
 */
export async function proxyDelete(path, idToken = null) {
    const url = buildProxyUrl(path, idToken);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }
        const response = await fetch(url, {
            method: 'DELETE',
            headers
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
 * @param {string|null} [idToken] - Firebase ID Token
 * @returns {Promise<any>}
 */
export async function proxyUpdate(path, data, idToken = null) {
    const url = buildProxyUrl(path, idToken);
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }
        const response = await fetch(url, {
            method: 'PATCH',
            headers,
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

