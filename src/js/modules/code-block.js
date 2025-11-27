/**
 * 代码块增强模块
 * 提供复制按钮、语言标签、行号显示
 */

import notify from './notification.js';

// 语言名称映射
const LANGUAGE_NAMES = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
    'md': 'Markdown',
    'markdown': 'Markdown',
    'bash': 'Bash',
    'shell': 'Shell',
    'sh': 'Shell',
    'zsh': 'Zsh',
    'powershell': 'PowerShell',
    'ps1': 'PowerShell',
    'sql': 'SQL',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'c++': 'C++',
    'csharp': 'C#',
    'cs': 'C#',
    'go': 'Go',
    'rust': 'Rust',
    'rs': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'kt': 'Kotlin',
    'php': 'PHP',
    'ruby': 'Ruby',
    'rb': 'Ruby',
    'r': 'R',
    'lua': 'Lua',
    'perl': 'Perl',
    'scala': 'Scala',
    'dart': 'Dart',
    'dockerfile': 'Dockerfile',
    'docker': 'Docker',
    'nginx': 'Nginx',
    'apache': 'Apache',
    'vim': 'Vim',
    'plaintext': '纯文本',
    'text': '纯文本',
    'hlsl': 'HLSL',
    'glsl': 'GLSL',
    'shader': 'Shader',
    'unity': 'Unity',
    'unreal': 'Unreal',
    'ue': 'Unreal'
};

/**
 * 增强代码块
 * @param {HTMLElement} container - 包含代码块的容器
 */
export function enhanceCodeBlocks(container) {
    if (!container) return;
    
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach((code, index) => {
        const pre = code.parentElement;
        
        // 避免重复处理
        if (pre.classList.contains('enhanced')) return;
        pre.classList.add('enhanced');
        
        // 获取语言
        const language = detectLanguage(code);
        
        // 创建包装器
        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        
        // 创建头部
        const header = createCodeHeader(language, code.textContent, index);
        
        // 添加行号
        addLineNumbers(pre, code);
        
        // 组装
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });
}

/**
 * 检测代码语言
 */
function detectLanguage(codeElement) {
    const classList = codeElement.className.split(' ');
    
    for (const cls of classList) {
        if (cls.startsWith('language-')) {
            return cls.replace('language-', '');
        }
        if (cls.startsWith('hljs-')) {
            continue;
        }
        // 直接匹配语言名
        if (LANGUAGE_NAMES[cls.toLowerCase()]) {
            return cls;
        }
    }
    
    return 'code';
}

/**
 * 获取语言显示名称
 */
function getLanguageDisplayName(lang) {
    return LANGUAGE_NAMES[lang.toLowerCase()] || lang.toUpperCase();
}

/**
 * 创建代码块头部
 */
function createCodeHeader(language, codeText, index) {
    const header = document.createElement('div');
    header.className = 'code-block-header';
    
    // 语言标签
    const langLabel = document.createElement('span');
    langLabel.className = 'code-language';
    langLabel.textContent = getLanguageDisplayName(language);
    
    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i><span>复制</span>';
    copyBtn.title = '复制代码';
    copyBtn.dataset.index = index;
    
    copyBtn.addEventListener('click', () => copyCode(codeText, copyBtn));
    
    header.appendChild(langLabel);
    header.appendChild(copyBtn);
    
    return header;
}

/**
 * 复制代码
 */
async function copyCode(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        
        // 更新按钮状态
        button.innerHTML = '<i class="fas fa-check"></i><span>已复制</span>';
        button.classList.add('copied');
        
        // 2秒后恢复
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i><span>复制</span>';
            button.classList.remove('copied');
        }, 2000);
        
    } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            button.innerHTML = '<i class="fas fa-check"></i><span>已复制</span>';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-copy"></i><span>复制</span>';
                button.classList.remove('copied');
            }, 2000);
        } catch (e) {
            notify.error('复制失败，请手动复制');
        }
        
        document.body.removeChild(textarea);
    }
}

/**
 * 添加行号
 */
function addLineNumbers(pre, code) {
    const lines = code.textContent.split('\n');
    
    // 如果只有一行，不显示行号
    if (lines.length <= 1) return;
    
    // 移除最后的空行
    if (lines[lines.length - 1] === '') {
        lines.pop();
    }
    
    // 创建行号容器
    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'line-numbers';
    lineNumbers.setAttribute('aria-hidden', 'true');
    
    for (let i = 1; i <= lines.length; i++) {
        const lineNum = document.createElement('span');
        lineNum.textContent = i;
        lineNumbers.appendChild(lineNum);
    }
    
    pre.classList.add('has-line-numbers');
    pre.insertBefore(lineNumbers, code);
}

/**
 * 初始化代码块增强
 */
export function initCodeBlocks() {
    // 初始化时处理已有的代码块
    enhanceCodeBlocks(document.body);
}

export default {
    enhance: enhanceCodeBlocks,
    init: initCodeBlocks
};

