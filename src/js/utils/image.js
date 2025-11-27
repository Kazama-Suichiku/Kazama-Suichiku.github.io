/**
 * 图片处理工具函数
 */

import { IMAGE_CONFIG } from '../config.js';

/**
 * 压缩图片
 * @param {File} file - 图片文件
 * @param {boolean} isAvatar - 是否为头像
 * @returns {Promise<string>} - Base64 字符串
 */
export function compressImage(file, isAvatar = true) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type) {
            return reject(new Error('无效文件'));
        }
        
        if (!IMAGE_CONFIG.supportedTypes.includes(file.type)) {
            return reject(new Error('仅支持JPG/PNG'));
        }
        
        const config = isAvatar ? IMAGE_CONFIG.avatar : IMAGE_CONFIG.article;
        const limitMB = config.maxSize / (1024 * 1024);
        
        if (file.size > config.maxSize) {
            return reject(new Error(`${isAvatar ? '头像' : '文章'}图片需小于${limitMB}MB`));
        }
        
        const mimeType = file.type;
        const maxSizePx = config.maxDimension;
        const quality = mimeType === 'image/jpeg' ? config.quality : undefined;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result) {
                return reject(new Error('无法读取文件'));
            }
            
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                
                if (width > maxSizePx || height > maxSizePx) {
                    const ratio = width / height;
                    if (width > height) {
                        width = maxSizePx;
                        height = Math.round(width / ratio);
                    } else {
                        height = maxSizePx;
                        width = Math.round(height * ratio);
                    }
                }
                
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('无法获取Canvas上下文'));
                }
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    if (!dataUrl || dataUrl === 'data:,') {
                        throw new Error('Data URL为空');
                    }
                    resolve(dataUrl);
                } catch (err) {
                    reject(new Error(`压缩失败: ${err.message}`));
                }
            };
            img.onerror = () => reject(new Error('图片加载失败'));
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
    });
}

/**
 * 验证图片文件
 * @param {File} file - 图片文件
 * @param {boolean} isAvatar - 是否为头像
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file, isAvatar = true) {
    if (!file || !file.type) {
        return { valid: false, error: '无效文件' };
    }
    
    if (!IMAGE_CONFIG.supportedTypes.includes(file.type)) {
        return { valid: false, error: '仅支持JPG/PNG格式' };
    }
    
    const config = isAvatar ? IMAGE_CONFIG.avatar : IMAGE_CONFIG.article;
    const limitMB = config.maxSize / (1024 * 1024);
    
    if (file.size > config.maxSize) {
        return { valid: false, error: `图片需小于${limitMB}MB` };
    }
    
    return { valid: true };
}

/**
 * 创建图片预览
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - Base64 字符串
 */
export function createPreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('无法预览图片'));
        reader.readAsDataURL(file);
    });
}

