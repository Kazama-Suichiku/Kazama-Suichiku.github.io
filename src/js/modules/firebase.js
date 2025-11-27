/**
 * Firebase 模块
 * 处理 Firebase 认证和数据库操作
 */

import { FIREBASE_CONFIG, ADMIN_CONFIG, COMMENT_CONFIG } from '../config.js';
import notify from './notification.js';

// Firebase 实例引用
let auth = null;
let db = null;

// 当前用户
let currentUser = null;

// 用户状态变化回调
const authCallbacks = [];

/**
 * 初始化 Firebase
 */
export function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK 未加载');
        return;
    }
    
    // 初始化应用（如果尚未初始化）
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
    
    auth = firebase.auth();
    db = firebase.database();
    
    // 监听认证状态
    auth.onAuthStateChanged(user => {
        currentUser = user;
        authCallbacks.forEach(callback => callback(user));
    });
}

/**
 * 获取当前用户
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
    return !!currentUser;
}

/**
 * 检查是否为管理员
 * @returns {boolean}
 */
export function isAdmin() {
    return currentUser && currentUser.email === ADMIN_CONFIG.email;
}

/**
 * 注册认证状态变化回调
 * @param {Function} callback - 回调函数
 */
export function onAuthStateChange(callback) {
    authCallbacks.push(callback);
    // 如果已有用户，立即调用
    if (currentUser !== null) {
        callback(currentUser);
    }
}

/**
 * 登录
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise}
 */
export async function login(email, password) {
    if (!auth) {
        throw new Error('Firebase 未初始化');
    }
    return auth.signInWithEmailAndPassword(email, password);
}

/**
 * 注册
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @returns {Promise}
 */
export async function register(email, password) {
    if (!auth) {
        throw new Error('Firebase 未初始化');
    }
    return auth.createUserWithEmailAndPassword(email, password);
}

/**
 * 登出
 * @returns {Promise}
 */
export async function logout() {
    if (!auth) {
        throw new Error('Firebase 未初始化');
    }
    return auth.signOut();
}

// ==================== 数据库操作 ====================

/**
 * 获取数据库引用
 * @param {string} path - 路径
 * @returns {Object}
 */
export function getRef(path) {
    if (!db) {
        throw new Error('Firebase 未初始化');
    }
    return db.ref(path);
}

/**
 * 读取数据
 * @param {string} path - 路径
 * @returns {Promise<any>}
 */
export async function getData(path) {
    const snapshot = await getRef(path).once('value');
    return snapshot.val();
}

/**
 * 设置数据
 * @param {string} path - 路径
 * @param {any} data - 数据
 * @returns {Promise}
 */
export async function setData(path, data) {
    return getRef(path).set(data);
}

/**
 * 推送数据（自动生成 key）
 * @param {string} path - 路径
 * @param {any} data - 数据
 * @returns {Promise<string>} - 返回生成的 key
 */
export async function pushData(path, data) {
    const ref = getRef(path).push();
    await ref.set(data);
    return ref.key;
}

/**
 * 删除数据
 * @param {string} path - 路径
 * @returns {Promise}
 */
export async function removeData(path) {
    return getRef(path).remove();
}

/**
 * 监听数据变化
 * @param {string} path - 路径
 * @param {Function} callback - 回调函数
 * @returns {Function} - 取消监听函数
 */
export function onDataChange(path, callback) {
    const ref = getRef(path);
    ref.on('value', snapshot => {
        callback(snapshot.val());
    });
    return () => ref.off('value');
}

// ==================== 文章操作 ====================

/**
 * 获取所有文章
 * @returns {Promise<Array>}
 */
export async function getArticles() {
    const data = await getData('articles');
    return data ? Object.values(data) : [];
}

/**
 * 保存文章
 * @param {Object} article - 文章对象
 * @returns {Promise}
 */
export async function saveArticle(article) {
    return setData(`articles/${article.id}`, article);
}

/**
 * 删除文章
 * @param {string} articleId - 文章 ID
 * @returns {Promise}
 */
export async function deleteArticle(articleId) {
    return removeData(`articles/${articleId}`);
}

/**
 * 监听文章变化
 * @param {Function} callback - 回调函数
 * @returns {Function} - 取消监听函数
 */
export function onArticlesChange(callback) {
    return onDataChange('articles', data => {
        const articles = data ? Object.values(data) : [];
        callback(articles);
    });
}

// ==================== 评论操作 ====================

/**
 * 获取所有评论
 * @returns {Promise<Array>}
 */
export async function getComments() {
    const data = await getData(COMMENT_CONFIG.firebaseRef);
    if (!data) return [];
    return Object.entries(data).map(([pushId, comment]) => ({
        ...comment,
        _pushId: pushId
    }));
}

/**
 * 保存评论
 * @param {Object} comment - 评论对象
 * @returns {Promise<string>} - 返回生成的 key
 */
export async function saveComment(comment) {
    return pushData(COMMENT_CONFIG.firebaseRef, comment);
}

/**
 * 删除评论
 * @param {string} pushId - 评论的 push ID
 * @returns {Promise}
 */
export async function deleteComment(pushId) {
    return removeData(`${COMMENT_CONFIG.firebaseRef}/${pushId}`);
}

/**
 * 监听评论变化
 * @param {Function} callback - 回调函数
 * @returns {Function} - 取消监听函数
 */
export function onCommentsChange(callback) {
    return onDataChange(COMMENT_CONFIG.firebaseRef, data => {
        const comments = data 
            ? Object.entries(data).map(([pushId, comment]) => ({
                ...comment,
                _pushId: pushId
            }))
            : [];
        callback(comments);
    });
}

// ==================== 头像操作 ====================

/**
 * 获取头像
 * @param {string} uid - 用户 UID（可选，默认使用管理员 UID）
 * @returns {Promise<string|null>}
 */
export async function getAvatar(uid = ADMIN_CONFIG.avatarUid) {
    return getData(`avatars/${uid}`);
}

/**
 * 保存头像
 * @param {string} base64 - Base64 图片数据
 * @param {string} uid - 用户 UID（可选）
 * @returns {Promise}
 */
export async function saveAvatar(base64, uid = null) {
    const targetUid = uid || (currentUser ? currentUser.uid : ADMIN_CONFIG.avatarUid);
    return setData(`avatars/${targetUid}`, base64);
}

export default {
    init: initFirebase,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    onAuthStateChange,
    login,
    register,
    logout,
    getArticles,
    saveArticle,
    deleteArticle,
    onArticlesChange,
    getComments,
    saveComment,
    deleteComment,
    onCommentsChange,
    getAvatar,
    saveAvatar
};

