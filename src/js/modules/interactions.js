/**
 * 文章互动模块
 * 点赞、收藏、分享、阅读量
 */

import { getStorage, setStorage } from '../utils/helpers.js';
import { getData, setData, getRef } from './firebase.js';
import notify from './notification.js';

// 本地存储键
const LIKES_KEY = 'article_likes';
const FAVORITES_KEY = 'article_favorites';

/**
 * 获取用户点赞列表
 * @returns {Array}
 */
export function getUserLikes() {
    return getStorage(LIKES_KEY, []);
}

/**
 * 获取用户收藏列表
 * @returns {Array}
 */
export function getUserFavorites() {
    return getStorage(FAVORITES_KEY, []);
}

/**
 * 检查是否已点赞
 * @param {string} articleId
 * @returns {boolean}
 */
export function isLiked(articleId) {
    return getUserLikes().includes(articleId);
}

/**
 * 检查是否已收藏
 * @param {string} articleId
 * @returns {boolean}
 */
export function isFavorited(articleId) {
    return getUserFavorites().includes(articleId);
}

/**
 * 切换点赞状态
 * @param {string} articleId
 * @returns {Promise<{liked: boolean, count: number}>}
 */
export async function toggleLike(articleId) {
    const likes = getUserLikes();
    const wasLiked = likes.includes(articleId);
    
    // 更新本地状态
    if (wasLiked) {
        const index = likes.indexOf(articleId);
        likes.splice(index, 1);
    } else {
        likes.push(articleId);
    }
    setStorage(LIKES_KEY, likes);
    
    // 更新服务器计数
    try {
        const path = `stats/${articleId}/likes`;
        const currentCount = (await getData(path)) || 0;
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        await setData(path, newCount);
        
        return { liked: !wasLiked, count: newCount };
    } catch (error) {
        console.error('更新点赞失败:', error);
        return { liked: !wasLiked, count: 0 };
    }
}

/**
 * 切换收藏状态
 * @param {string} articleId
 * @returns {{favorited: boolean}}
 */
export function toggleFavorite(articleId) {
    const favorites = getUserFavorites();
    const wasFavorited = favorites.includes(articleId);
    
    if (wasFavorited) {
        const index = favorites.indexOf(articleId);
        favorites.splice(index, 1);
        notify.info('已取消收藏');
    } else {
        favorites.push(articleId);
        notify.success('已添加到收藏');
    }
    setStorage(FAVORITES_KEY, favorites);
    
    return { favorited: !wasFavorited };
}

/**
 * 获取点赞数
 * @param {string} articleId
 * @returns {Promise<number>}
 */
export async function getLikeCount(articleId) {
    try {
        const count = await getData(`stats/${articleId}/likes`);
        return count || 0;
    } catch {
        return 0;
    }
}

/**
 * 增加阅读量
 * @param {string} articleId
 * @returns {Promise<number>}
 */
export async function incrementViewCount(articleId) {
    // 检查是否已经在本次会话中计数
    const viewedKey = `viewed_${articleId}`;
    if (sessionStorage.getItem(viewedKey)) {
        return getViewCount(articleId);
    }
    
    try {
        const path = `stats/${articleId}/views`;
        const currentCount = (await getData(path)) || 0;
        const newCount = currentCount + 1;
        await setData(path, newCount);
        sessionStorage.setItem(viewedKey, '1');
        return newCount;
    } catch (error) {
        console.error('更新阅读量失败:', error);
        return 0;
    }
}

/**
 * 获取阅读量
 * @param {string} articleId
 * @returns {Promise<number>}
 */
export async function getViewCount(articleId) {
    try {
        const count = await getData(`stats/${articleId}/views`);
        return count || 0;
    } catch {
        return 0;
    }
}

/**
 * 分享文章
 * @param {Object} article - 文章对象
 * @param {string} platform - 平台 (weibo/wechat/copy)
 */
export function shareArticle(article, platform) {
    const url = `${window.location.origin}/#article/${article.id}`;
    const title = article.title;
    const summary = (article.content || '').substring(0, 100);
    
    switch (platform) {
        case 'weibo':
            const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
            window.open(weiboUrl, '_blank', 'width=600,height=400');
            break;
            
        case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
            window.open(twitterUrl, '_blank', 'width=600,height=400');
            break;
            
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                notify.success('链接已复制到剪贴板');
            }).catch(() => {
                // 降级方案
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                notify.success('链接已复制');
            });
            break;
            
        case 'qrcode':
            // 显示二维码（微信扫码分享）
            showQRCode(url);
            break;
    }
}

/**
 * 显示二维码弹窗
 * @param {string} url
 */
function showQRCode(url) {
    // 使用 QR 码 API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    const modal = document.createElement('div');
    modal.className = 'qr-modal';
    modal.innerHTML = `
        <div class="qr-modal-content">
            <button class="qr-close">&times;</button>
            <h3>扫码分享</h3>
            <img src="${qrUrl}" alt="QR Code">
            <p>使用微信扫一扫</p>
        </div>
    `;
    
    modal.querySelector('.qr-close').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

/**
 * 创建互动栏 HTML
 * @param {Object} article - 文章对象
 * @param {Object} stats - 统计数据
 * @returns {string}
 */
export function createInteractionBar(article, stats = {}) {
    const liked = isLiked(article.id);
    const favorited = isFavorited(article.id);
    const likeCount = stats.likes || 0;
    const viewCount = stats.views || 0;
    
    return `
        <div class="article-interactions">
            <div class="interaction-stats">
                <span class="stat-item" title="阅读量">
                    <i class="fas fa-eye"></i>
                    <span class="view-count">${viewCount}</span>
                </span>
                <span class="stat-item" title="点赞数">
                    <i class="fas fa-heart"></i>
                    <span class="like-count">${likeCount}</span>
                </span>
            </div>
            <div class="interaction-buttons">
                <button class="interaction-btn like-btn ${liked ? 'active' : ''}" data-article-id="${article.id}" title="点赞">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${liked ? '已赞' : '点赞'}</span>
                </button>
                <button class="interaction-btn favorite-btn ${favorited ? 'active' : ''}" data-article-id="${article.id}" title="收藏">
                    <i class="fas fa-star"></i>
                    <span>${favorited ? '已收藏' : '收藏'}</span>
                </button>
                <div class="share-dropdown">
                    <button class="interaction-btn share-btn" title="分享">
                        <i class="fas fa-share-alt"></i>
                        <span>分享</span>
                    </button>
                    <div class="share-menu">
                        <button class="share-option" data-platform="weibo">
                            <i class="fab fa-weibo"></i> 微博
                        </button>
                        <button class="share-option" data-platform="twitter">
                            <i class="fab fa-twitter"></i> Twitter
                        </button>
                        <button class="share-option" data-platform="qrcode">
                            <i class="fas fa-qrcode"></i> 微信
                        </button>
                        <button class="share-option" data-platform="copy">
                            <i class="fas fa-link"></i> 复制链接
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 绑定互动事件
 * @param {HTMLElement} container
 * @param {Object} article
 */
export function bindInteractionEvents(container, article) {
    // 点赞
    const likeBtn = container.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.onclick = async () => {
            const result = await toggleLike(article.id);
            likeBtn.classList.toggle('active', result.liked);
            likeBtn.querySelector('span').textContent = result.liked ? '已赞' : '点赞';
            
            const countEl = container.querySelector('.like-count');
            if (countEl) countEl.textContent = result.count;
            
            if (result.liked) {
                notify.success('感谢点赞！');
            }
        };
    }
    
    // 收藏
    const favoriteBtn = container.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.onclick = () => {
            const result = toggleFavorite(article.id);
            favoriteBtn.classList.toggle('active', result.favorited);
            favoriteBtn.querySelector('span').textContent = result.favorited ? '已收藏' : '收藏';
        };
    }
    
    // 分享下拉菜单
    const shareBtn = container.querySelector('.share-btn');
    const shareMenu = container.querySelector('.share-menu');
    if (shareBtn && shareMenu) {
        shareBtn.onclick = (e) => {
            e.stopPropagation();
            shareMenu.classList.toggle('show');
        };
        
        // 点击其他地方关闭
        document.addEventListener('click', () => {
            shareMenu.classList.remove('show');
        });
        
        // 分享选项
        shareMenu.querySelectorAll('.share-option').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const platform = btn.dataset.platform;
                shareArticle(article, platform);
                shareMenu.classList.remove('show');
            };
        });
    }
}

export default {
    toggleLike,
    toggleFavorite,
    getLikeCount,
    getViewCount,
    incrementViewCount,
    shareArticle,
    createInteractionBar,
    bindInteractionEvents,
    isLiked,
    isFavorited
};

