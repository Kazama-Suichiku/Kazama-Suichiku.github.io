/**
 * SEO 优化模块
 */

import { SITE_CONFIG, PROFILE_CONFIG } from '../config.js';

/**
 * 更新页面标题
 * @param {string} title - 页面标题
 */
export function updateTitle(title) {
    const fullTitle = title ? `${title} - ${SITE_CONFIG.title}` : SITE_CONFIG.title;
    document.title = fullTitle;
}

/**
 * 更新 meta 标签
 * @param {Object} meta - meta 信息
 */
export function updateMeta(meta = {}) {
    const {
        description = PROFILE_CONFIG.bio,
        keywords = '博客,技术美术,游戏开发,Shader,Unity,Unreal',
        author = PROFILE_CONFIG.name,
        image = '',
        url = window.location.href
    } = meta;
    
    // Description
    setMetaTag('description', description);
    
    // Keywords
    setMetaTag('keywords', keywords);
    
    // Author
    setMetaTag('author', author);
    
    // Open Graph
    setMetaTag('og:title', document.title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:type', 'website', 'property');
    setMetaTag('og:url', url, 'property');
    setMetaTag('og:site_name', SITE_CONFIG.title, 'property');
    if (image) {
        setMetaTag('og:image', image, 'property');
    }
    
    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', document.title);
    setMetaTag('twitter:description', description);
    if (image) {
        setMetaTag('twitter:image', image);
    }
}

/**
 * 设置 meta 标签
 * @param {string} name - 标签名
 * @param {string} content - 内容
 * @param {string} attr - 属性名 (name/property)
 */
function setMetaTag(name, content, attr = 'name') {
    let meta = document.querySelector(`meta[${attr}="${name}"]`);
    
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
}

/**
 * 更新 canonical URL
 * @param {string} url - 规范 URL
 */
export function updateCanonical(url = window.location.href) {
    let canonical = document.querySelector('link[rel="canonical"]');
    
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    
    canonical.setAttribute('href', url.split('#')[0]); // 移除 hash
}

/**
 * 添加结构化数据 (JSON-LD)
 * @param {Object} data - 结构化数据
 */
export function addStructuredData(data) {
    // 移除旧的结构化数据
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
        existing.remove();
    }
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

/**
 * 生成网站结构化数据
 */
export function generateWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': SITE_CONFIG.title,
        'url': window.location.origin,
        'author': {
            '@type': 'Person',
            'name': PROFILE_CONFIG.name,
            'url': PROFILE_CONFIG.links.github
        },
        'potentialAction': {
            '@type': 'SearchAction',
            'target': `${window.location.origin}/#home?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };
}

/**
 * 生成文章结构化数据
 * @param {Object} article - 文章对象
 */
export function generateArticleSchema(article) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': article.title,
        'description': (article.content || '').substring(0, 200),
        'datePublished': article.date,
        'dateModified': article.date,
        'author': {
            '@type': 'Person',
            'name': PROFILE_CONFIG.name
        },
        'publisher': {
            '@type': 'Person',
            'name': PROFILE_CONFIG.name
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': `${window.location.origin}/#article/${article.id}`
        },
        'image': article.images && article.images[0] ? article.images[0] : undefined
    };
}

/**
 * 更新文章页面 SEO
 * @param {Object} article - 文章对象
 */
export function updateArticleSEO(article) {
    if (!article) return;
    
    updateTitle(article.title);
    updateMeta({
        description: (article.content || '').replace(/\n/g, ' ').substring(0, 160),
        keywords: `${article.category},${PROFILE_CONFIG.name},博客`,
        image: article.images && article.images[0] ? article.images[0] : ''
    });
    updateCanonical();
    addStructuredData(generateArticleSchema(article));
}

/**
 * 更新首页 SEO
 */
export function updateHomeSEO() {
    updateTitle('');
    updateMeta({
        description: `${PROFILE_CONFIG.name}的个人博客 - ${PROFILE_CONFIG.bio}`,
        keywords: '博客,技术美术,游戏开发,Shader,Unity,Unreal,学习笔记'
    });
    updateCanonical();
    addStructuredData(generateWebsiteSchema());
}

/**
 * 更新关于页面 SEO
 */
export function updateAboutSEO() {
    updateTitle('关于我');
    updateMeta({
        description: `关于${PROFILE_CONFIG.name} - ${PROFILE_CONFIG.bio}`,
        keywords: `${PROFILE_CONFIG.name},关于,个人介绍,技术美术`
    });
    updateCanonical();
}

/**
 * 初始化 SEO
 */
export function initSEO() {
    // 添加基础 meta 标签
    if (!document.querySelector('meta[charset]')) {
        const charset = document.createElement('meta');
        charset.setAttribute('charset', 'UTF-8');
        document.head.insertBefore(charset, document.head.firstChild);
    }
    
    // 添加 viewport
    if (!document.querySelector('meta[name="viewport"]')) {
        setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    }
    
    // 添加主题色
    setMetaTag('theme-color', '#5a7d9a');
    
    // 添加 robots
    setMetaTag('robots', 'index, follow');
    
    // 初始化默认 SEO
    updateHomeSEO();
}

export default {
    init: initSEO,
    updateTitle,
    updateMeta,
    updateCanonical,
    updateArticleSEO,
    updateHomeSEO,
    updateAboutSEO
};

