/**
 * 文章详情页模块
 */

import { $, setHTML } from '../utils/dom.js';
import { escapeHtml, formatDate, getStorage, setStorage, generateId } from '../utils/helpers.js';
import { COMMENT_CONFIG } from '../config.js';
import { isAdmin, isLoggedIn, saveComment, deleteComment, onCommentsChange } from '../modules/firebase.js';
import { initScrollAnimations, disconnectScrollAnimations } from '../modules/scroll.js';
import { showImageModal, showAuthModal } from '../modules/modal.js';
import { renderMarkdown, enhanceRenderedMarkdown } from '../modules/markdown.js';
import notify from '../modules/notification.js';
import { getArticles } from './home.js';

// 评论数据
let comments = [];

// 当前打开的回复表单
let currentOpenReplyForm = null;

/**
 * 设置评论数据
 * @param {Array} data - 评论数组
 */
export function setComments(data) {
    comments = data || [];
}

/**
 * 渲染评论
 * @param {string} articleId - 文章 ID
 * @param {string|null} parentId - 父评论 ID
 * @param {number} level - 嵌套层级
 * @param {HTMLElement} container - 容器
 */
function renderComments(articleId, parentId = null, level = 0, container = null) {
    const MAX_LEVEL = COMMENT_CONFIG.maxNestingLevel;
    
    if (!container) {
        container = $('.comments');
    }
    if (!container) return;
    
    if (level === 0) {
        container.innerHTML = '';
    }
    
    // 判断是否为根评论
    const isRoot = (val) => val === null || val === undefined || val === '' || val === 'null';
    
    const filteredComments = comments.filter(c =>
        String(c.articleId) === String(articleId) &&
        (isRoot(parentId) ? isRoot(c.parentId) : String(c.parentId) === String(parentId))
    );
    
    if (filteredComments.length === 0 && isRoot(parentId) && level === 0) {
        container.innerHTML = '<p style="color:#888;font-size:14px;text-align:center;">暂无评论，快来发表第一条吧！</p>';
        return;
    }
    
    filteredComments.forEach((comment, index) => {
        const div = document.createElement('div');
        div.className = 'comment animate-on-scroll';
        div.style.marginLeft = `${level * 20}px`;
        div.style.setProperty('--comment-index', index);
        
        const commentText = comment.comment || comment.content || '';
        
        div.innerHTML = `
            <p><strong>${escapeHtml(comment.name || '匿名')}</strong>${escapeHtml(commentText)}</p>
            <small>发表于 ${comment.date || '未知'}</small>
            ${level < MAX_LEVEL ? `
                <button class="reply-button" data-comment-id="${comment.id}" data-comment-name="${escapeHtml(comment.name || '匿名')}" title="回复此评论">回复</button>
            ` : ''}
            ${isAdmin() ? `
                <button class="delete-comment-button" data-comment-id="${comment.id}" data-push-id="${comment._pushId || ''}" title="删除评论">删除</button>
            ` : ''}
            <div id="reply-form-container-${comment.id}" class="reply-form-container" style="display:none;"></div>
            <div id="sub-comments-${comment.id}" class="sub-comments"></div>
        `;
        
        container.appendChild(div);
        
        // 绑定回复按钮
        if (level < MAX_LEVEL) {
            const replyBtn = div.querySelector('.reply-button');
            if (replyBtn) {
                replyBtn.onclick = () => {
                    openInlineReplyForm(articleId, comment.id, comment.name || '匿名', div);
                };
            }
        }
        
        // 渲染子评论
        const subContainer = div.querySelector(`#sub-comments-${comment.id}`);
        if (level < MAX_LEVEL) {
            renderComments(articleId, comment.id, level + 1, subContainer);
        }
    });
    
    initScrollAnimations();
}

/**
 * 关闭内联回复表单
 * @param {HTMLElement} formContainer - 表单容器
 */
function closeInlineReplyForm(formContainer = null) {
    const containerToClose = formContainer || currentOpenReplyForm;
    if (containerToClose) {
        containerToClose.innerHTML = '';
        containerToClose.style.display = 'none';
    }
    currentOpenReplyForm = null;
}

/**
 * 打开内联回复表单
 * @param {string} articleId - 文章 ID
 * @param {string} parentId - 父评论 ID
 * @param {string} parentName - 父评论者名字
 * @param {HTMLElement} parentElement - 父评论元素
 */
function openInlineReplyForm(articleId, parentId, parentName, parentElement) {
    closeInlineReplyForm();
    
    const containerId = `reply-form-container-${parentId}`;
    let container = document.getElementById(containerId);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'reply-form-container';
        container.style.display = 'none';
        parentElement.appendChild(container);
    }
    
    let commenterName = getStorage('commenterName', '');
    
    container.innerHTML = `
        <form class="inline-reply-form" data-parent-id="${parentId}" data-article-id="${articleId}">
            <label for="inlineReplyName-${parentId}">你的名字:</label>
            <input type="text" id="inlineReplyName-${parentId}" value="${escapeHtml(commenterName)}" placeholder="访客" required>
            <label for="inlineReplyText-${parentId}">回复 @${escapeHtml(parentName)}:</label>
            <textarea id="inlineReplyText-${parentId}" placeholder="输入你的回复..." required></textarea>
            <div class="char-count" id="replyCharCount-${parentId}">0/${COMMENT_CONFIG.maxLength}</div>
            <div class="reply-form-actions">
                <button type="submit" class="submit-reply">提交回复</button>
                <button type="button" class="cancel-reply">取消</button>
            </div>
        </form>
    `;
    
    container.style.display = 'block';
    currentOpenReplyForm = container;
    
    // 字数统计
    const textarea = container.querySelector('textarea');
    const charCount = container.querySelector(`#replyCharCount-${parentId}`);
    
    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = `${count}/${COMMENT_CONFIG.maxLength}`;
            charCount.style.color = count > COMMENT_CONFIG.maxLength ? '#d16060' : 'inherit';
        });
        textarea.focus();
    }
    
    // 取消按钮
    container.querySelector('.cancel-reply').onclick = () => {
        closeInlineReplyForm(container);
    };
    
    // 提交表单
    container.querySelector('form').onsubmit = async (e) => {
        e.preventDefault();
        await handleInlineReplySubmit(container.querySelector('form'));
    };
}

/**
 * 处理内联回复提交
 * @param {HTMLFormElement} form - 表单元素
 */
async function handleInlineReplySubmit(form) {
    const parentId = form.dataset.parentId;
    const articleId = form.dataset.articleId;
    const nameInput = form.querySelector('input[type="text"]');
    const textarea = form.querySelector('textarea');
    
    if (!parentId || !nameInput || !textarea || !articleId) {
        notify.error('提交回复失败：缺少必要信息');
        return;
    }
    
    const name = nameInput.value.trim();
    const commentText = textarea.value.trim();
    
    if (!name || !commentText) {
        notify.error('请填写名字和回复内容');
        return;
    }
    
    if (commentText.length > COMMENT_CONFIG.maxLength) {
        notify.error(`回复内容不能超过${COMMENT_CONFIG.maxLength}字符`);
        return;
    }
    
    const replyComment = {
        id: generateId(),
        articleId: String(articleId),
        name,
        comment: commentText,
        date: formatDate(new Date(), 'YYYY-MM-DD'),
        parentId
    };
    
    try {
        await saveComment(replyComment);
        setStorage('commenterName', name);
        notify.success('回复提交成功');
        closeInlineReplyForm();
    } catch (err) {
        console.error('保存回复失败', err);
        notify.error('保存回复失败，请重试');
    }
}

/**
 * 处理评论删除
 * @param {string} commentId - 评论 ID
 * @param {string} pushId - Firebase push ID
 * @param {string} articleId - 文章 ID
 */
export async function handleDeleteComment(commentId, pushId, articleId) {
    if (!confirm('确定删除此评论？（包括其所有回复）')) return;
    
    // 收集要删除的评论
    const toDelete = [];
    
    function collectToDelete(id) {
        comments.filter(c => String(c.parentId) === String(id)).forEach(child => {
            if (child._pushId) toDelete.push(child._pushId);
            collectToDelete(child.id);
        });
    }
    
    collectToDelete(commentId);
    if (pushId) toDelete.push(pushId);
    
    // 删除所有相关评论
    for (const pid of toDelete) {
        await deleteComment(pid);
    }
    
    notify.success('评论已删除');
}

/**
 * 显示文章详情页
 * @param {string} articleId - 文章 ID
 */
export function showArticle(articleId) {
    disconnectScrollAnimations();
    
    const articles = getArticles();
    const article = articles.find(a => String(a.id) === String(articleId));
    
    if (!article) {
        notify.error('未找到文章');
        window.location.hash = '#home';
        return;
    }
    
    const content = $('#content');
    if (!content) return;
    
    const contentHtml = renderMarkdown(article.content || '');
    
    content.innerHTML = `
        <div class="article-page" data-article-id="${articleId}">
            <h1 class="animate-on-scroll">${escapeHtml(article.title || '无题')}</h1>
            <p class="animate-on-scroll" style="animation-delay:0.1s;">
                分类: ${escapeHtml(article.category || '未分类')} | 日期: ${article.date || '未知'}
            </p>
            ${(Array.isArray(article.images) && article.images.length > 0) ? `
                <div class="gallery animate-on-scroll" style="animation-delay:0.2s;">
                    ${article.images.length > 1 ? '<button class="prev" title="上一张">◄</button>' : ''}
                    <img src="${article.images[0]}" alt="${escapeHtml(article.title || '文章')} 图片1" onerror="this.alt='图片加载失败';this.style.display='none';">
                    ${article.images.length > 1 ? '<button class="next" title="下一张">►</button>' : ''}
                    ${article.images.length > 1 ? `<div class="counter">1/${article.images.length}</div>` : ''}
                </div>
            ` : ''}
            <div class="article-content animate-on-scroll" style="animation-delay:0.3s;">${contentHtml}</div>
            <hr>
            <h2>评论区</h2>
            <div class="comments"><p style="text-align:center;color:#888;font-size:14px;">评论加载中...</p></div>
            ${isLoggedIn() ? `
                <form id="commentForm" novalidate class="animate-on-scroll" style="animation-delay:0.4s;">
                    <h3>发表评论</h3>
                    <label for="commentName">你的名字:</label>
                    <input type="text" id="commentName" placeholder="访客" required>
                    <label for="commentText">评论内容:</label>
                    <textarea id="commentText" placeholder="输入你的评论..." required></textarea>
                    <div class="char-count" id="commentCharCount">0/${COMMENT_CONFIG.maxLength}</div>
                    <button type="submit">提交评论</button>
                </form>
            ` : `
                <div class="comment-login-tips">
                    请先<a href="#" id="loginToComment">登录</a>后发表评论
                </div>
            `}
        </div>
    `;
    
    // 增强 Markdown 内容
    const articleContent = content.querySelector('.article-content');
    enhanceRenderedMarkdown(articleContent);
    
    // 初始化评论者名字
    const commentNameInput = $('#commentName');
    if (commentNameInput) {
        const savedName = getStorage('commenterName', '');
        if (savedName) commentNameInput.value = savedName;
    }
    
    // 渲染评论
    renderComments(articleId);
    
    // 图库导航
    initGallery(article.images);
    
    // 评论表单
    initCommentForm(articleId);
    
    // 登录提示
    const loginLink = $('#loginToComment');
    if (loginLink) {
        loginLink.onclick = (e) => {
            e.preventDefault();
            showAuthModal();
        };
    }
    
    initScrollAnimations();
}

/**
 * 初始化图库
 * @param {Array} images - 图片数组
 */
function initGallery(images) {
    if (!images || images.length <= 1) return;
    
    const gallery = $('.gallery');
    if (!gallery) return;
    
    let currentIndex = 0;
    const img = gallery.querySelector('img');
    const counter = gallery.querySelector('.counter');
    const prevBtn = gallery.querySelector('.prev');
    const nextBtn = gallery.querySelector('.next');
    
    function updateGallery() {
        if (img) img.src = images[currentIndex];
        if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
    }
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentIndex = (currentIndex - 1 + images.length) % images.length;
            updateGallery();
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentIndex = (currentIndex + 1) % images.length;
            updateGallery();
        };
    }
    
    if (img) {
        img.onclick = () => showImageModal(images[currentIndex]);
    }
}

/**
 * 初始化评论表单
 * @param {string} articleId - 文章 ID
 */
function initCommentForm(articleId) {
    const form = $('#commentForm');
    if (!form) return;
    
    const nameInput = $('#commentName');
    const textarea = $('#commentText');
    const charCount = $('#commentCharCount');
    
    // 字数统计
    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = `${count}/${COMMENT_CONFIG.maxLength}`;
            charCount.style.color = count > COMMENT_CONFIG.maxLength ? '#d16060' : 'inherit';
        });
    }
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const text = textarea.value.trim();
        
        if (!name || !text) {
            notify.error('请填写名字和评论内容');
            return;
        }
        
        if (text.length > COMMENT_CONFIG.maxLength) {
            notify.error(`评论内容不能超过${COMMENT_CONFIG.maxLength}字符`);
            return;
        }
        
        const newComment = {
            id: generateId(),
            articleId: String(articleId),
            name,
            comment: text,
            date: formatDate(new Date(), 'YYYY-MM-DD'),
            parentId: null
        };
        
        try {
            await saveComment(newComment);
            setStorage('commenterName', name);
            notify.success('评论提交成功');
            form.reset();
            nameInput.value = name;
            if (charCount) charCount.textContent = `0/${COMMENT_CONFIG.maxLength}`;
        } catch (err) {
            notify.error('评论提交失败，请重试');
        }
    };
}

export default {
    show: showArticle,
    setComments,
    handleDeleteComment
};

