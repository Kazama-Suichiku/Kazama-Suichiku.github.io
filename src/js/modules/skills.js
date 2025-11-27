/**
 * 技能树/技术栈展示模块
 * 支持管理员在线编辑
 */

import { getData, setData, isAdmin } from './firebase.js';
import notify from './notification.js';

// 默认技能数据
const DEFAULT_SKILLS = {
    categories: [
        {
            name: '游戏引擎',
            icon: 'fa-gamepad',
            skills: [
                { name: 'Unity', level: 85, color: '#000000' },
                { name: 'Unreal Engine', level: 75, color: '#313131' },
                { name: 'Godot', level: 40, color: '#478cbf' }
            ]
        },
        {
            name: '图形编程',
            icon: 'fa-paint-brush',
            skills: [
                { name: 'HLSL', level: 80, color: '#5c2d91' },
                { name: 'GLSL', level: 70, color: '#5586a4' },
                { name: 'ShaderLab', level: 75, color: '#222c37' }
            ]
        },
        {
            name: '编程语言',
            icon: 'fa-code',
            skills: [
                { name: 'C#', level: 85, color: '#68217a' },
                { name: 'C++', level: 60, color: '#00599c' },
                { name: 'Python', level: 70, color: '#3776ab' },
                { name: 'JavaScript', level: 65, color: '#f7df1e' }
            ]
        },
        {
            name: '美术工具',
            icon: 'fa-palette',
            skills: [
                { name: 'Substance', level: 70, color: '#e74c3c' },
                { name: 'Blender', level: 55, color: '#f5792a' },
                { name: 'Photoshop', level: 60, color: '#31a8ff' }
            ]
        }
    ]
};

// 缓存技能数据
let skillsData = null;

/**
 * 获取技能数据
 */
export async function getSkills() {
    if (skillsData) return skillsData;
    
    try {
        const data = await getData('skills');
        skillsData = data || DEFAULT_SKILLS;
    } catch (error) {
        console.error('获取技能数据失败:', error);
        skillsData = DEFAULT_SKILLS;
    }
    
    return skillsData;
}

/**
 * 保存技能数据
 */
export async function saveSkills(data) {
    try {
        await setData('skills', data);
        skillsData = data;
        notify.success('技能数据保存成功');
        return true;
    } catch (error) {
        console.error('保存技能数据失败:', error);
        notify.error('保存失败');
        return false;
    }
}

/**
 * 渲染技能展示
 * @param {HTMLElement} container - 容器元素
 */
export async function renderSkills(container) {
    if (!container) return;
    
    const skills = await getSkills();
    const admin = isAdmin();
    
    let html = `
        <div class="skills-section">
            <div class="skills-header">
                <h2><i class="fas fa-chart-bar"></i> 技术栈</h2>
                ${admin ? '<button class="edit-skills-btn" title="编辑技能"><i class="fas fa-edit"></i></button>' : ''}
            </div>
            <div class="skills-grid">
    `;
    
    skills.categories.forEach(category => {
        html += `
            <div class="skill-category">
                <h3><i class="fas ${category.icon}"></i> ${category.name}</h3>
                <div class="skill-bars">
        `;
        
        category.skills.forEach(skill => {
            html += `
                <div class="skill-item">
                    <div class="skill-info">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-level">${skill.level}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-progress" style="--progress: ${skill.level}%; --color: ${skill.color}"></div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // 触发动画
    setTimeout(() => {
        container.querySelectorAll('.skill-progress').forEach(bar => {
            bar.classList.add('animate');
        });
    }, 100);
    
    // 绑定编辑按钮
    if (admin) {
        const editBtn = container.querySelector('.edit-skills-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => openSkillsEditor(skills));
        }
    }
}

/**
 * 打开技能编辑器
 */
function openSkillsEditor(skills) {
    const modal = document.createElement('div');
    modal.className = 'skills-editor-modal';
    
    modal.innerHTML = `
        <div class="skills-editor-content">
            <div class="skills-editor-header">
                <h3><i class="fas fa-edit"></i> 编辑技术栈</h3>
                <button class="close-editor-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="skills-editor-body">
                <div class="editor-tabs">
                    ${skills.categories.map((cat, i) => `
                        <button class="editor-tab ${i === 0 ? 'active' : ''}" data-index="${i}">
                            ${cat.name}
                        </button>
                    `).join('')}
                    <button class="editor-tab add-category-tab" title="添加分类">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="editor-panels">
                    ${skills.categories.map((cat, catIndex) => `
                        <div class="editor-panel ${catIndex === 0 ? 'active' : ''}" data-index="${catIndex}">
                            <div class="category-settings">
                                <input type="text" class="category-name-input" value="${cat.name}" placeholder="分类名称">
                                <select class="category-icon-select">
                                    <option value="fa-gamepad" ${cat.icon === 'fa-gamepad' ? 'selected' : ''}>🎮 游戏</option>
                                    <option value="fa-paint-brush" ${cat.icon === 'fa-paint-brush' ? 'selected' : ''}>🎨 绘画</option>
                                    <option value="fa-code" ${cat.icon === 'fa-code' ? 'selected' : ''}>💻 代码</option>
                                    <option value="fa-palette" ${cat.icon === 'fa-palette' ? 'selected' : ''}>🎨 调色板</option>
                                    <option value="fa-cog" ${cat.icon === 'fa-cog' ? 'selected' : ''}>⚙️ 工具</option>
                                    <option value="fa-database" ${cat.icon === 'fa-database' ? 'selected' : ''}>📊 数据</option>
                                    <option value="fa-globe" ${cat.icon === 'fa-globe' ? 'selected' : ''}>🌐 网络</option>
                                    <option value="fa-mobile-alt" ${cat.icon === 'fa-mobile-alt' ? 'selected' : ''}>📱 移动</option>
                                </select>
                                <button class="delete-category-btn" title="删除分类"><i class="fas fa-trash"></i></button>
                            </div>
                            <div class="skills-list">
                                ${cat.skills.map((skill, skillIndex) => `
                                    <div class="skill-edit-item" data-skill-index="${skillIndex}">
                                        <input type="text" class="skill-name-input" value="${skill.name}" placeholder="技能名称">
                                        <input type="range" class="skill-level-input" min="0" max="100" value="${skill.level}">
                                        <span class="skill-level-display">${skill.level}%</span>
                                        <input type="color" class="skill-color-input" value="${skill.color}">
                                        <button class="delete-skill-btn" title="删除"><i class="fas fa-times"></i></button>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="add-skill-btn"><i class="fas fa-plus"></i> 添加技能</button>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="skills-editor-footer">
                <button class="cancel-btn">取消</button>
                <button class="save-btn"><i class="fas fa-save"></i> 保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    bindEditorEvents(modal, skills);
}

/**
 * 绑定编辑器事件
 */
function bindEditorEvents(modal, skills) {
    // 关闭按钮
    modal.querySelector('.close-editor-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // 切换标签
    modal.querySelectorAll('.editor-tab:not(.add-category-tab)').forEach(tab => {
        tab.addEventListener('click', () => {
            const index = tab.dataset.index;
            modal.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            modal.querySelector(`.editor-panel[data-index="${index}"]`).classList.add('active');
        });
    });
    
    // 滑块实时更新
    modal.querySelectorAll('.skill-level-input').forEach(input => {
        input.addEventListener('input', () => {
            input.nextElementSibling.textContent = `${input.value}%`;
        });
    });
    
    // 添加技能
    modal.querySelectorAll('.add-skill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.editor-panel');
            const list = panel.querySelector('.skills-list');
            const newIndex = list.children.length;
            
            const newItem = document.createElement('div');
            newItem.className = 'skill-edit-item';
            newItem.dataset.skillIndex = newIndex;
            newItem.innerHTML = `
                <input type="text" class="skill-name-input" value="" placeholder="技能名称">
                <input type="range" class="skill-level-input" min="0" max="100" value="50">
                <span class="skill-level-display">50%</span>
                <input type="color" class="skill-color-input" value="#5a7d9a">
                <button class="delete-skill-btn" title="删除"><i class="fas fa-times"></i></button>
            `;
            
            // 绑定新元素事件
            newItem.querySelector('.skill-level-input').addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
            });
            newItem.querySelector('.delete-skill-btn').addEventListener('click', () => {
                newItem.remove();
            });
            
            list.appendChild(newItem);
        });
    });
    
    // 删除技能
    modal.querySelectorAll('.delete-skill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.skill-edit-item').remove();
        });
    });
    
    // 删除分类
    modal.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.editor-panel');
            const index = panel.dataset.index;
            const tab = modal.querySelector(`.editor-tab[data-index="${index}"]`);
            
            if (modal.querySelectorAll('.editor-panel').length <= 1) {
                notify.warning('至少保留一个分类');
                return;
            }
            
            panel.remove();
            tab.remove();
            
            // 激活第一个
            const firstTab = modal.querySelector('.editor-tab:not(.add-category-tab)');
            const firstPanel = modal.querySelector('.editor-panel');
            if (firstTab && firstPanel) {
                firstTab.classList.add('active');
                firstPanel.classList.add('active');
            }
        });
    });
    
    // 添加分类
    modal.querySelector('.add-category-tab').addEventListener('click', () => {
        const panels = modal.querySelector('.editor-panels');
        const tabs = modal.querySelector('.editor-tabs');
        const newIndex = modal.querySelectorAll('.editor-panel').length;
        
        // 新标签
        const newTab = document.createElement('button');
        newTab.className = 'editor-tab';
        newTab.dataset.index = newIndex;
        newTab.textContent = '新分类';
        newTab.addEventListener('click', () => {
            modal.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
            newTab.classList.add('active');
            newPanel.classList.add('active');
        });
        tabs.insertBefore(newTab, modal.querySelector('.add-category-tab'));
        
        // 新面板
        const newPanel = document.createElement('div');
        newPanel.className = 'editor-panel';
        newPanel.dataset.index = newIndex;
        newPanel.innerHTML = `
            <div class="category-settings">
                <input type="text" class="category-name-input" value="新分类" placeholder="分类名称">
                <select class="category-icon-select">
                    <option value="fa-gamepad">🎮 游戏</option>
                    <option value="fa-paint-brush">🎨 绘画</option>
                    <option value="fa-code" selected>💻 代码</option>
                    <option value="fa-palette">🎨 调色板</option>
                    <option value="fa-cog">⚙️ 工具</option>
                    <option value="fa-database">📊 数据</option>
                    <option value="fa-globe">🌐 网络</option>
                    <option value="fa-mobile-alt">📱 移动</option>
                </select>
                <button class="delete-category-btn" title="删除分类"><i class="fas fa-trash"></i></button>
            </div>
            <div class="skills-list"></div>
            <button class="add-skill-btn"><i class="fas fa-plus"></i> 添加技能</button>
        `;
        
        // 绑定新面板事件
        newPanel.querySelector('.delete-category-btn').addEventListener('click', () => {
            newPanel.remove();
            newTab.remove();
            const firstTab = modal.querySelector('.editor-tab:not(.add-category-tab)');
            const firstPanel = modal.querySelector('.editor-panel');
            if (firstTab && firstPanel) {
                firstTab.classList.add('active');
                firstPanel.classList.add('active');
            }
        });
        
        newPanel.querySelector('.add-skill-btn').addEventListener('click', () => {
            const list = newPanel.querySelector('.skills-list');
            const newIndex = list.children.length;
            
            const newItem = document.createElement('div');
            newItem.className = 'skill-edit-item';
            newItem.dataset.skillIndex = newIndex;
            newItem.innerHTML = `
                <input type="text" class="skill-name-input" value="" placeholder="技能名称">
                <input type="range" class="skill-level-input" min="0" max="100" value="50">
                <span class="skill-level-display">50%</span>
                <input type="color" class="skill-color-input" value="#5a7d9a">
                <button class="delete-skill-btn" title="删除"><i class="fas fa-times"></i></button>
            `;
            
            newItem.querySelector('.skill-level-input').addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = `${e.target.value}%`;
            });
            newItem.querySelector('.delete-skill-btn').addEventListener('click', () => {
                newItem.remove();
            });
            
            list.appendChild(newItem);
        });
        
        panels.appendChild(newPanel);
        
        // 激活新创建的
        modal.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        modal.querySelectorAll('.editor-panel').forEach(p => p.classList.remove('active'));
        newTab.classList.add('active');
        newPanel.classList.add('active');
    });
    
    // 保存
    modal.querySelector('.save-btn').addEventListener('click', async () => {
        const newSkills = { categories: [] };
        
        modal.querySelectorAll('.editor-panel').forEach(panel => {
            const category = {
                name: panel.querySelector('.category-name-input').value || '未命名',
                icon: panel.querySelector('.category-icon-select').value,
                skills: []
            };
            
            panel.querySelectorAll('.skill-edit-item').forEach(item => {
                const name = item.querySelector('.skill-name-input').value;
                if (name) {
                    category.skills.push({
                        name: name,
                        level: parseInt(item.querySelector('.skill-level-input').value),
                        color: item.querySelector('.skill-color-input').value
                    });
                }
            });
            
            if (category.skills.length > 0 || category.name) {
                newSkills.categories.push(category);
            }
        });
        
        const success = await saveSkills(newSkills);
        if (success) {
            modal.remove();
            // 刷新显示
            const skillsContainer = document.querySelector('.skills-section')?.parentElement;
            if (skillsContainer) {
                renderSkills(skillsContainer);
            }
        }
    });
}

export default {
    getSkills,
    saveSkills,
    render: renderSkills
};

