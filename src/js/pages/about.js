/**
 * 关于页面模块
 */

import { $ } from '../utils/dom.js';
import { PROFILE_CONFIG } from '../config.js';
import { initScrollAnimations, disconnectScrollAnimations } from '../modules/scroll.js';
import { renderSkills } from '../modules/skills.js';
import { renderTimeline } from '../modules/timeline.js';

/**
 * 显示关于页面
 */
export async function showAbout() {
    disconnectScrollAnimations();
    
    const content = $('#content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="about-page animate-on-scroll">
            <h1>关于我</h1>
            <p>你好！我是 ${PROFILE_CONFIG.name}，一个热爱游戏开发与技术美术的独立学习者。</p>
            <p>在这里，我分享我的学习笔记、技术探索，以及生活中的点滴感悟。无论是深入研究着色器（Shader）、程序化内容生成，还是记录一个安静的午后，我都希望这些内容能给你带来灵感或共鸣。</p>
            <p>我的兴趣包括但不限于：</p>
            <ul>
                <li><strong>游戏开发</strong>：熟悉 Unreal Engine、Unity，专注于实时渲染与视觉效果。</li>
                <li><strong>技术美术</strong>：探索 Shader 编写、程序化纹理、粒子系统等。</li>
                <li><strong>生活记录</strong>：用文字捕捉日常中的小确幸。</li>
            </ul>
            <p>欢迎通过我的 
                <a href="${PROFILE_CONFIG.links.zhihu}" target="_blank" rel="noopener noreferrer">知乎</a>、
                <a href="${PROFILE_CONFIG.links.bilibili}" target="_blank" rel="noopener noreferrer">Bilibili</a> 或 
                <a href="${PROFILE_CONFIG.links.github}" target="_blank" rel="noopener noreferrer">GitHub</a> 与我交流！
            </p>
            <p>愿我们都能在学习的旅途中不断成长，享受创造的乐趣！</p>
        </div>
        
        <!-- 技能展示区 -->
        <div id="skills-container" class="animate-on-scroll"></div>
        
        <!-- 时间线展示区 -->
        <div id="timeline-container" class="animate-on-scroll"></div>
    `;
    
    // 渲染技能树
    const skillsContainer = $('#skills-container');
    if (skillsContainer) {
        await renderSkills(skillsContainer);
    }
    
    // 渲染时间线
    const timelineContainer = $('#timeline-container');
    if (timelineContainer) {
        await renderTimeline(timelineContainer);
    }
    
    initScrollAnimations();
}

export default {
    show: showAbout
};

