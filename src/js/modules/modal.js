/**
 * 模态框模块
 * 处理图片预览和认证弹窗
 */

import { $, createElement, remove, on } from '../utils/dom.js';
import { escapeHtml } from '../utils/helpers.js';
import { login, register, logout, getCurrentUser } from './firebase.js';

// ==================== 图片模态框 ====================

/**
 * 显示图片模态框
 * @param {string} src - 图片地址
 */
export function showImageModal(src) {
    // 防止重复打开
    if ($('.image-modal')) return;
    
    const modal = createElement('div', { className: 'image-modal' });
    modal.innerHTML = `
        <span class="close" title="关闭(Esc)">×</span>
        <img src="${src}" alt="图片预览">
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    const closeBtn = modal.querySelector('.close');
    
    const removeModal = () => {
        if (document.body.contains(modal)) {
            remove(modal);
        }
        document.removeEventListener('keydown', escapeKeyListener);
    };
    
    closeBtn.onclick = removeModal;
    modal.onclick = (e) => {
        if (e.target === modal) removeModal();
    };
    
    const escapeKeyListener = (e) => {
        if (e.key === 'Escape') removeModal();
    };
    document.addEventListener('keydown', escapeKeyListener);
}

// ==================== 认证模态框 ====================

let authModalElement = null;

/**
 * 设置认证模态框状态消息
 * @param {string} msg - 消息
 * @param {string} type - 类型 (error/success)
 */
function setAuthModalStatus(msg, type = '') {
    const status = $('#authModalStatus');
    if (status) {
        status.textContent = msg;
        status.className = 'auth-modal-status ' + type;
    }
}

/**
 * 关闭认证模态框
 */
export function closeAuthModal() {
    if (authModalElement) {
        remove(authModalElement);
        authModalElement = null;
    }
}

/**
 * 显示认证模态框
 */
export function showAuthModal() {
    // 如果已存在则显示
    if (authModalElement) {
        authModalElement.style.display = 'flex';
        return;
    }
    
    authModalElement = createElement('div', {
        id: 'authModal',
        className: 'auth-modal'
    });
    
    authModalElement.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">登录</button>
                <button class="auth-tab" data-tab="register">注册</button>
            </div>
            <form id="loginForm" class="auth-form">
                <label>邮箱</label>
                <input type="email" id="loginEmail" placeholder="请输入邮箱" required autocomplete="username">
                <label>密码</label>
                <input type="password" id="loginPassword" placeholder="请输入密码" required autocomplete="current-password">
                <button type="submit">登录</button>
            </form>
            <form id="registerForm" class="auth-form" style="display:none;">
                <label>邮箱</label>
                <input type="email" id="registerEmail" placeholder="请输入邮箱" required autocomplete="username">
                <label>密码</label>
                <input type="password" id="registerPassword" placeholder="请输入密码" required autocomplete="new-password">
                <button type="submit">注册</button>
            </form>
            <div id="authModalStatus" class="auth-modal-status"></div>
            <button class="auth-modal-close" title="关闭">×</button>
        </div>
    `;
    
    document.body.appendChild(authModalElement);
    
    // 切换 Tab
    const tabs = authModalElement.querySelectorAll('.auth-tab');
    const loginForm = authModalElement.querySelector('#loginForm');
    const registerForm = authModalElement.querySelector('#registerForm');
    
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tab.dataset.tab === 'login') {
                loginForm.style.display = '';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = '';
            }
            setAuthModalStatus('');
        };
    });
    
    // 登录表单
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = authModalElement.querySelector('#loginEmail').value.trim();
        const pwd = authModalElement.querySelector('#loginPassword').value;
        
        try {
            setAuthModalStatus('登录中...', '');
            await login(email, pwd);
            setAuthModalStatus('登录成功', 'success');
            setTimeout(closeAuthModal, 500);
        } catch (e) {
            setAuthModalStatus('登录失败: ' + (e.message || '未知错误'), 'error');
        }
    };
    
    // 注册表单
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = authModalElement.querySelector('#registerEmail').value.trim();
        const pwd = authModalElement.querySelector('#registerPassword').value;
        
        try {
            setAuthModalStatus('注册中...', '');
            await register(email, pwd);
            setAuthModalStatus('注册成功，已自动登录', 'success');
            setTimeout(closeAuthModal, 800);
        } catch (e) {
            setAuthModalStatus('注册失败: ' + (e.message || '未知错误'), 'error');
        }
    };
    
    // 关闭按钮
    authModalElement.querySelector('.auth-modal-close').onclick = closeAuthModal;
    
    // 点击背景关闭
    authModalElement.onclick = (e) => {
        if (e.target === authModalElement) closeAuthModal();
    };
    
    // ESC 关闭
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeAuthModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * 更新头部认证状态 UI
 */
export function updateAuthHeaderUI() {
    const nav = $('header nav ul');
    if (!nav) return;
    
    let statusLi = $('#authStatusHeaderLi');
    if (!statusLi) {
        statusLi = createElement('li', { id: 'authStatusHeaderLi' });
        nav.appendChild(statusLi);
    }
    
    const user = getCurrentUser();
    
    if (user) {
        statusLi.innerHTML = `
            <span class="auth-header-status">已登录: <b>${escapeHtml(user.email)}</b></span>
            <button id="logoutBtnHeader" class="auth-header-logout-btn">登出</button>
        `;
        $('#logoutBtnHeader').onclick = async () => {
            await logout();
        };
    } else {
        statusLi.innerHTML = `
            <button id="openAuthModalBtnHeader" class="auth-header-open-btn">登录/注册</button>
        `;
        $('#openAuthModalBtnHeader').onclick = showAuthModal;
    }
}

export default {
    showImage: showImageModal,
    showAuth: showAuthModal,
    closeAuth: closeAuthModal,
    updateAuthHeader: updateAuthHeaderUI
};

