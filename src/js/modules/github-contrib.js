/**
 * GitHub 贡献图模块
 */

import { PROFILE_CONFIG } from '../config.js';

/**
 * 获取 GitHub 用户名
 * @returns {string}
 */
function getGitHubUsername() {
    const githubUrl = PROFILE_CONFIG.links.github || '';
    const match = githubUrl.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : 'Kazama-Suichiku';
}

/**
 * 创建 GitHub 贡献图 HTML
 * @param {string} username - GitHub 用户名
 * @returns {string}
 */
export function createGitHubContrib(username = null) {
    const user = username || getGitHubUsername();
    
    // 使用 GitHub 贡献图 API
    // 方案1: 使用 ghchart.rshah.org
    const chartUrl = `https://ghchart.rshah.org/${user}`;
    
    // 方案2: 使用 github-contributions-api
    // const chartUrl = `https://github-contributions.vercel.app/api/v1/${user}`;
    
    return `
        <div class="github-contrib">
            <div class="contrib-header">
                <h3>
                    <i class="fab fa-github"></i>
                    GitHub 贡献
                </h3>
                <a href="https://github.com/${user}" target="_blank" rel="noopener noreferrer" class="github-link">
                    @${user}
                    <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
            <div class="contrib-chart">
                <img src="${chartUrl}" alt="${user}'s GitHub Contribution Chart" loading="lazy" onerror="this.parentElement.innerHTML='<p class=\\'contrib-error\\'>贡献图加载失败</p>'">
            </div>
            <div class="contrib-footer">
                <a href="https://github.com/${user}?tab=repositories" target="_blank" class="contrib-btn">
                    <i class="fas fa-code-branch"></i>
                    查看仓库
                </a>
                <a href="https://github.com/${user}?tab=stars" target="_blank" class="contrib-btn">
                    <i class="fas fa-star"></i>
                    Star 项目
                </a>
            </div>
        </div>
    `;
}

/**
 * 创建 GitHub 统计卡片
 * @param {string} username
 * @returns {string}
 */
export function createGitHubStats(username = null) {
    const user = username || getGitHubUsername();
    
    // 使用 github-readme-stats
    const statsUrl = `https://github-readme-stats.vercel.app/api?username=${user}&show_icons=true&theme=default&hide_border=true&bg_color=00000000`;
    const langUrl = `https://github-readme-stats.vercel.app/api/top-langs/?username=${user}&layout=compact&hide_border=true&bg_color=00000000`;
    
    return `
        <div class="github-stats">
            <img src="${statsUrl}" alt="${user}'s GitHub Stats" loading="lazy">
            <img src="${langUrl}" alt="${user}'s Top Languages" loading="lazy">
        </div>
    `;
}

/**
 * 初始化 GitHub 贡献图（插入到侧边栏）
 */
export function initGitHubContrib() {
    const sidebar = document.querySelector('.sidebar .profile');
    if (!sidebar) return;
    
    // 检查是否已存在
    if (sidebar.querySelector('.github-contrib')) return;
    
    const contribHtml = createGitHubContrib();
    const contribDiv = document.createElement('div');
    contribDiv.innerHTML = contribHtml;
    
    // 插入到联系方式之前
    const contact = sidebar.querySelector('.contact');
    if (contact) {
        sidebar.insertBefore(contribDiv.firstElementChild, contact);
    } else {
        sidebar.appendChild(contribDiv.firstElementChild);
    }
}

export default {
    create: createGitHubContrib,
    createStats: createGitHubStats,
    init: initGitHubContrib
};

