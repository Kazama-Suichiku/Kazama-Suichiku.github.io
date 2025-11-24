// --- 静态数据 ---
let articles = [];
let comments = [];
const categories = ['技术', '生活', '其他'];

// --- 全局变量 ---
let previewedAvatarData = null;
let intersectionObserver = null;
let currentOpenReplyForm = null;
// 用于保存鼠标视差（parallax）事件处理器，便于重新初始化时清理
let particleParallaxHandler = null;
// 用于节流视差更新
let particleParallaxRaf = null;

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
    // 切换高亮主题
    toggleHighlightTheme();
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

    // 获取当前主题颜色
    const isDark = document.documentElement.classList.contains('dark-mode');
    const primaryColor = isDark ? '#92c1de' : '#5a7d9a';
    const secondaryColor = isDark ? '#d8b593' : '#c89b70';

    // 清理上一次可能绑定的视差处理器，避免重复绑定
    if (particleParallaxHandler) {
        window.removeEventListener('mousemove', particleParallaxHandler);
        particleParallaxHandler = null;
    }

    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: [primaryColor, secondaryColor, '#ffffff'] },
            shape: { type: 'circle', stroke: { width: 0.5, color: 'rgba(255,255,255,0.08)' } },
            opacity: {
                value: 0.7,
                random: true,
                anim: { enable: true, speed: 1.2, opacity_min: 0.08, sync: false }
            },
            size: {
                value: 4,
                random: true,
                anim: { enable: true, speed: 2, size_min: 0.5, sync: false }
            },
            line_linked: {
                enable: true,
                distance: 160,
                color: primaryColor,
                opacity: 0.22,
                width: 1
            },
            move: {
                enable: true,
                speed: 0.9,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'window',
            events: {
                onhover: { enable: true, mode: ['grab', 'bubble'] },
                onclick: { enable: true, mode: ['push', 'bubble'] },
                resize: true
            },
            modes: {
                grab: { distance: 140, line_linked: { opacity: 0.85 } },
                bubble: { distance: 180, size: 12, duration: 0.8, opacity: 0.95 },
                push: { particles_nb: 4 },
                repulse: { distance: 120, duration: 0.6 }
            }
        },
        retina_detect: true
    });

    // 添加一个轻量的视差效果：根据鼠标位置平移画布，配合低速粒子移动产生深度感
    const canvasEl = document.getElementById('particles-js');
    // 在移动设备上或宽度小于700px时禁用视差与粒子以节约性能
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch || window.innerWidth < 700) {
        // 停用粒子移动与视差：让粒子静止或直接不初始化
        try { window.pJSDom && window.pJSDom.forEach(p => p.pJS.fn.vendors.destroypJS()); } catch(e){}
        return;
    }
    if (canvasEl) {
        // 使用 requestAnimationFrame 节流视差更新
        particleParallaxHandler = (e) => {
            if (particleParallaxRaf) cancelAnimationFrame(particleParallaxRaf);
            particleParallaxRaf = requestAnimationFrame(() => {
                const w = window.innerWidth;
                const h = window.innerHeight;
                const x = (e.clientX - w / 2) / (w / 2); // -1 .. 1
                const y = (e.clientY - h / 2) / (h / 2);
                const tx = x * 8; // px
                const ty = y * 6; // px
                canvasEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            });
        };
        window.addEventListener('mousemove', particleParallaxHandler);
    }

    console.log('粒子动画已初始化（美化版）');
}

// --- Markdown 渲染优化: 使用 highlight.js 高亮代码块，并为图片/链接添加增强 ---
try {
    if (window.marked && window.hljs) {
        marked.setOptions({
            highlight: function(code, lang) {
                try {
                    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, {language: lang}).value;
                    return hljs.highlightAuto(code).value;
                } catch (e) {
                    return hljs.highlightAuto(code).value;
                }
            },
            langPrefix: 'hljs language-'
        });
    }
} catch (e) {}

function toggleHighlightTheme() {
    try {
        const light = document.getElementById('hl-theme-light');
        const dark = document.getElementById('hl-theme-dark');
        const isDark = document.documentElement.classList.contains('dark-mode');
        if (light && dark) {
            light.disabled = isDark;
            dark.disabled = !isDark;
        }
    } catch (e) {}
}

// 初次设置高亮主题
try { toggleHighlightTheme(); } catch(e) {}

function enhanceRenderedMarkdown(container) {
    if (!container) return;
    // 1) 代码高亮（如果 highlight.js 已加载）
    try { if (window.hljs) container.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block)); } catch(e) {}
    // 2) 图片懒加载并绑定 lightbox
    container.querySelectorAll('img').forEach(img => {
        // 支持 LQIP：如果元素有 data-lqip 属性，先用低质量占位，待大图 load 完成再淡入
        const src = img.getAttribute('src');
        const lqip = img.getAttribute('data-lqip');
        if (lqip) {
            img.style.filter = 'blur(6px)';
            img.style.transition = 'filter 400ms ease, opacity 400ms ease';
            img.src = lqip;
            const fullImg = new Image();
            fullImg.onload = () => {
                img.src = src;
                img.style.filter = 'blur(0)';
                img.style.opacity = '1';
            };
            fullImg.src = src;
        }
        if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
        img.style.cursor = 'zoom-in';
        img.onclick = (e) => { e.stopPropagation(); showImageModal(img.src); };
        // 优雅淡入
        img.style.opacity = img.style.opacity || '1';
    });
    // 3) 外部链接在新标签打开并加 noopener
    container.querySelectorAll('a').forEach(a => {
        try {
            const href = a.getAttribute('href') || '';
            if (href.startsWith('http') && !href.includes(location.host)) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        } catch (e) {}
    });

    // 4) 为代码块添加复制按钮
    container.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.copy-code-btn')) return; // 防止重复插入
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-code-btn';
        btn.setAttribute('aria-label', '复制代码');
        btn.innerHTML = '复制';
        btn.onclick = async () => {
            try {
                const code = pre.querySelector('code');
                const text = code ? code.innerText : pre.innerText;
                await navigator.clipboard.writeText(text);
                btn.textContent = '已复制';
                setTimeout(() => btn.textContent = '复制', 1200);
            } catch (e) {
                btn.textContent = '复制失败';
                setTimeout(() => btn.textContent = '复制', 1200);
            }
        };
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });

    // 5) 生成简单的 TOC（h1-h3）并插入到文章顶部（若不存在）
    const article = container.closest('.article-page');
    if (article) {
        let toc = article.querySelector('.article-toc');
        if (!toc) {
            const headings = container.querySelectorAll('h1,h2,h3');
            if (headings.length > 1) {
                toc = document.createElement('nav');
                toc.className = 'article-toc';
                let html = '<strong>目录</strong><ul>';
                headings.forEach(h => {
                    if (!h.id) h.id = 'h-' + Math.random().toString(36).slice(2,8);
                    const level = parseInt(h.tagName.substring(1),10);
                    html += `<li class="toc-level-${level}"><a href="#${h.id}">${h.textContent}</a></li>`;
                });
                html += '</ul>';
                toc.innerHTML = html;
                article.insertBefore(toc, article.firstChild);
            }
        }
    }
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
// 邮箱转firebase安全key
function emailToKey(email) {
    return String(email).replace(/\./g, '_');
}

function loadAvatar() {
    const profileAvatar = document.getElementById('profileAvatar');
    const uploadSection = document.getElementById('avatarUploadSection');
    if (!profileAvatar || !uploadSection) return;
    if (currentUser) {
        // 登录用户：从firebase加载头像（用UID）
        db.ref('avatars/Y48yvlcBXEbrhLH3ZMk4ad9KbU32').once('value').then(snap => {
            const val = snap.val();
            if (val) {
                profileAvatar.src = val;
                profileAvatar.style.background = '';
            } else {
                profileAvatar.src = '';
                profileAvatar.style.background = 'linear-gradient(135deg, #7fd7e7 0%, #b4e19e 100%)';
            }
        });
        uploadSection.style.display = '';
    } else {
        // 未登录时显示专属头像（不可编辑，UID固定）
        db.ref('avatars/Y48yvlcBXEbrhLH3ZMk4ad9KbU32').once('value').then(snap => {
            const val = snap.val();
            if (val) {
                profileAvatar.src = val;
                profileAvatar.style.background = '';
            } else {
                profileAvatar.src = '';
                profileAvatar.style.background = 'linear-gradient(135deg, #7fd7e7 0%, #b4e19e 100%)';
            }
        });
        uploadSection.style.display = 'none';
        return;
    }
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
        if (!currentUser) return; // 未登录禁止上传
        avatarInput.click();
    };
    avatarLabel.addEventListener('click', triggerFileInput);

    avatarInput.onchange = async () => {
        if (!currentUser) return;
        const file = avatarInput.files ? avatarInput.files[0] : null;
        uploadButton.disabled = true;
        avatarPreview.style.display = 'none';
        previewedAvatarData = null;
        if (!file) return;
        // 类型和大小前置校验
        if (!file.type.match(/image\/(jpeg|png)/)) {
            showNotification('仅支持JPG/PNG格式头像', 'error');
            avatarInput.value = '';
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showNotification('头像需小于2MB', 'error');
            avatarInput.value = '';
            return;
        }
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

    uploadButton.onclick = async () => {
        if (!currentUser || !previewedAvatarData) {
            showNotification('请先选择图片', 'error');
            return;
        }
        try {
            await db.ref('avatars/' + currentUser.uid).set(previewedAvatarData);
            profileAvatar.src = previewedAvatarData;
            profileAvatar.style.background = '';
            avatarInput.value = '';
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';
            uploadButton.disabled = true;
            previewedAvatarData = null;
            showNotification('头像已同步到云端', 'success');
        } catch (e) {
            showNotification(`保存失败: ${e.message || '未知错误'}`, 'error');
        }
    };
}

// --- 文章和评论渲染 ---
// EasyMDE 编辑器单例
let easyMDEInstance = null;

function destroyEasyMDE() {
    if (easyMDEInstance) {
        try {
            easyMDEInstance.toTextArea();
            easyMDEInstance = null;
        } catch (e) {}
    }
}

async function saveData() {
    await db.ref('articles').set(Object.fromEntries(articles.map(a => [a.id, a])));
    await db.ref('comments').set(Object.fromEntries(comments.map(c => [c.id, c])));
    showNotification('更改已同步到云端', 'success');
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
            ${imageSrc ? `<img src="${imageSrc}" alt="${(article.title || '文章') + ' 图片'}" onerror="this.style.display='none';">` : ''}
            <div style="display:none; width: 200px; height: 130px; background:#eee; align-items: center; justify-content:center; text-align:center; line-height:1.2; color:#aaa; font-size:12px; border-radius: 6px;">图片加载失败</div>
            <div class="content">
                <h2><a href="#article/${article.id}" class="article-link" data-id="${article.id}">${highlightText(article.title || '无题', query)}</a></h2>
                <p>${highlightText(summary, query)}</p>
                <p>分类: ${article.category || '其他'} | 日期: ${article.date || '未知'}</p>
                <div class="article-actions">
                    ${isAdmin() ? `<button class="edit-button" data-id="${article.id}" title="编辑文章">编辑</button><button class="delete-button" data-id="${article.id}" title="删除文章">删除</button>` : ''}
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
    if (!isAdmin()) {
        showNotification('只有管理员可以编辑文章', 'error');
        window.location.hash = '#home';
        return;
    }
    disconnectScrollAnimations();
    const article = articles.find(a => String(a.id) === String(articleId));
    if (!article) {
        showNotification('未找到文章', 'error');
        window.location.hash = '#home';
        return;
    }
    const content = document.getElementById('content');
    if (!content) return;
    // 销毁旧的 EasyMDE 实例，防止重复初始化
    destroyEasyMDE();
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
                <div style="margin:8px 0 16px 0;">
                    <input type="file" id="mdImageInput" accept="image/jpeg,image/png" style="display:none;">
                    <button type="button" id="insertMdImageBtn">插入图片到正文</button>
                </div>
                <label for="articleImage">图片（最多5张）:</label>
                <input type="file" id="articleImage" accept="image/jpeg,image/png" multiple>
                <div class="image-preview" id="imagePreview"><p style='width:100%;text-align:center;color:#888;'>图片加载中...</p></div>
                <div style="display:flex;gap:10px;margin-top:10px;">
                    <button type="submit">保存更改</button>
                    <button type="button" id="cancelEditButton">取消</button>
                </div>
            </form>
        </div>`;
    const previewContainer = content.querySelector('#imagePreview');
    const imageInput = content.querySelector('#articleImage');
    let currentImages = [...(article.images || [])];

    // 异步渲染图片预览，先显示 loading
    async function renderPreviews() {
        previewContainer.innerHTML = '<p style="width:100%;text-align:center;color:#888;">图片加载中...</p>';
        await new Promise(r => setTimeout(r, 0)); // 让UI先渲染
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

    // Markdown编辑器集成（懒加载，单例，异步初始化）
    setTimeout(() => {
        if (easyMDEInstance) destroyEasyMDE();
        easyMDEInstance = new EasyMDE({
            element: document.getElementById('articleContent'),
            spellChecker: false,
            status: false,
            minHeight: '300px',
            maxHeight: '600px',
            toolbar: [
                'bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', 'side-by-side', 'fullscreen', '|', {
                    name: 'insertImage',
                    action: function customInsertImage(editor) {
                        setTimeout(() => {
                            document.getElementById('mdImageInput').click();
                        }, 0);
                    },
                    className: 'fa fa-image',
                    title: '插入图片到正文'
                }
            ]
        });
    }, 0);

    // 图片插入到正文
    const mdImageInput = document.getElementById('mdImageInput');
    const insertMdImageBtn = document.getElementById('insertMdImageBtn');
    insertMdImageBtn.onclick = () => setTimeout(() => mdImageInput.click(), 0);
    mdImageInput.onchange = async function() {
        const file = this.files[0];
        if (!file) return;
        try {
            showNotification('正在处理图片...', 'info');
            const url = await compressImage(file, false); // 返回base64
            if (easyMDEInstance) {
                const cm = easyMDEInstance.codemirror;
                const pos = cm.getCursor();
                cm.replaceRange(`![](${url})\n`, pos);
            }
            showNotification('图片已插入正文', 'success');
        } catch (e) {
            showNotification('图片处理失败: ' + (e.message || '未知错误'), 'error');
        }
        this.value = '';
    };

    // 输入事件加防抖，减少频繁重渲染
    const titleInput = document.getElementById('articleTitle');
    let debounceTimer = null;
    titleInput.oninput = function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // 可扩展：如自动保存草稿等
        }, 300);
    };

    const form = content.querySelector('#editArticleForm');
    form.onsubmit = async function(e) {
        e.preventDefault();
        const title = document.getElementById('articleTitle').value.trim();
        const category = document.getElementById('articleCategory').value;
        const text = easyMDEInstance ? easyMDEInstance.value().trim() : document.getElementById('articleContent').value.trim();
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
            destroyEasyMDE();
            window.location.hash = `#article/${articleId}`;
        } else {
            showNotification('更新失败：未找到文章', 'error');
        }
    };

    content.querySelector('#cancelEditButton').onclick = () => {
        if (confirm('确定取消编辑？更改将不会保存。')) {
            destroyEasyMDE();
            window.location.hash = `#article/${articleId}`;
        }
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
        <div id="adminNewArticleContainer"></div>
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

    renderAdminNewArticle();
    window.updateArticles(1);
}

function renderAdminNewArticle() {
    const container = document.getElementById('adminNewArticleContainer');
    if (!container) return;
    if (isAdmin()) {
        container.innerHTML = `<details class="new-article-toggle animate-on-scroll" style="animation-delay: 0.1s;">
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
        </details>`;
        bindNewArticleForm();
    } else {
        container.innerHTML = '';
    }
}

function bindNewArticleForm() {
    const newArticleForm = document.getElementById('newArticleForm');
    if (!newArticleForm) return;
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
        const details = document.querySelector('.new-article-toggle');
        if (details) details.open = false;
        showNotification('文章发布成功', 'success');
        window.updateArticles(1);
    };
}

// === 评论渲染独立函数 ===
function renderCommentsForArticle(articleId, parentId = null, level = 0, container = null) {
    const MAX_NESTING_LEVEL = 3;
    if (!container) container = document.querySelector('.comments');
    if (!container) return;
    if (level === 0) container.innerHTML = '';
    // 修正parentId判断，兼容null、undefined、""、"null"
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
        // 兼容 comment/content 字段
        const commentText = comment.comment || comment.content || '';
        div.innerHTML = `
            <p><strong>${comment.name || '匿名'}</strong>${commentText}</p>
            <small>发表于 ${comment.date || '未知'}</small>
            ${level < MAX_NESTING_LEVEL ? `<button class="reply-button" data-comment-id="${comment.id}" data-comment-name="${comment.name || '匿名'}" title="回复此评论">回复</button>` : ''}
            ${isAdmin() ? `<button class="delete-comment-button" data-comment-id="${comment.id}" title="删除评论">删除</button>` : ''}
            <div id="reply-form-container-${comment.id}" class="reply-form-container" style="display:none;"></div>
            <div id="sub-comments-${comment.id}" class="sub-comments"></div>`;
        container.appendChild(div);
        // 关键：为回复按钮绑定事件，弹出内联回复框
        if (level < MAX_NESTING_LEVEL) {
            const replyBtn = div.querySelector('.reply-button');
            if (replyBtn) {
                replyBtn.onclick = function() {
                    openInlineReplyForm(comment.id, comment.name, div);
                };
            }
        }
        const subCommentsContainer = div.querySelector(`#sub-comments-${comment.id}`);
        if (level < MAX_NESTING_LEVEL) {
            renderCommentsForArticle(articleId, comment.id, level + 1, subCommentsContainer);
        }
    });
    initializeScrollAnimations();
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
    // 用 marked.js 渲染 Markdown，并用 DOMPurify 过滤防止 XSS
    const rawHtml = marked.parse(article.content || '');
    const contentHtml = DOMPurify.sanitize(rawHtml);
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
            <div class="comments"><p style="text-align:center;color:#888;font-size:14px;">评论加载中...</p></div>
            <form id="commentForm" novalidate class="animate-on-scroll" style="animation-delay:0.4s;">
                <h3>发表评论</h3>
                <label for="commentName">你的名字:</label>
                <input type="text" id="commentName" placeholder="访客" required>
                <label for="commentText">评论内容:</label>
                <textarea id="commentText" placeholder="输入你的评论..." required></textarea>
                <div class="char-count" id="commentCharCount">0/500</div>
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
    renderCommentsForArticle(articleId);
    // 图库导航
    const gallery = content.querySelector('.gallery');
    if (gallery && article.images.length > 1) {
        let currentIndex = 0;
        const img = gallery.querySelector('img');
        const counter = gallery.querySelector('.counter');
        const prevBtn = gallery.querySelector('.prev');
        const nextBtn = gallery.querySelector('.next');
        function updateGallery() {
            if (img) img.src = article.images[currentIndex];
            if (counter) counter.textContent = `${currentIndex + 1}/${article.images.length}`;
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
            if (text.length > 500) {
                showNotification('评论内容不能超过500字符', 'error');
                return;
            }
            const date = new Date().toISOString().split('T')[0];
            const commentId = Date.now().toString();
            const newComment = { id: commentId, articleId: String(articleId), name, comment: text, date, parentId: null };
            await saveCommentToFirebase(newComment);
            try {
                localStorage.setItem('commenterName', name);
            } catch (e) {}
            showNotification('评论提交成功', 'success');
            commentForm.reset();
            commentNameInput.value = name;
            // 关键：评论提交后刷新整个页面，确保comments数据同步
            showArticle(articleId);
        };
        // 实时字数统计
        const commentTextArea = content.querySelector('#commentText');
        const charCountDisplay = content.querySelector('#commentCharCount');
        if (commentTextArea && charCountDisplay) {
            commentTextArea.addEventListener('input', () => {
                const count = commentTextArea.value.length;
                charCountDisplay.textContent = `${count}/500`;
                charCountDisplay.style.color = count > 500 ? '#d16060' : 'inherit';
            });
        }
    }
    // 登录状态检查
    let canComment = !!currentUser;
    if (!canComment) {
        if (commentForm) commentForm.style.display = 'none';
        const tips = document.createElement('div');
        tips.className = 'comment-login-tips';
        tips.innerHTML = '请先<a href="#" id="loginToComment">登录</a>后发表评论';
        content.appendChild(tips);
        content.querySelector('#loginToComment').onclick = (e) => {
            e.preventDefault();
            showAuthModal();
        };
    }
    initializeScrollAnimations();
}

async function deleteComment(commentId, articleId) {
    if (!confirm('确定删除此评论？（包括其所有回复，仅限当前会话）')) return;
    const toDelete = [];
    function collectToDelete(id) {
        comments.filter(c => String(c.parentId) === String(id)).forEach(child => collectToDelete(child.id));
        const c = comments.find(c => c.id === id);
        if (c && c._pushId) toDelete.push(c._pushId);
    }
    collectToDelete(commentId);
    const c = comments.find(c => c.id === commentId);
    if (c && c._pushId) toDelete.push(c._pushId);
    for (const pushId of toDelete) {
        await deleteCommentFromFirebase(pushId);
    }
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
        // 支持两种 data 属性风格：firebase (data-comment-id / data-comment-name) 和 本地 (data-id / data-name)
        const parentCommentId = e.target.dataset.commentId || e.target.dataset.id;
        const parentCommentName = e.target.dataset.commentName || e.target.dataset.name;
        const closestComment = e.target.closest('.comment');
        // 如果是本地评论系统（有 data-id），使用 openReplyForm (local)；否则使用 openInlineReplyForm (firebase)
        if (e.target.dataset.id) {
            const articleId = document.querySelector('.article-page')?.dataset.articleId;
            const replyContainer = closestComment ? closestComment.querySelector('.reply-form-container') : null;
            if (replyContainer && articleId) openReplyForm(articleId, parentCommentId, parentCommentName, replyContainer);
        } else {
            openInlineReplyForm(parentCommentId, parentCommentName, closestComment);
        }
        return;
    }

    if (e.target.classList.contains('submit-reply')) {
        // 只拦截带 data-parent-id 的内联回复表单（firebase 实现），否则允许本地表单自己的提交处理
        const form = e.target.closest('.inline-reply-form');
        if (form && form.dataset && form.dataset.parentId) {
            e.preventDefault();
            handleInlineReplySubmit(form);
            return;
        }
        // 否则不拦截，让本地表单的 onsubmit 处理继续执行
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

// 修改 openInlineReplyForm，添加字数统计和字数限制
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
            <div class="char-count" id="replyCharCount-${parentId}">0/500</div>
            <div class="reply-form-actions">
                <button type="submit" class="submit-reply">提交回复</button>
                <button type="button" class="cancel-reply">取消</button>
            </div>
        </form>`;
    container.style.display = 'block';
    currentOpenReplyForm = container;
    const textarea = container.querySelector('textarea');
    const replyCharCount = container.querySelector(`#replyCharCount-${parentId}`);
    if (textarea && replyCharCount) {
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            replyCharCount.textContent = `${count}/500`;
            replyCharCount.style.color = count > 500 ? '#d16060' : 'inherit';
        });
        textarea.focus();
    }
}

// 修改 handleInlineReplySubmit，添加字数限制
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
    if (commentText.length > 500) {
        showNotification('回复内容不能超过500字符', 'error');
        return;
    }
    const date = new Date().toISOString().split('T')[0];
    const commentId = Date.now().toString();
    const replyComment = { id: commentId, articleId: String(articleId), name, comment: commentText, date, parentId };
    try {
        await saveCommentToFirebase(replyComment);
    } catch (err) {
        console.error('保存回复到 Firebase 失败', err);
        showNotification('保存回复失败，请重试', 'error');
        return;
    }
    try {
        localStorage.setItem('commenterName', name);
    } catch (e) {}
    showNotification('回复提交成功', 'success');
    // 关闭内联回复表单
    closeInlineReplyForm();
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

// === Firebase 用户认证与数据同步 ===
// firebase已在index.html初始化

// 全局firebase引用
const auth = firebase.auth();
const db = firebase.database();

// 用户状态
let currentUser = null;

// 弹窗登录/注册UI
function showAuthModal() {
    // 若已存在则显示
    let modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }
    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
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
    // 对渲染后的 Markdown 做增强（高亮、懒加载图、外链处理）
    try { enhanceRenderedMarkdown(content.querySelector('.article-content')); } catch (e) {}
    document.body.appendChild(modal);
    // 切换tab
    const tabs = modal.querySelectorAll('.auth-tab');
    const loginForm = modal.querySelector('#loginForm');
    const registerForm = modal.querySelector('#registerForm');
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
      };
    });
    // 登录
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#loginEmail').value.trim();
      const pwd = modal.querySelector('#loginPassword').value;
      try {
        await auth.signInWithEmailAndPassword(email, pwd);
        closeAuthModal();
      } catch (e) {
        setAuthModalStatus('登录失败: ' + (e.message || '未知错误'), 'error');
      }
    };
    // 注册
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#registerEmail').value.trim();
      const pwd = modal.querySelector('#registerPassword').value;
      try {
        await auth.createUserWithEmailAndPassword(email, pwd);
        setAuthModalStatus('注册成功，已自动登录', 'success');
        setTimeout(closeAuthModal, 800);
      } catch (e) {
        setAuthModalStatus('注册失败: ' + (e.message || '未知错误'), 'error');
      }
    };
    // 关闭弹窗
    modal.querySelector('.auth-modal-close').onclick = closeAuthModal;
    modal.onclick = (e) => { if (e.target === modal) closeAuthModal(); };
    document.addEventListener('keydown', escAuthModal, { once: true });
}
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.remove();
}
function escAuthModal(e) {
    if (e.key === 'Escape') closeAuthModal();
}
function setAuthModalStatus(msg, type) {
    const status = document.getElementById('authModalStatus');
    if (status) {
        status.textContent = msg;
        status.className = 'auth-modal-status ' + (type || '');
    }
}

// 顶部导航栏登录状态UI
function showAuthStatusInHeader() {
    const nav = document.querySelector('header nav ul');
    if (!nav) return;
    let statusLi = document.getElementById('authStatusHeaderLi');
    if (!statusLi) {
        statusLi = document.createElement('li');
        nav.appendChild(statusLi);
    }
    statusLi.id = 'authStatusHeaderLi';
    statusLi.innerHTML = '';
    if (currentUser) {
        statusLi.innerHTML = `<span class="auth-header-status">已登录: <b>${currentUser.email}</b></span><button id="logoutBtnHeader" class="auth-header-logout-btn">登出</button>`;
        document.getElementById('logoutBtnHeader').onclick = async () => { await auth.signOut(); };
    } else {
        statusLi.innerHTML = `<button id="openAuthModalBtnHeader" class="auth-header-open-btn">登录/注册</button>`;
        document.getElementById('openAuthModalBtnHeader').onclick = showAuthModal;
    }
}

// 监听登录状态
function listenAuthState() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        showAuthStatusInHeader();
        loadAvatar();
        if (user) loadAvatarFromFirebase();
        if (window.location.hash === '' || window.location.hash === '#home') {
            showHome();
        }
    });
}

// === firebase数据同步部分 ===
// 保存单条评论到firebase（追加，不覆盖）
async function saveCommentToFirebase(commentObj) {
    // 使用 push() 先获取新的引用，再 set 数据，这样可以拿到 key
    const ref = db.ref('comments/1744806386348').push();
    await ref.set(commentObj);
    return ref.key;
}
// 删除单条评论（通过pushId）
async function deleteCommentFromFirebase(pushId) {
    await db.ref('comments/1744806386348/' + pushId).remove();
}
// 监听文章和评论的实时变化
function listenRealtimeData() {
    db.ref('articles').on('value', snap => {
        const val = snap.val();
        articles = val ? Object.values(val) : [];
        if (window.updateArticles) window.updateArticles(1);
    });
    db.ref('comments/1744806386348').on('value', snap => {
        const val = snap.val();
        // 拉平成数组，带pushId
        comments = val ? Object.entries(val).map(([pushId, c]) => ({...c, _pushId: pushId})) : [];
        const hash = window.location.hash;
        if (hash.startsWith('#article/')) {
            const articleId = hash.replace('#article/', '');
            showArticle(articleId);
        }
    });
}

// 保存文章和评论到firebase
async function saveData() {
    await db.ref('articles').set(Object.fromEntries(articles.map(a => [a.id, a])));
    await db.ref('comments').set(Object.fromEntries(comments.map(c => [c.id, c])));
    showNotification('更改已同步到云端', 'success');
}

// 头像上传到firebase（每个用户独立，UID）
async function saveAvatarToFirebase(base64) {
    if (!currentUser) return;
    await db.ref('avatars/Y48yvlcBXEbrhLH3ZMk4ad9KbU32').set(base64);
    showNotification('头像已同步到云端', 'success');
}

// 从firebase加载头像
function loadAvatarFromFirebase() {
    if (!currentUser) return;
    db.ref('avatars/Y48yvlcBXEbrhLH3ZMk4ad9KbU32').once('value').then(snap => {
        const val = snap.val();
        const profileAvatar = document.getElementById('profileAvatar');
        if (val && profileAvatar) profileAvatar.src = val;
    });
}

// 权限判断工具
function isAdmin() {
    return currentUser && currentUser.email === '3196968430@qq.com';
}

// 初始化时监听数据
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

    // 委托处理表单提交（捕获回车提交的内联回复表单）
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form && form.classList && form.classList.contains('inline-reply-form')) {
            // 仅处理带 data-parent-id 的 firebase 内联表单
            if (form.dataset && form.dataset.parentId) {
                e.preventDefault();
                handleInlineReplySubmit(form);
            }
        }
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.article-link');
        if (link) {
            e.preventDefault();
            const articleId = link.dataset.id;
            if (articleId) window.location.hash = `#article/${articleId}`;
        }
    });

    listenAuthState();
    listenRealtimeData();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initialize);

// ======= 评论系统重写（本地存储版）=======
// 评论数据结构：{id, articleId, parentId, name, content, date}
function getLocalComments() {
    try {
        return JSON.parse(localStorage.getItem('localComments') || '[]');
    } catch (e) {
        return [];
    }
}
function saveLocalComments(comments) {
    localStorage.setItem('localComments', JSON.stringify(comments));
}

// 渲染评论区
function renderComments(articleId) {
    const container = document.querySelector('.comments');
    if (!container) return;
    const allComments = getLocalComments().filter(c => String(c.articleId) === String(articleId));
    container.innerHTML = '';
    if (allComments.length === 0) {
        container.innerHTML = '<p style="color:#888;font-size:14px;text-align:center;">暂无评论，快来发表第一条吧！</p>';
        return;
    }
    renderCommentTree(allComments, null, 0, container, articleId);
}

function renderCommentTree(comments, parentId, level, container, articleId) {
    if (level > 2) return; // 最多3级
    comments.filter(c => c.parentId === parentId).forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment animate-on-scroll';
        div.style.marginLeft = `${level * 20}px`;
        div.innerHTML = `
            <p><strong>${escapeHtml(comment.name)}</strong>${escapeHtml(comment.content)}</p>
            <small>发表于 ${comment.date}</small>
            <button class="reply-button" data-id="${comment.id}" data-name="${escapeHtml(comment.name)}">回复</button>
            <button class="delete-comment-button" data-id="${comment.id}">删除</button>
            <div class="reply-form-container" style="display:none;"></div>
        `;
        container.appendChild(div);
        // 绑定回复按钮
        div.querySelector('.reply-button').onclick = function() {
            openReplyForm(articleId, comment.id, comment.name, div.querySelector('.reply-form-container'));
        };
        // 绑定删除按钮
        div.querySelector('.delete-comment-button').onclick = function() {
            if (confirm('确定删除此评论及其所有回复？')) {
                deleteCommentAndReplies(comment.id, articleId);
            }
        };
        // 渲染子评论
        renderCommentTree(comments, comment.id, level + 1, container, articleId);
    });
}

function openReplyForm(articleId, parentId, parentName, container) {
    closeAllReplyForms();
    container.style.display = 'block';
    container.innerHTML = `
        <form class="inline-reply-form">
            <label>你的名字:</label>
            <input type="text" name="name" placeholder="访客" required maxlength="20">
            <label>回复 @${escapeHtml(parentName)}:</label>
            <textarea name="content" placeholder="输入你的回复..." required maxlength="500"></textarea>
            <div class="reply-form-actions">
                <button type="submit" class="submit-reply">提交回复</button>
                <button type="button" class="cancel-reply">取消</button>
            </div>
        </form>
    `;
    const form = container.querySelector('form');
    form.onsubmit = function(e) {
        e.preventDefault();
        const name = form.name.value.trim() || '访客';
        const content = form.content.value.trim();
        if (!content) return alert('回复内容不能为空');
        addComment(articleId, parentId, name, content);
        container.style.display = 'none';
    };
    form.querySelector('.cancel-reply').onclick = function() {
        container.style.display = 'none';
    };
}
function closeAllReplyForms() {
    document.querySelectorAll('.reply-form-container').forEach(c => c.style.display = 'none');
}

function addComment(articleId, parentId, name, content) {
    const comments = getLocalComments();
    comments.push({
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        articleId: String(articleId),
        parentId: parentId || null,
        name: name,
        content: content,
        date: new Date().toLocaleString('zh-CN', {hour12: false})
    });
    saveLocalComments(comments);
    renderComments(articleId);
}

function deleteCommentAndReplies(commentId, articleId) {
    let comments = getLocalComments();
    // 递归删除所有子评论
    function del(id) {
        comments = comments.filter(c => c.id !== id);
        getLocalComments().filter(c => c.parentId === id).forEach(child => del(child.id));
    }
    del(commentId);
    saveLocalComments(comments);
    renderComments(articleId);
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s]));
}

// 渲染评论表单
function renderCommentForm(articleId) {
    const content = document.getElementById('content');
    if (!content) return;
    let form = content.querySelector('#commentForm');
    if (!form) {
        form = document.createElement('form');
        form.id = 'commentForm';
        form.className = 'animate-on-scroll';
        form.innerHTML = `
            <h3>发表评论</h3>
            <label for="commentName">你的名字:</label>
            <input type="text" id="commentName" placeholder="访客" maxlength="20">
            <label for="commentText">评论内容:</label>
            <textarea id="commentText" placeholder="输入你的评论..." required maxlength="500"></textarea>
            <div class="char-count" id="commentCharCount">0/500</div>
            <button type="submit">提交评论</button>
        `;
        content.appendChild(form);
    }
    // 字数统计
    const textarea = form.querySelector('#commentText');
    const charCount = form.querySelector('#commentCharCount');
    textarea.oninput = function() {
        charCount.textContent = `${textarea.value.length}/500`;
        charCount.style.color = textarea.value.length > 500 ? '#d16060' : '';
    };
    // 提交
    form.onsubmit = function(e) {
        e.preventDefault();
        const name = form.querySelector('#commentName').value.trim() || '访客';
        const content = textarea.value.trim();
        if (!content) return alert('评论内容不能为空');
        addComment(articleId, null, name, content);
        textarea.value = '';
        charCount.textContent = '0/500';
    };
}

// 已在文件顶部实现 `showArticle`（基于 Firebase 的完整实现），此处保留占位说明以避免重复定义。
// Duplicate showArticle implementation removed; use the primary implementation earlier in this file.