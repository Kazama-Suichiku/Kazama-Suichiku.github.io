/**
 * 应用配置文件
 * 包含所有硬编码的配置信息
 */

// Firebase 配置
export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAU2iWEKT1qi8B3Fg1JHTfhFC_SQmyOF2k",
    authDomain: "my-blog-fa883.firebaseapp.com",
    databaseURL: "https://my-blog-fa883-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "my-blog-fa883",
    storageBucket: "my-blog-fa883.firebasestorage.app",
    messagingSenderId: "142782336652",
    appId: "1:142782336652:web:18e907b3e4510bfb2eb5a9",
    measurementId: "G-TZ7XSZTECY"
};

// Cloudflare Worker 代理配置（用于国内访问）
export const PROXY_CONFIG = {
    enabled: true,       // 是否启用代理功能
    forceProxy: true,    // 强制使用代理（跳过检测，国内用户建议开启）
    url: 'https://crimson-frost-e2bf.fengzhongcuizhu.workers.dev',
    timeout: 3000        // 检测超时时间（毫秒）
};

// 管理员配置
export const ADMIN_CONFIG = {
    email: '3196968430@qq.com',
    avatarUid: 'Y48yvlcBXEbrhLH3ZMk4ad9KbU32'
};

// 文章分类
export const CATEGORIES = ['技术', '生活', '其他'];

// 分页配置
export const PAGINATION = {
    perPage: 5,
    maxVisiblePages: 5
};

// 评论配置
export const COMMENT_CONFIG = {
    maxLength: 500,
    maxNestingLevel: 3,
    firebaseRef: 'comments/1744806386348'
};

// 图片配置
export const IMAGE_CONFIG = {
    avatar: {
        maxSize: 2 * 1024 * 1024, // 2MB
        maxDimension: 300,
        quality: 0.8
    },
    article: {
        maxSize: 10 * 1024 * 1024, // 10MB
        maxDimension: 1920,
        quality: 0.85,
        maxCount: 5
    },
    supportedTypes: ['image/jpeg', 'image/png']
};

// 粒子动画配置
export const PARTICLES_CONFIG = {
    light: {
        primaryColor: '#5a7d9a',
        secondaryColor: '#c89b70'
    },
    dark: {
        primaryColor: '#92c1de',
        secondaryColor: '#d8b593'
    },
    minWidth: 700 // 小于此宽度禁用粒子
};

// 个人信息配置
export const PROFILE_CONFIG = {
    name: 'Kazama_Suichiku',
    bio: '游戏技术美术爱好者。分享学习历程，记录点滴思考。希望我们都能学有所成！',
    links: {
        zhihu: 'https://www.zhihu.com/people/48-52-52-27-65',
        bilibili: 'https://space.bilibili.com/56807642?spm_id_from=333.788.0.0',
        github: 'https://github.com/Kazama-Suichiku'
    }
};

// 站点信息
export const SITE_CONFIG = {
    title: '翠竹的博客',
    icon: '🎋',
    description: '游戏技术美术爱好者的个人博客，分享学习历程，记录点滴思考。',
    keywords: '博客,技术美术,游戏开发,Shader,Unity,Unreal,学习笔记',
    themeColor: '#5a7d9a'
};

// 速率限制配置
export const RATE_LIMIT_CONFIG = {
    comment: {
        maxRequests: 3,
        windowMs: 60000,      // 1分钟
        blockDuration: 300000  // 5分钟
    },
    login: {
        maxRequests: 5,
        windowMs: 60000,
        blockDuration: 600000  // 10分钟
    },
    article: {
        maxRequests: 10,
        windowMs: 3600000,     // 1小时
        blockDuration: 1800000 // 30分钟
    }
};

// 动画配置
export const ANIMATION_CONFIG = {
    pageTransitionDuration: 300,
    scrollAnimationThreshold: 0.1,
    skeletonCount: {
        articleList: 3,
        comments: 2
    }
};

