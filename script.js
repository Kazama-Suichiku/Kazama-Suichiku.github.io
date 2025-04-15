

// --- 静态数据 ---
let articles = [
    { id: "10", title: "探索 Shading 的奥秘", content: "着色（Shading）是计算机图形学中的核心概念。\n它决定了物体表面如何与光线互动，从而呈现出不同的颜色、明暗和质感。\n本文将初步探讨一些基础的着色模型，如 Lambertian 和 Phong。", date: "2025-04-10", images: ["img/7df4fe39a2c75d40d2804681b099b22c.jpg"], category: "技术" },
    { id: "11", title: "程序化生成纹理入门", content: "程序化纹理（Procedural Textures）是通过算法而不是手工绘制生成的图像。\n它们具有无限分辨率、可参数化控制等优点。\n了解如何使用噪声函数（如 Perlin Noise）是入门的关键。", date: "2025-04-11", images: ["img/a979bd1cf40851c97003a892c132948e.jpg"], category: "技术" },
    { id: "12", title: "春日午后的闲暇时光", content: "难得的一个晴朗周末，阳光正好。\n泡一杯清茶，坐在窗边，看光影移动，听鸟儿鸣叫。\n享受这份宁静与惬意。", date: "2025-04-12", images: ["img/b8d843824089837bc11227daa794e542.jpg"], category: "生活" },
    { id: "13", title: "学习 Unreal Engine 5 的小笔记", content: "最近开始接触 UE5，被 Lumen 和 Nanite 技术所震撼。\nLumen 提供了令人惊叹的实时全局光照效果，而 Nanite 则让处理海量模型变得轻而易举。\n虽然学习曲线陡峭，但前景可期！", date: "2025-04-13", images: ["img/f88ee649b6cebd7619493372b274ddd8.jpg"], category: "技术" }
];
let comments = [
    { id: "101", articleId: "10", name: "图形爱好者", comment: "Phong 模型确实很经典！", date: "2025-04-10", parentId: null },
    { id: "102", articleId: "11", name: "程序美术", comment: "噪声函数是程序化的灵魂啊！", date: "2025-04-11", parentId: null },
    { id: "103", articleId: "10", name: "我(模拟)", comment: "是的，理解这些基础对着色很有帮助。", date: "2025-04-11", parentId: "101" }
];
const categories = ['技术', '生活', '其他'];

// --- 全局变量 ---
let previewedAvatarData = null;
let intersectionObserver = null;
let currentOpenReplyForm = null;

// === 主题切换功能 ===
const themeToggleButton = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
        html.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
        if (themeToggleButton) {
            themeToggleButton.innerHTML = '☀️';
            themeToggleButton.title = '切换到白天模式';
        }
    } else {
        html.classList.remove('dark-mode');
        document.body.classList.remove('dark-mode');
        if (themeToggleButton) {
            themeToggleButton.innerHTML = '🌙';
            themeToggleButton.title = '切换到夜间模式';
        }
    }
    try {
        localStorage.setItem('theme', theme);
        initializeParticles();
    } catch (e) {
        console.error('主题保存失败:', e);
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
}

function initializeTheme() {
    let savedTheme;
    try {
        savedTheme = localStorage.getItem('theme');
    } catch (e) {}
    const initialTheme = savedTheme ? savedTheme : (prefersDarkScheme.matches ? 'dark' : 'light');
    applyTheme(initialTheme);
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
}

// === 粒子动画背景初始化 ===
function initializeParticles() {
    if (!window.particlesJS) {
        console.error('particles.js 未加载');
        return;
    }

    if (window.pJSDom && window.pJSDom.length) {
        window.pJSDom.forEach(p => p.pJS.fn.vendors.destroypJS());
        window.pJSDom = [];
    }

    particlesJS('particles-js', {
        particles: {
            number: {
                value: 80,
                density: { enable: true, value_area: 800 }
            },
            color: {
                value: document.documentElement.classList.contains('dark-mode') ? '#92c1de' : '#5a7d9a'
            },
            shape: {
                type: 'circle',
                stroke: { width: 0, color: '#000000' }
            },
            opacity: {
                value: 0.6,
                random: true,
                anim: { enable: true, speed: 1, opacity_min: 0.2, sync: false }
            },
            size: {
                value: 4,
                random: true,
                anim: { enable: true, speed: 2, size_min: 1, sync: false }
            },
            line_linked: {
                enable: true,
                distance: 120,
                color: document.documentElement.classList.contains('dark-mode') ? '#92c1de' : '#5a7d9a',
                opacity: 0.5,
                width: 1
            },
            move: {
                enable: true,
                speed: 3,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            },
            modes: {
                grab: {
                    distance: 150,
                    line_linked: { opacity: 0.8 }
                },
                push: {
                    particles_nb: 6
                },
                repulse: {
                    distance: 100,
                    duration: 0.4
                }
            }
        },
        retina_detect: true
    });

    console.log('粒子动画已初始化');
}

// === Scroll Animation Logic ===
function initializeScrollAnimations() {
    disconnectScrollAnimations();
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;
    const options = { root: null, rootMargin: '0px', threshold: 0.1 };
    intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, options);
    elements.forEach(el => intersectionObserver.observe(el));
}

function disconnectScrollAnimations() {
    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
    }
}

// --- 工具函数 ---
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    notification.onclick = () => notification.remove();
    setTimeout(() => {
        if (document.body.contains(notification)) notification.remove();
    }, 3500);
}

function compressImage(file, isAvatar = true) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type) return reject(new Error('无效文件'));
        if (!file.type.match(/image\/(jpeg|png)/)) return reject(new Error('仅支持JPG/PNG'));
        const sizeLimit = isAvatar ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
        const limitMB = sizeLimit / (1024 * 1024);
        if (file.size > sizeLimit) return reject(new Error(`${isAvatar ? '头像' : '文章'}图片需小于${limitMB}MB`));
        const mimeType = file.type;
        const maxSizePx = isAvatar ? 300 : 1920;
        const quality = isAvatar ? 0.8 : (mimeType === 'image/jpeg' ? 0.85 : undefined);
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result) return reject(new Error('无法读取文件'));
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
                if (!ctx) return reject(new Error('无法获取Canvas上下文'));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    if (!dataUrl || dataUrl === 'data:,') throw new Error('Data URL为空');
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

function highlightText(text, query) {
    if (!text) return '';
    if (!query) return text;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        return String(text).replace(regex, '<mark>$1</mark>');
    } catch (e) {
        return text;
    }
}

function showImageModal(src) {
    if (document.querySelector('.image-modal')) return;
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `<span class="close" title="关闭(Esc)">×</span><img src="${src}" alt="图片预览">`;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    const closeBtn = modal.querySelector('.close');
    const removeModal = () => {
        if (document.body.contains(modal)) modal.remove();
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

// --- 本地存储头像相关 ---
function loadAvatar() {
    try {
        const savedAvatar = localStorage.getItem('userAvatar');
        const profileAvatar = document.getElementById('profileAvatar');
        if (savedAvatar && profileAvatar) profileAvatar.src = savedAvatar;
        else if (profileAvatar) profileAvatar.onerror = () => {
            profileAvatar.src = '';
            profileAvatar.alt = '头像加载失败';
        };
    } catch (e) {}
}

function initAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const uploadButton = document.getElementById('uploadAvatarButton');
    const profileAvatar = document.getElementById('profileAvatar');
    const avatarLabel = document.querySelector('.avatar-upload-label');
    if (!avatarInput || !avatarPreview || !uploadButton || !profileAvatar || !avatarLabel) return;

    // 确保点击标签只触发一次文件选择
    const triggerFileInput = (e) => {
        e.preventDefault();
        avatarInput.click();
    };
    avatarLabel.addEventListener('click', triggerFileInput);

    avatarInput.onchange = async () => {
        const file = avatarInput.files ? avatarInput.files[0] : null;
        uploadButton.disabled = true;
        avatarPreview.style.display = 'none';
        previewedAvatarData = null;
        if (!file) return;
        try {
            showNotification('正在处理图片...', 'info');
            const compressed = await compressImage(file, true);
            previewedAvatarData = compressed;
            avatarPreview.src = compressed;
            avatarPreview.style.display = 'block';
            uploadButton.disabled = false;
            showNotification('预览生成成功', 'success');
        } catch (e) {
            showNotification(`处理失败: ${e.message || '未知错误'}`, 'error');
            avatarInput.value = '';
        }
    };

    uploadButton.onclick = () => {
        if (!previewedAvatarData) {
            showNotification('请先选择图片', 'error');
            return;
        }
        try {
            localStorage.setItem('userAvatar', previewedAvatarData);
            profileAvatar.src = previewedAvatarData;
            showNotification('头像更新成功', 'success');
            avatarInput.value = '';
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
            uploadButton.disabled = true;
            previewedAvatarData = null;
        } catch (e) {
            showNotification(`保存失败: ${e.message || '未知错误'}`, 'error');
        }
    };
}

// --- 文章和评论渲染 ---
async function saveData() {
    console.log("内存数据已更新:", { articles, comments });
    showNotification('更改已在内存中更新（刷新后丢失）', 'info');
}

function renderArticles(filteredArticles, query = '', page = 1, perPage = 5) {
    const articleList = document.querySelector('.article-list');
    if (!articleList) return;
    const existingPagination = document.querySelector('.pagination');
    if (existingPagination) existingPagination.remove();
    articleList.innerHTML = '';
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedArticles = filteredArticles.slice(start, end);
    if (paginatedArticles.length === 0) {
        articleList.innerHTML = `<div class="empty animate-on-scroll">${page === 1 ? '没有找到匹配的文章！' : '已到达最后一页。'}</div>`;
        initializeScrollAnimations();
        return;
    }
    paginatedArticles.forEach(article => {
        if (!article || !article.id) return;
        const div = document.createElement('div');
        div.className = 'article animate-on-scroll';
        const summary = (article.content || '').replace(/\n/g, ' ').substring(0, 120) + ((article.content || '').length > 120 ? '...' : '');
        const imageSrc = (Array.isArray(article.images) && article.images[0]) ? article.images[0] : '';
        div.innerHTML = `
            <img src="${imageSrc}" alt="${imageSrc ? (article.title || '文章') + ' 图片' : '无图片'}" ${imageSrc ? '' : 'style="display:none;"'} onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display:${imageSrc ? 'none' : 'flex'}; width: 200px; height: 130px; background:#eee; align-items: center; justify-content:center; text-align:center; line-height:1.2; color:#aaa; font-size:12px; border-radius: 6px;">图片加载失败</div>
            <div class="content">
                <h2><a href="#article/${article.id}" class="article-link" data-id="${article.id}">${highlightText(article.title || '无题', query)}</a></h2>
                <p>${highlightText(summary, query)}</p>
                <p>分类: ${article.category || '其他'} | 日期: ${article.date || '未知'}</p>
                <div class="article-actions">
                    <button class="edit-button" data-id="${article.id}" title="编辑文章">编辑</button>
                    <button class="delete-button" data-id="${article.id}" title="删除文章">删除</button>
                </div>
            </div>`;
        articleList.appendChild(div);
        const img = div.querySelector('img');
        if (img && imageSrc) {
            img.style.cursor = 'pointer';
            img.onclick = (e) => {
                e.stopPropagation();
                showImageModal(imageSrc);
            };
        }
    });
    const totalPages = Math.ceil(filteredArticles.length / perPage);
    if (totalPages > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination animate-on-scroll';
        pagination.innerHTML = page > 1
            ? `<button data-page="${page - 1}" title="上一页">«</button>`
            : `<button disabled title="已是首页">«</button>`;
        const maxPages = 5;
        let startPage = Math.max(1, page - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);
        if (endPage - startPage + 1 < maxPages) startPage = Math.max(1, endPage - maxPages + 1);
        if (startPage > 1) {
            pagination.innerHTML += `<button data-page="1">1</button>`;
            if (startPage > 2) pagination.innerHTML += `<span>...</span>`;
        }
        for (let i = startPage; i <= endPage; i++) {
            pagination.innerHTML += `<button ${i === page ? 'class="active"' : ''} data-page="${i}">${i}</button>`;
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pagination.innerHTML += `<span>...</span>`;
            pagination.innerHTML += `<button data-page="${totalPages}">${totalPages}</button>`;
        }
        pagination.innerHTML += page < totalPages
            ? `<button data-page="${page + 1}" title="下一页">»</button>`
            : `<button disabled title="已是末页">»</button>`;
        articleList.insertAdjacentElement('afterend', pagination);
    }
    initializeScrollAnimations();
}

async function showEditForm(articleId) {
    disconnectScrollAnimations();
    const article = articles.find(a => String(a.id) === String(articleId));
    if (!article) {
        showNotification('未找到文章', 'error');
        window.location.hash = '#home';
        return;
    }
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = `
        <div class="animate-on-scroll">
            <h1>编辑文章</h1>
            <form id="editArticleForm" class="edit-article-form" novalidate>
                <label for="articleTitle">标题:</label>
                <input type="text" id="articleTitle" value="${article.title || ''}" required>
                <label for="articleCategory">分类:</label>
                <select id="articleCategory" required>
                    ${categories.map(cat => `<option value="${cat}" ${cat === article.category ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
                <label for="articleContent">内容:</label>
                <textarea id="articleContent" required>${article.content || ''}</textarea>
                <label for="articleImage">图片（最多5张）:</label>
                <input type="file" id="articleImage" accept="image/jpeg,image/png" multiple>
                <div class="image-preview" id="imagePreview"></div>
                <div style="display:flex;gap:10px;margin-top:10px;">
                    <button type="submit">保存更改</button>
                    <button type="button" id="cancelEditButton">取消</button>
                </div>
            </form>
        </div>`;
    const previewContainer = content.querySelector('#imagePreview');
    const imageInput = content.querySelector('#articleImage');
    let currentImages = [...(article.images || [])];

    function renderPreviews() {
        previewContainer.innerHTML = '';
        currentImages.forEach((src, idx) => {
            const div = document.createElement('div');
            div.className = 'image-container';
            div.innerHTML = `
                <img src="${src}" alt="预览图片${idx + 1}" onerror="this.alt='图片加载失败';this.parentNode.style.display='none';">
                <button type="button" class="delete-image" data-index="${idx}" title="删除图片">×</button>`;
            previewContainer.appendChild(div);
            const imgTag = div.querySelector('img');
            if (imgTag) imgTag.onclick = () => showImageModal(src);
            div.querySelector('.delete-image').onclick = (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                if (!isNaN(index) && index < currentImages.length) {
                    currentImages.splice(index, 1);
                    renderPreviews();
                }
            };
        });
        if (currentImages.length === 0) previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">暂无图片</p>';
    }
    renderPreviews();

    let newFiles = [];
    imageInput.onchange = async function() {
        const files = Array.from(this.files);
        if (files.length === 0) return;
        if (files.length + currentImages.length > 5) {
            showNotification(`最多可上传5张图片（当前已有${currentImages.length}张）`, 'error');
            this.value = '';
            return;
        }
        newFiles = files;
        previewContainer.querySelectorAll('.new-preview').forEach(el => el.remove());
        if (currentImages.length === 0 && previewContainer.querySelector('p')) previewContainer.innerHTML = '';
        for (const file of newFiles) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.createElement('div');
                    container.className = 'image-container new-preview';
                    container.innerHTML = `
                        <img src="${e.target.result}" alt="新上传预览">
                        <span style="position:absolute;top:0;left:0;background:rgba(106,142,174,0.7);color:white;font-size:10px;padding:1px 3px;border-radius:3px;">新</span>`;
                    previewContainer.appendChild(container);
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error("预览生成错误:", err);
            }
        }
        showNotification(`已选择${files.length}张新图片，保存后生效`, 'info');
    };

    const form = content.querySelector('#editArticleForm');
    form.onsubmit = async function(e) {
        e.preventDefault();
        const title = document.getElementById('articleTitle').value.trim();
        const category = document.getElementById('articleCategory').value;
        const text = document.getElementById('articleContent').value.trim();
        if (!title || !category || !text) {
            showNotification('标题、分类和内容不能为空', 'error');
            return;
        }
        let newCompressedImages = [];
        if (newFiles.length > 0) {
            showNotification('正在处理图片...', 'info');
            const promises = newFiles.map(f => compressImage(f, false).catch(err => {
                showNotification(`图片${f.name}处理失败: ${err.message}`, 'error');
                return null;
            }));
            newCompressedImages = (await Promise.all(promises)).filter(r => r !== null);
            newFiles = [];
        }
        const finalImages = [...currentImages, ...newCompressedImages];
        if (finalImages.length > 5) {
            showNotification(`图片总数（${finalImages.length}）超过5张限制`, 'error');
            return;
        }
        const index = articles.findIndex(a => String(a.id) === String(articleId));
        if (index !== -1) {
            articles[index] = { ...articles[index], title, category, content: text, images: finalImages, date: new Date().toISOString().split('T')[0] };
            await saveData();
            showNotification('文章更新成功', 'success');
            window.location.hash = `#article/${articleId}`;
        } else {
            showNotification('更新失败：未找到文章', 'error');
        }
    };

    content.querySelector('#cancelEditButton').onclick = () => {
        if (confirm('确定取消编辑？更改将不会保存。')) window.location.hash = `#article/${articleId}`;
    };
    initializeScrollAnimations();
}

function showHome() {
    disconnectScrollAnimations();
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = `
        <h1 class="animate-on-scroll">文章列表</h1>
        <div class="filters animate-on-scroll" style="animation-delay: 0.05s;">
            <select id="categoryFilter" title="按分类筛选">
                <option value="">所有分类</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <input type="text" id="searchInput" placeholder="搜索文章..." title="输入关键词搜索">
        </div>
        <details class="new-article-toggle animate-on-scroll" style="animation-delay: 0.1s;">
            <summary>发布新文章 »</summary>
            <form id="newArticleForm" class="new-article-form" novalidate>
                <label for="articleTitle">标题:</label>
                <input type="text" id="articleTitle" required>
                <label for="articleCategory">分类:</label>
                <select id="articleCategory" required>
                    <option value="" disabled selected>选择分类</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <label for="articleContent">内容:</label>
                <textarea id="articleContent" required></textarea>
                <label for="articleImage">图片（最多5张）:</label>
                <input type="file" id="articleImage" accept="image/jpeg,image/png" multiple>
                <div class="image-preview" id="imagePreview">
                    <p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>
                </div>
                <button type="submit">发布文章</button>
            </form>
        </details>
        <div class="article-list"></div>`;
    const categoryFilter = content.querySelector('#categoryFilter');
    const searchInput = content.querySelector('#searchInput');
    let currentPage = 1;

    window.updateArticles = (page = 1) => {
        currentPage = page;
        const category = categoryFilter ? categoryFilter.value : '';
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let filteredArticles = [...articles].reverse();
        if (category) filteredArticles = filteredArticles.filter(a => a.category === category);
        if (query) filteredArticles = filteredArticles.filter(a => (a.title || '').toLowerCase().includes(query) || (a.content || '').toLowerCase().includes(query));
        renderArticles(filteredArticles, query, page);
    };

    if (categoryFilter) categoryFilter.onchange = () => window.updateArticles(1);
    if (searchInput) {
        searchInput.oninput = () => {
            window.updateArticles(1);
            const query = searchInput.value.toLowerCase();
            const suggestionsContainer = searchInput.parentNode;
            let suggestions = suggestionsContainer.querySelector('.search-suggestions');
            if (suggestions) suggestions.remove();
            if (!query) return;
            suggestions = document.createElement('div');
            suggestions.className = 'search-suggestions';
            const matches = articles.filter(a => (a.title || '').toLowerCase().includes(query)).slice(0, 5);
            if (matches.length) {
                suggestions.innerHTML = matches.map(a => `<div class="suggestion" title="${a.title || ''}">${highlightText(a.title || '无题', query)}</div>`).join('');
                suggestionsContainer.appendChild(suggestions);
                suggestions.querySelectorAll('.suggestion').forEach(el => {
                    el.onclick = () => {
                        const originalTitle = el.getAttribute('title') || el.textContent;
                        searchInput.value = originalTitle;
                        suggestions.remove();
                        window.updateArticles(1);
                    };
                });
            }
        };
        searchInput.onblur = () => {
            setTimeout(() => {
                const suggestions = searchInput.parentNode.querySelector('.search-suggestions');
                if (suggestions && !suggestions.matches(':hover')) suggestions.remove();
            }, 150);
        };
    }

    const newArticleForm = content.querySelector('#newArticleForm');
    if (newArticleForm) {
        const imageInput = newArticleForm.querySelector('#articleImage');
        const previewContainer = newArticleForm.querySelector('#imagePreview');
        let newArticleFiles = [];
        if (imageInput && previewContainer) {
            imageInput.onchange = async function() {
                newArticleFiles = Array.from(this.files);
                previewContainer.innerHTML = '';
                if (newArticleFiles.length > 5) {
                    showNotification('最多可上传5张图片', 'error');
                    this.value = '';
                    newArticleFiles = [];
                    previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
                    return;
                }
                if (newArticleFiles.length > 0) {
                    for (const file of newArticleFiles) {
                        try {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const img = document.createElement('img');
                                img.src = e.target.result;
                                img.alt = "新图片预览";
                                img.style.cssText = 'max-width:80px; max-height:80px; border-radius:4px; margin:5px;';
                                previewContainer.appendChild(img);
                            };
                            reader.readAsDataURL(file);
                        } catch (err) {
                            console.error("预览生成错误:", err);
                            showNotification(`无法预览图片 ${file.name}`, 'error');
                        }
                    }
                } else {
                    previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
                }
            };
        }
        newArticleForm.onsubmit = async function(e) {
            e.preventDefault();
            const titleInput = document.getElementById('articleTitle');
            const categoryInput = document.getElementById('articleCategory');
            const contentInput = document.getElementById('articleContent');
            const title = titleInput ? titleInput.value.trim() : '';
            const category = categoryInput ? categoryInput.value : '';
            const text = contentInput ? contentInput.value.trim() : '';
            if (!title || !category || !text) {
                showNotification('请填写标题、分类和内容', 'error');
                return;
            }
            let compressedImages = [];
            if (newArticleFiles.length > 0) {
                showNotification('正在处理图片...', 'info');
                const promises = newArticleFiles.map(f => compressImage(f, false).catch(err => {
                    showNotification(`图片${f.name}处理失败: ${err.message}`, 'error');
                    return null;
                }));
                compressedImages = (await Promise.all(promises)).filter(i => i !== null);
                newArticleFiles = [];
            }
            const date = new Date().toISOString().split('T')[0];
            const newId = Date.now().toString();
            articles.push({ id: newId, title, category, content: text, date, images: compressedImages });
            await saveData();
            newArticleForm.reset();
            if (previewContainer) previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">选择图片后显示预览</p>';
            const details = content.querySelector('.new-article-toggle');
            if (details) details.open = false;
            showNotification('文章发布成功', 'success');
            window.updateArticles(1);
        };
    }
    window.updateArticles(1);
}

async function showArticle(articleId) {
    disconnectScrollAnimations();
    const article = articles.find(a => String(a.id) === String(articleId));
    if (!article) {
        showNotification('未找到文章', 'error');
        window.location.hash = '#home';
        return;
    }
    const content = document.getElementById('content');
    if (!content) return;
    const paragraphs = (article.content || '').split('\n').filter(p => p.trim().length > 0);
    const contentHtml = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    content.innerHTML = `
        <div class="article-page" data-article-id="${articleId}">
            <h1 class="animate-on-scroll">${article.title || '无题'}</h1>
            <p class="animate-on-scroll" style="animation-delay:0.1s;">分类: ${article.category || '未分类'} | 日期: ${article.date || '未知'}</p>
            ${(Array.isArray(article.images) && article.images.length > 0) ? `
                <div class="gallery animate-on-scroll" style="animation-delay:0.2s;">
                    ${article.images.length > 1 ? '<button class="prev" title="上一张">◄</button>' : ''}
                    <img src="${article.images[0]}" alt="${article.title || '文章'} 图片1" onerror="this.alt='图片加载失败';this.style.display='none';">
                    ${article.images.length > 1 ? '<button class="next" title="下一张">►</button>' : ''}
                    ${article.images.length > 1 ? `<div class="counter">1/${article.images.length}</div>` : ''}
                </div>` : ''}
            <div class="article-content animate-on-scroll" style="animation-delay:0.3s;">${contentHtml}</div>
            <hr>
            <h2>评论区</h2>
            <div class="comments"></div>
            <form id="commentForm" novalidate class="animate-on-scroll" style="animation-delay:0.4s;">
                <h3>发表评论</h3>
                <label for="commentName">你的名字:</label>
                <input type="text" id="commentName" placeholder="访客" required>
                <label for="commentText">评论内容:</label>
                <textarea id="commentText" placeholder="输入你的评论..." required></textarea>
                <button type="submit">提交评论</button>
            </form>
        </div>`;

    // 初始化评论者名字
    const commentNameInput = content.querySelector('#commentName');
    try {
        const savedName = localStorage.getItem('commenterName');
        if (savedName && commentNameInput) commentNameInput.value = savedName;
    } catch (e) {}

    // 渲染评论
    const commentsContainer = content.querySelector('.comments');
    function renderComments(parentId = null, level = 0) {
        const filteredComments = comments.filter(c => String(c.articleId) === String(articleId) && String(c.parentId) === String(parentId));
        filteredComments.forEach((comment, index) => {
            const div = document.createElement('div');
            div.className = 'comment animate-on-scroll';
            div.style.marginLeft = `${level * 20}px`;
            div.style.setProperty('--comment-index', index);
            div.innerHTML = `
                <p><strong>${comment.name || '匿名'}</strong>${comment.comment}</p>
                <small>发表于 ${comment.date || '未知'}</small>
                <button class="reply-button" data-comment-id="${comment.id}" data-comment-name="${comment.name || '匿名'}" title="回复此评论">回复</button>
                <button class="delete-comment-button" data-comment-id="${comment.id}" title="删除评论">删除</button>
                <div id="reply-form-container-${comment.id}" class="reply-form-container" style="display:none;"></div>`;
            commentsContainer.appendChild(div);
            renderComments(comment.id, level + 1);
        });
    }
    renderComments();

    // 图库导航
    const gallery = content.querySelector('.gallery');
    if (gallery && article.images.length > 1) {
        let currentIndex = 0;
        const img = gallery.querySelector('img');
        const counter = gallery.querySelector('.counter');
        const prevBtn = gallery.querySelector('.prev');
        const nextBtn = gallery.querySelector('.next');
        function updateGallery() {
            img.src = article.images[currentIndex];
            img.alt = `${article.title || '文章'} 图片${currentIndex + 1}`;
            counter.textContent = `${currentIndex + 1}/${article.images.length}`;
            img.onerror = () => {
                img.alt = '图片加载失败';
                img.style.display = 'none';
            };
        }
        if (prevBtn) prevBtn.onclick = () => {
            currentIndex = (currentIndex - 1 + article.images.length) % article.images.length;
            updateGallery();
        };
        if (nextBtn) nextBtn.onclick = () => {
            currentIndex = (currentIndex + 1) % article.images.length;
            updateGallery();
        };
        if (img) img.onclick = () => showImageModal(article.images[currentIndex]);
    }

    // 评论提交
    const commentForm = content.querySelector('#commentForm');
    if (commentForm) {
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = commentNameInput.value.trim();
            const text = content.querySelector('#commentText').value.trim();
            if (!name || !text) {
                showNotification('请填写名字和评论内容', 'error');
                return;
            }
            const date = new Date().toISOString().split('T')[0];
            const commentId = Date.now().toString();
            comments.push({ id: commentId, articleId: String(articleId), name, comment: text, date, parentId: null });
            try {
                localStorage.setItem('commenterName', name);
            } catch (e) {}
            await saveData();
            showNotification('评论提交成功', 'success');
            commentForm.reset();
            commentNameInput.value = name;
            showArticle(articleId);
        };
    }
    initializeScrollAnimations();
}

async function deleteComment(commentId, articleId) {
    if (!confirm('确定删除此评论？（包括其所有回复，仅限当前会话）')) return;
    const removeCommentAndReplies = (id) => {
        comments = comments.filter(c => String(c.id) !== String(id));
        const childComments = comments.filter(c => String(c.parentId) === String(id));
        childComments.forEach(child => removeCommentAndReplies(child.id));
    };
    removeCommentAndReplies(commentId);
    await saveData();
    showNotification('评论已删除', 'success');
    showArticle(articleId);
}

async function globalActionsHandler(e) {
    const content = document.getElementById('content');

    if (!e.target.closest('.filters') && !e.target.closest('.search-suggestions')) {
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) suggestions.remove();
    }

    if (!content || !content.contains(e.target)) return;

    if (e.target.matches('.pagination button') && !e.target.disabled) {
        const page = parseInt(e.target.dataset.page);
        if (!isNaN(page) && window.updateArticles) {
            window.updateArticles(page);
            const listTop = content.querySelector('.article-list')?.offsetTop || content.offsetTop;
            window.scrollTo({ top: listTop - 70, behavior: 'smooth' });
        }
        return;
    }

    if (e.target.classList.contains('edit-button')) {
        const articleId = e.target.dataset.id;
        if (articleId) window.location.hash = `#edit/${articleId}`;
        return;
    }

    if (e.target.classList.contains('delete-button')) {
        const articleId = e.target.dataset.id;
        if (!articleId) return;
        const article = articles.find(a => String(a.id) === String(articleId));
        const msg = `确定删除文章 "${article ? article.title : '此文章'}"？\n（仅限当前会话）`;
        if (window.confirm(msg)) {
            articles = articles.filter(a => String(a.id) !== String(articleId));
            comments = comments.filter(c => String(c.articleId) !== String(articleId));
            await saveData();
            const currPageInput = document.querySelector('.pagination button.active');
            const currPageNum = currPageInput ? parseInt(currPageInput.dataset.page) : 1;
            const catFilter = document.getElementById('categoryFilter');
            const searchInput = document.getElementById('searchInput');
            const category = catFilter ? catFilter.value : '';
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            let filteredArticles = [...articles].reverse();
            if (category) filteredArticles = filteredArticles.filter(a => a.category === category);
            if (query) filteredArticles = filteredArticles.filter(a => (a.title || '').toLowerCase().includes(query) || (a.content || '').toLowerCase().includes(query));
            const itemsPerPage = 5;
            const articlesOnPage = filteredArticles.slice((currPageNum - 1) * itemsPerPage, currPageNum * itemsPerPage).length;
            const pageToRefresh = (articlesOnPage === 0 && currPageNum > 1) ? currPageNum - 1 : currPageNum;
            if (window.updateArticles) window.updateArticles(pageToRefresh);
            showNotification('文章已删除', 'success');
        }
        return;
    }

    if (e.target.classList.contains('reply-button')) {
        const parentCommentId = e.target.dataset.commentId;
        const parentCommentName = e.target.dataset.commentName;
        openInlineReplyForm(parentCommentId, parentCommentName, e.target.closest('.comment'));
        return;
    }

    if (e.target.classList.contains('submit-reply')) {
        e.preventDefault();
        const form = e.target.closest('.inline-reply-form');
        if (form) handleInlineReplySubmit(form);
        return;
    }

    if (e.target.classList.contains('cancel-reply')) {
        e.preventDefault();
        const formContainer = e.target.closest('.reply-form-container');
        if (formContainer) closeInlineReplyForm(formContainer);
        return;
    }

    if (e.target.classList.contains('delete-comment-button')) {
        const commentId = e.target.dataset.commentId;
        const articleId = document.querySelector('.article-page')?.dataset.articleId;
        if (commentId && articleId) {
            await deleteComment(commentId, articleId);
        }
        return;
    }
}

// === Inline Reply Form Functions ===
function closeInlineReplyForm(formContainer = null) {
    const containerToClose = formContainer || currentOpenReplyForm;
    if (containerToClose) {
        containerToClose.innerHTML = '';
        containerToClose.style.display = 'none';
    }
    currentOpenReplyForm = null;
}

function openInlineReplyForm(parentId, parentName, parentCommentElement) {
    closeInlineReplyForm();
    const containerId = `reply-form-container-${parentId}`;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'reply-form-container';
        container.style.display = 'none';
        parentCommentElement.appendChild(container);
    }
    let commenterName = '';
    try {
        commenterName = localStorage.getItem('commenterName') || '';
    } catch (e) {}
    container.innerHTML = `
        <form class="inline-reply-form" data-parent-id="${parentId}">
            <label for="inlineReplyName-${parentId}">你的名字:</label>
            <input type="text" id="inlineReplyName-${parentId}" value="${commenterName}" placeholder="访客" required>
            <label for="inlineReplyText-${parentId}">回复 @${parentName}:</label>
            <textarea id="inlineReplyText-${parentId}" placeholder="输入你的回复..." required></textarea>
            <div class="reply-form-actions">
                <button type="submit" class="submit-reply">提交回复</button>
                <button type="button" class="cancel-reply">取消</button>
            </div>
        </form>`;
    container.style.display = 'block';
    currentOpenReplyForm = container;
    const textarea = container.querySelector('textarea');
    if (textarea) textarea.focus();
}

async function handleInlineReplySubmit(formElement) {
    const parentId = formElement.dataset.parentId;
    const nameInput = formElement.querySelector('input[type="text"]');
    const commentTextarea = formElement.querySelector('textarea');
    const articleId = document.querySelector('.article-page')?.dataset.articleId;
    if (!parentId || !nameInput || !commentTextarea || !articleId) {
        showNotification('提交回复失败：缺少必要信息', 'error');
        return;
    }
    const name = nameInput.value.trim();
    const commentText = commentTextarea.value.trim();
    if (!name || !commentText) {
        showNotification('请填写名字和回复内容', 'error');
        return;
    }
    const date = new Date().toISOString().split('T')[0];
    const commentId = Date.now().toString();
    comments.push({
        id: commentId,
        articleId: String(articleId),
        name,
        comment: commentText,
        date,
        parentId
    });
    try {
        localStorage.setItem('commenterName', name);
    } catch (e) {}
    await saveData();
    showNotification('回复提交成功', 'success');
    showArticle(articleId);
}

// --- 关于页面 ---
function showAbout() {
    disconnectScrollAnimations();
    const content = document.getElementById('content');
    if (!content) return;
    content.innerHTML = `
        <div class="about-page animate-on-scroll">
            <h1>关于我</h1>
            <p>你好！我是 Kazama_Suichiku，一个热爱游戏开发与技术美术的独立学习者。</p>
            <p>在这里，我分享我的学习笔记、技术探索，以及生活中的点滴感悟。无论是深入研究着色器（Shader）、程序化内容生成，还是记录一个安静的午后，我都希望这些内容能给你带来灵感或共鸣。</p>
            <p>我的兴趣包括但不限于：</p>
            <ul>
                <li><strong>游戏开发</strong>：熟悉 Unreal Engine、Unity，专注于实时渲染与视觉效果。</li>
                <li><strong>技术美术</strong>：探索 Shader 编写、程序化纹理、粒子系统等。</li>
                <li><strong>生活记录</strong>：用文字捕捉日常中的小确幸。</li>
            </ul>
            <p>欢迎通过我的 <a href="https://www.zhihu.com/people/48-52-52-27-65" target="_blank" rel="noopener noreferrer">知乎</a>、<a href="https://space.bilibili.com/56807642" target="_blank" rel="noopener noreferrer">Bilibili</a> 或 <a href="https://github.com/Kazama-Suichiku" target="_blank" rel="noopener noreferrer">GitHub</a> 与我交流！</p>
            <p>愿我们都能在学习的旅途中不断成长，享受创造的乐趣！</p>
        </div>`;
    initializeScrollAnimations();
}

// --- 路由处理 ---
function handleRoute() {
    const hash = window.location.hash || '#home';
    const content = document.getElementById('content');
    if (!content) return;

    disconnectScrollAnimations();
    content.innerHTML = '<p style="text-align:center; padding: 50px; color: #888;">加载中...</p>';

    if (hash.startsWith('#article/')) {
        const articleId = hash.replace('#article/', '');
        showArticle(articleId);
    } else if (hash.startsWith('#edit/')) {
        const articleId = hash.replace('#edit/', '');
        showEditForm(articleId);
    } else if (hash === '#about') {
        showAbout();
    } else {
        showHome();
    }
}

// --- 返回顶部按钮 ---
function initializeBackToTop() {
    const button = document.querySelector('.back-to-top');
    if (!button) return;
    const toggleButton = () => {
        if (window.scrollY > 300) {
            button.classList.add('visible');
        } else {
            button.classList.remove('visible');
        }
    };
    window.addEventListener('scroll', toggleButton);
    button.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

// --- 初始化 ---
function initialize() {
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    initializeTheme();

    setTimeout(initializeParticles, 100);

    initAvatarUpload();
    loadAvatar();

    handleRoute();
    window.addEventListener('hashchange', handleRoute);

    initializeBackToTop();

    document.addEventListener('click', globalActionsHandler);

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.article-link');
        if (link) {
            e.preventDefault();
            const articleId = link.dataset.id;
            if (articleId) window.location.hash = `#article/${articleId}`;
        }
    });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initialize);