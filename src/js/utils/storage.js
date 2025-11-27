/**
 * Firebase Storage 图片上传工具
 * 将图片上传到 Firebase Storage 而不是存储为 Base64
 */

import { IMAGE_CONFIG } from '../config.js';

// Storage 引用
let storage = null;

/**
 * 初始化 Storage
 */
export function initStorage() {
    if (typeof firebase !== 'undefined' && firebase.storage) {
        storage = firebase.storage();
    }
}

/**
 * 生成唯一文件名
 * @param {string} originalName - 原始文件名
 * @returns {string}
 */
function generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${random}.${ext}`;
}

/**
 * 上传图片到 Firebase Storage
 * @param {File} file - 图片文件
 * @param {string} folder - 文件夹路径 (articles/avatars)
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<string>} - 返回下载 URL
 */
export async function uploadImageToStorage(file, folder = 'articles', onProgress = null) {
    // 如果 Storage 不可用，回退到 Base64
    if (!storage) {
        console.warn('Firebase Storage 不可用，使用 Base64 存储');
        return await fileToBase64(file);
    }
    
    const fileName = generateFileName(file.name);
    const filePath = `${folder}/${fileName}`;
    const storageRef = storage.ref(filePath);
    
    return new Promise((resolve, reject) => {
        const uploadTask = storageRef.put(file);
        
        uploadTask.on('state_changed',
            // 进度监听
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress(progress);
                }
            },
            // 错误处理
            (error) => {
                console.error('上传失败:', error);
                // 回退到 Base64
                fileToBase64(file).then(resolve).catch(reject);
            },
            // 完成处理
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(downloadURL);
                } catch (error) {
                    // 回退到 Base64
                    fileToBase64(file).then(resolve).catch(reject);
                }
            }
        );
    });
}

/**
 * 批量上传图片
 * @param {File[]} files - 图片文件数组
 * @param {string} folder - 文件夹路径
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<string[]>} - 返回下载 URL 数组
 */
export async function uploadMultipleImages(files, folder = 'articles', onProgress = null) {
    const results = [];
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const url = await uploadImageToStorage(file, folder, (progress) => {
                if (onProgress) {
                    const overallProgress = ((i + progress / 100) / total) * 100;
                    onProgress(overallProgress, i + 1, total);
                }
            });
            results.push(url);
        } catch (error) {
            console.error(`上传第 ${i + 1} 张图片失败:`, error);
            results.push(null);
        }
    }
    
    return results.filter(url => url !== null);
}

/**
 * 删除 Storage 中的图片
 * @param {string} url - 图片 URL
 * @returns {Promise<boolean>}
 */
export async function deleteImageFromStorage(url) {
    if (!storage || !url) return false;
    
    try {
        // 检查是否是 Firebase Storage URL
        if (!url.includes('firebasestorage.googleapis.com')) {
            return false; // Base64 或其他 URL，无需删除
        }
        
        const storageRef = storage.refFromURL(url);
        await storageRef.delete();
        return true;
    } catch (error) {
        console.error('删除图片失败:', error);
        return false;
    }
}

/**
 * 文件转 Base64（回退方案）
 * @param {File} file - 文件
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 压缩并上传图片
 * @param {File} file - 图片文件
 * @param {boolean} isAvatar - 是否为头像
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<string>}
 */
export async function compressAndUpload(file, isAvatar = false, onProgress = null) {
    const config = isAvatar ? IMAGE_CONFIG.avatar : IMAGE_CONFIG.article;
    
    // 验证文件
    if (!IMAGE_CONFIG.supportedTypes.includes(file.type)) {
        throw new Error('仅支持 JPG/PNG 格式');
    }
    
    if (file.size > config.maxSize) {
        throw new Error(`图片需小于 ${config.maxSize / (1024 * 1024)}MB`);
    }
    
    // 压缩图片
    const compressedFile = await compressImageFile(file, config);
    
    // 上传到 Storage
    const folder = isAvatar ? 'avatars' : 'articles';
    return await uploadImageToStorage(compressedFile, folder, onProgress);
}

/**
 * 压缩图片文件
 * @param {File} file - 原始文件
 * @param {Object} config - 压缩配置
 * @returns {Promise<Blob>}
 */
async function compressImageFile(file, config) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
            let { width, height } = img;
            const maxDim = config.maxDimension;
            
            // 计算缩放
            if (width > maxDim || height > maxDim) {
                const ratio = width / height;
                if (width > height) {
                    width = maxDim;
                    height = Math.round(width / ratio);
                } else {
                    height = maxDim;
                    width = Math.round(height * ratio);
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => resolve(blob),
                file.type,
                config.quality
            );
        };
        
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = URL.createObjectURL(file);
    });
}

export default {
    init: initStorage,
    upload: uploadImageToStorage,
    uploadMultiple: uploadMultipleImages,
    delete: deleteImageFromStorage,
    compressAndUpload
};

