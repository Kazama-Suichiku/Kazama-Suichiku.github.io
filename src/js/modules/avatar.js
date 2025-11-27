/**
 * 头像模块
 * 处理头像上传和显示
 */

import { $, setVisible } from '../utils/dom.js';
import { compressImage, validateImage } from '../utils/image.js';
import { getCurrentUser, getAvatar, saveAvatar } from './firebase.js';
import notify from './notification.js';
import { ADMIN_CONFIG } from '../config.js';

// 预览的头像数据
let previewedAvatarData = null;

/**
 * 加载头像
 */
export async function loadAvatar() {
    const profileAvatar = $('#profileAvatar');
    const uploadSection = $('#avatarUploadSection');
    
    if (!profileAvatar || !uploadSection) return;
    
    const user = getCurrentUser();
    
    try {
        // 始终显示管理员头像
        const avatarUrl = await getAvatar(ADMIN_CONFIG.avatarUid);
        
        if (avatarUrl) {
            profileAvatar.src = avatarUrl;
            profileAvatar.style.background = '';
        } else {
            profileAvatar.src = '';
            profileAvatar.style.background = 'linear-gradient(135deg, #7fd7e7 0%, #b4e19e 100%)';
        }
    } catch (e) {
        profileAvatar.src = '';
        profileAvatar.style.background = 'linear-gradient(135deg, #7fd7e7 0%, #b4e19e 100%)';
    }
    
    // 只有登录用户才能上传
    setVisible(uploadSection, !!user);
}

/**
 * 初始化头像上传功能
 */
export function initAvatarUpload() {
    const avatarInput = $('#avatarInput');
    const avatarPreview = $('#avatarPreview');
    const uploadButton = $('#uploadAvatarButton');
    const profileAvatar = $('#profileAvatar');
    const avatarLabel = $('.avatar-upload-label');
    
    if (!avatarInput || !avatarPreview || !uploadButton || !profileAvatar || !avatarLabel) {
        return;
    }
    
    // 点击标签触发文件选择
    avatarLabel.addEventListener('click', (e) => {
        e.preventDefault();
        if (!getCurrentUser()) return;
        avatarInput.click();
    });
    
    // 文件选择处理
    avatarInput.onchange = async () => {
        if (!getCurrentUser()) return;
        
        const file = avatarInput.files ? avatarInput.files[0] : null;
        uploadButton.disabled = true;
        avatarPreview.style.display = 'none';
        previewedAvatarData = null;
        
        if (!file) return;
        
        // 验证文件
        const validation = validateImage(file, true);
        if (!validation.valid) {
            notify.error(validation.error);
            avatarInput.value = '';
            return;
        }
        
        try {
            notify.info('正在处理图片...');
            const compressed = await compressImage(file, true);
            previewedAvatarData = compressed;
            avatarPreview.src = compressed;
            avatarPreview.style.display = 'block';
            uploadButton.disabled = false;
            notify.success('预览生成成功');
        } catch (e) {
            notify.error(`处理失败: ${e.message || '未知错误'}`);
            avatarInput.value = '';
        }
    };
    
    // 上传按钮处理
    uploadButton.onclick = async () => {
        if (!getCurrentUser() || !previewedAvatarData) {
            notify.error('请先选择图片');
            return;
        }
        
        try {
            await saveAvatar(previewedAvatarData);
            profileAvatar.src = previewedAvatarData;
            profileAvatar.style.background = '';
            
            // 重置状态
            avatarInput.value = '';
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
            uploadButton.disabled = true;
            previewedAvatarData = null;
            
            notify.success('头像已同步到云端');
        } catch (e) {
            notify.error(`保存失败: ${e.message || '未知错误'}`);
        }
    };
}

export default {
    load: loadAvatar,
    initUpload: initAvatarUpload
};

