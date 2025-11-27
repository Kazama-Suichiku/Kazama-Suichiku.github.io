/**
 * Cloudflare Worker - Firebase 代理
 * 用于解决国内无法访问 Firebase 的问题
 */

// Firebase 数据库 URL
const FIREBASE_URL = 'https://my-blog-fa883-default-rtdb.asia-southeast1.firebasedatabase.app';

// 允许的源（你的博客域名）
const ALLOWED_ORIGINS = [
    'https://kazama-suichiku.github.io',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000'
];

/**
 * 处理 CORS 预检请求
 */
function handleOptions(request) {
    const origin = request.headers.get('Origin');
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }
    });
}

/**
 * 添加 CORS 头
 */
function addCorsHeaders(response, origin) {
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

/**
 * 主请求处理
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
        return handleOptions(request);
    }
    
    // 健康检查
    if (url.pathname === '/' || url.pathname === '/health') {
        return new Response(JSON.stringify({ 
            status: 'ok', 
            message: 'Firebase Proxy is running',
            timestamp: new Date().toISOString()
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
    
    // 构建 Firebase URL
    // 请求路径: /articles.json -> Firebase: /articles.json
    let firebasePath = url.pathname;
    
    // 确保路径以 .json 结尾（Firebase REST API 要求）
    if (!firebasePath.endsWith('.json')) {
        firebasePath += '.json';
    }
    
    const firebaseUrl = `${FIREBASE_URL}${firebasePath}${url.search}`;
    
    // 构建请求
    const requestInit = {
        method: request.method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    // 如果有请求体，转发它
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            const body = await request.text();
            if (body) {
                requestInit.body = body;
            }
        } catch (e) {
            // 忽略空请求体
        }
    }
    
    try {
        // 转发请求到 Firebase
        const response = await fetch(firebaseUrl, requestInit);
        
        // 添加 CORS 头并返回
        return addCorsHeaders(response, origin);
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Proxy error', 
            message: error.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// 导出 Worker
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request);
    }
};

