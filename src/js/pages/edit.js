/**
 * 文章编辑页模块
 */

import { $ } from '../utils/dom.js';
import { escapeHtml, formatDate, generateId } from '../utils/helpers.js';
import { CATEGORIES, IMAGE_CONFIG } from '../config.js';
import { isAdmin, saveArticle } from '../modules/firebase.js';
import { initScrollAnimations, disconnectScrollAnimations } from '../modules/scroll.js';
import { showImageModal } from '../modules/modal.js';
import notify from '../modules/notification.js';
import { compressImage } from '../utils/image.js';
import { getArticles } from './home.js';
import { extractTags, parseTagInput } from '../modules/tags.js';

// EasyMDE 编辑器实例
let easyMDEInstance = null;

/**
 * 销毁 EasyMDE 实例
 */
function destroyEasyMDE() {
    if (easyMDEInstance) {
        try {
            easyMDEInstance.toTextArea();
            easyMDEInstance = null;
        } catch (e) {}
    }
}

/**
 * 显示编辑表单
 * @param {string} articleId - 文章 ID
 */
export function showEditForm(articleId) {
    if (!isAdmin()) {
        notify.error('只有管理员可以编辑文章');
        window.location.hash = '#home';
        return;
    }
    
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
    
    // 销毁旧的编辑器
    destroyEasyMDE();
    
    // 获取常用标签
    const allArticles = getArticles();
    const suggestedTags = extractTags(allArticles);
    const currentTags = article.tags || [];
    
    content.innerHTML = `
        <div class="edit-page animate-on-scroll">
            <h1>编辑文章</h1>
            <form id="editArticleForm" class="edit-article-form" novalidate>
                <div class="form-row">
                    <div class="form-group flex-2">
                        <label for="articleTitle">标题</label>
                        <input type="text" id="articleTitle" value="${escapeHtml(article.title || '')}" placeholder="请输入文章标题" required>
                    </div>
                    <div class="form-group flex-1">
                        <label for="articleCategory">分类</label>
                        <select id="articleCategory" required>
                            ${CATEGORIES.map(cat => `
                                <option value="${cat}" ${cat === article.category ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="articleTags">标签</label>
                    <input type="text" id="articleTags" value="${escapeHtml(currentTags.join(', '))}" 
                           placeholder="输入标签，用逗号分隔（如：Unity, Shader, 教程）">
                    <div class="tag-suggestions">
                        ${suggestedTags.length > 0 ? `
                            <span class="suggestion-label">常用：</span>
                            ${suggestedTags.slice(0, 8).map(t => `
                                <button type="button" class="tag-suggestion" data-tag="${escapeHtml(t.name)}">${escapeHtml(t.name)}</button>
                            `).join('')}
                        ` : ''}
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="articleContent">
                        内容
                        <span class="label-hint">支持 Markdown 语法</span>
                    </label>
                    <textarea id="articleContent" required>${escapeHtml(article.content || '')}</textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        封面图片
                        <span class="label-hint">最多 ${IMAGE_CONFIG.article.maxCount} 张，支持拖拽上传</span>
                    </label>
                    <div class="image-upload-area" id="imageUploadArea">
                        <input type="file" id="articleImage" accept="image/jpeg,image/png" multiple>
                        <div class="upload-placeholder">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>点击或拖拽图片到此处上传</p>
                            <span>支持 JPG、PNG 格式</span>
                        </div>
                    </div>
                    <div class="image-preview" id="imagePreview">
                        <p style='width:100%;text-align:center;color:#888;'>图片加载中...</p>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>插入图片到正文</label>
                    <input type="file" id="mdImageInput" accept="image/jpeg,image/png" style="display:none;">
                    <button type="button" id="insertMdImageBtn" class="btn-secondary">
                        <i class="fas fa-image"></i> 选择图片插入
                    </button>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> 保存更改
                    </button>
                    <button type="button" id="cancelEditButton" class="btn-secondary">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button type="button" id="previewButton" class="btn-secondary">
                        <i class="fas fa-eye"></i> 预览
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const previewContainer = $('#imagePreview');
    const imageInput = $('#articleImage');
    let currentImages = [...(article.images || [])];
    let newFiles = [];
    
    // 渲染图片预览
    async function renderPreviews() {
        previewContainer.innerHTML = '<p style="width:100%;text-align:center;color:#888;">图片加载中...</p>';
        await new Promise(r => setTimeout(r, 0));
        previewContainer.innerHTML = '';
        
        currentImages.forEach((src, idx) => {
            const div = document.createElement('div');
            div.className = 'image-container';
            div.innerHTML = `
                <img src="${src}" alt="预览图片${idx + 1}" onerror="this.alt='图片加载失败';this.parentNode.style.display='none';">
                <button type="button" class="delete-image" data-index="${idx}" title="删除图片">×</button>
            `;
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
        
        if (currentImages.length === 0) {
            previewContainer.innerHTML = '<p style="color:#888;font-size:14px;width:100%;text-align:center;">暂无图片</p>';
        }
    }
    
    renderPreviews();
    
    // 图片选择处理
    imageInput.onchange = async function() {
        const files = Array.from(this.files);
        if (files.length === 0) return;
        
        if (files.length + currentImages.length > IMAGE_CONFIG.article.maxCount) {
            notify.error(`最多可上传${IMAGE_CONFIG.article.maxCount}张图片（当前已有${currentImages.length}张）`);
            this.value = '';
            return;
        }
        
        newFiles = files;
        previewContainer.querySelectorAll('.new-preview').forEach(el => el.remove());
        
        if (currentImages.length === 0 && previewContainer.querySelector('p')) {
            previewContainer.innerHTML = '';
        }
        
        for (const file of newFiles) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.createElement('div');
                    container.className = 'image-container new-preview';
                    container.innerHTML = `
                        <img src="${e.target.result}" alt="新上传预览">
                        <span style="position:absolute;top:0;left:0;background:rgba(106,142,174,0.7);color:white;font-size:10px;padding:1px 3px;border-radius:3px;">新</span>
                    `;
                    previewContainer.appendChild(container);
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error("预览生成错误:", err);
            }
        }
        
        notify.info(`已选择${files.length}张新图片，保存后生效`);
    };
    
    // 初始化 Markdown 编辑器
    setTimeout(() => {
        if (easyMDEInstance) destroyEasyMDE();
        
        easyMDEInstance = new EasyMDE({
            element: document.getElementById('articleContent'),
            spellChecker: false,
            status: false,
            minHeight: '300px',
            maxHeight: '600px',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side', 'fullscreen', '|',
                {
                    name: 'insertImage',
                    action: function() {
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
    const mdImageInput = $('#mdImageInput');
    const insertMdImageBtn = $('#insertMdImageBtn');
    
    insertMdImageBtn.onclick = () => setTimeout(() => mdImageInput.click(), 0);
    
    mdImageInput.onchange = async function() {
        const file = this.files[0];
        if (!file) return;
        
        try {
            notify.info('正在处理图片...');
            const url = await compressImage(file, false);
            
            if (easyMDEInstance) {
                const cm = easyMDEInstance.codemirror;
                const pos = cm.getCursor();
                cm.replaceRange(`![](${url})\n`, pos);
            }
            
            notify.success('图片已插入正文');
        } catch (e) {
            notify.error('图片处理失败: ' + (e.message || '未知错误'));
        }
        
        this.value = '';
    };
    
    // 表单提交
    const form = $('#editArticleForm');
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const title = $('#articleTitle').value.trim();
        const category = $('#articleCategory').value;
        const text = easyMDEInstance ? easyMDEInstance.value().trim() : $('#articleContent').value.trim();
        
        if (!title || !category || !text) {
            notify.error('标题、分类和内容不能为空');
            return;
        }
        
        let newCompressedImages = [];
        if (newFiles.length > 0) {
            notify.info('正在处理图片...');
            const promises = newFiles.map(f => 
                compressImage(f, false).catch(err => {
                    notify.error(`图片${f.name}处理失败: ${err.message}`);
                    return null;
                })
            );
            newCompressedImages = (await Promise.all(promises)).filter(r => r !== null);
            newFiles = [];
        }
        
        const finalImages = [...currentImages, ...newCompressedImages];
        if (finalImages.length > IMAGE_CONFIG.article.maxCount) {
            notify.error(`图片总数（${finalImages.length}）超过${IMAGE_CONFIG.article.maxCount}张限制`);
            return;
        }
        
        // 解析标签
        const tagsInput = $('#articleTags').value;
        const tags = parseTagInput(tagsInput);
        
        const updatedArticle = {
            ...article,
            title,
            category,
            content: text,
            images: finalImages,
            tags,
            date: formatDate(new Date(), 'YYYY-MM-DD')
        };
        
        await saveArticle(updatedArticle);
        notify.success('文章更新成功');
        destroyEasyMDE();
        window.location.hash = `#article/${articleId}`;
    };
    
    // 取消按钮
    $('#cancelEditButton').onclick = () => {
        if (confirm('确定取消编辑？更改将不会保存。')) {
            destroyEasyMDE();
            window.location.hash = `#article/${articleId}`;
        }
    };
    
    // 标签建议点击
    document.querySelectorAll('.tag-suggestion').forEach(btn => {
        btn.onclick = () => {
            const tag = btn.dataset.tag;
            const tagsInput = $('#articleTags');
            const currentValue = tagsInput.value.trim();
            
            // 检查是否已存在
            const existingTags = currentValue.split(/[,，]/).map(t => t.trim().toLowerCase());
            if (existingTags.includes(tag.toLowerCase())) {
                notify.info('标签已存在');
                return;
            }
            
            tagsInput.value = currentValue ? `${currentValue}, ${tag}` : tag;
        };
    });
    
    // 拖拽上传
    const uploadArea = $('#imageUploadArea');
    if (uploadArea) {
        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        };
        
        uploadArea.ondragleave = () => {
            uploadArea.classList.remove('dragover');
        };
        
        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files).filter(f => 
                f.type === 'image/jpeg' || f.type === 'image/png'
            );
            
            if (files.length > 0) {
                // 模拟文件选择
                const dataTransfer = new DataTransfer();
                files.forEach(f => dataTransfer.items.add(f));
                imageInput.files = dataTransfer.files;
                imageInput.dispatchEvent(new Event('change'));
            }
        };
    }
    
    // 预览按钮
    const previewBtn = $('#previewButton');
    if (previewBtn) {
        previewBtn.onclick = () => {
            const text = easyMDEInstance ? easyMDEInstance.value() : $('#articleContent').value;
            if (easyMDEInstance) {
                easyMDEInstance.togglePreview();
            }
        };
    }
    
    initScrollAnimations();
}

export default {
    show: showEditForm
};

