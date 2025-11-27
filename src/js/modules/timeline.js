/**
 * 时间线模块
 * 展示学习/工作经历，支持管理员编辑
 */

import { getData, setData, isAdmin, getRef } from './firebase.js';
import { isUsingProxy } from '../utils/proxy-db.js';
import notify from './notification.js';

// 默认时间线数据
const DEFAULT_TIMELINE = {
    events: [
        {
            date: '2024',
            title: '深入技术美术',
            description: '专注于 Shader 开发和程序化内容生成，探索实时渲染的更多可能性。',
            icon: 'fa-rocket',
            type: 'milestone'
        },
        {
            date: '2023',
            title: '开始游戏开发之旅',
            description: '学习 Unity 和 Unreal Engine，完成第一个游戏 Demo。',
            icon: 'fa-gamepad',
            type: 'achievement'
        },
        {
            date: '2022',
            title: '接触图形学',
            description: '开始学习计算机图形学基础，了解渲染管线原理。',
            icon: 'fa-lightbulb',
            type: 'learning'
        },
        {
            date: '2021',
            title: '编程入门',
            description: '开始系统学习编程，从 Python 和 C# 起步。',
            icon: 'fa-code',
            type: 'learning'
        }
    ]
};

// 事件类型配置
const EVENT_TYPES = {
    milestone: { label: '里程碑', color: '#e74c3c' },
    achievement: { label: '成就', color: '#27ae60' },
    learning: { label: '学习', color: '#3498db' },
    work: { label: '工作', color: '#9b59b6' },
    project: { label: '项目', color: '#f39c12' }
};

// 缓存时间线数据
let timelineData = null;

/**
 * 获取时间线数据
 */
export async function getTimeline() {
    if (timelineData) return timelineData;
    
    try {
        const data = await getData('timeline');
        timelineData = data || DEFAULT_TIMELINE;
    } catch (error) {
        console.error('获取时间线数据失败:', error);
        timelineData = DEFAULT_TIMELINE;
    }
    
    return timelineData;
}

/**
 * 保存时间线数据
 * 注意：写入操作需要认证，代理模式下会尝试直连 Firebase
 */
export async function saveTimeline(data) {
    try {
        // 如果在代理模式下，尝试直连 Firebase 进行写入（需要科学上网）
        if (isUsingProxy()) {
            try {
                // 直接使用 Firebase SDK 写入
                await getRef('timeline').set(data);
            } catch (directError) {
                console.error('直连写入失败，可能需要科学上网:', directError);
                notify.error('保存失败：写入操作需要科学上网');
                return false;
            }
        } else {
            await setData('timeline', data);
        }
        
        timelineData = data;
        notify.success('时间线保存成功');
        return true;
    } catch (error) {
        console.error('保存时间线失败:', error);
        notify.error('保存失败');
        return false;
    }
}

/**
 * 渲染时间线
 * @param {HTMLElement} container - 容器元素
 */
export async function renderTimeline(container) {
    if (!container) return;
    
    const timeline = await getTimeline();
    const admin = isAdmin();
    
    let html = `
        <div class="timeline-section">
            <div class="timeline-header">
                <h2><i class="fas fa-stream"></i> 成长历程</h2>
                ${admin ? '<button class="edit-timeline-btn" title="编辑时间线"><i class="fas fa-edit"></i></button>' : ''}
            </div>
            <div class="timeline-container">
                <div class="timeline-line"></div>
    `;
    
    timeline.events.forEach((event, index) => {
        const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.learning;
        const isLeft = index % 2 === 0;
        
        html += `
            <div class="timeline-item ${isLeft ? 'left' : 'right'}" style="--delay: ${index * 0.1}s">
                <div class="timeline-dot" style="--dot-color: ${typeConfig.color}">
                    <i class="fas ${event.icon}"></i>
                </div>
                <div class="timeline-content">
                    <span class="timeline-date">${event.date}</span>
                    <span class="timeline-type" style="--type-color: ${typeConfig.color}">${typeConfig.label}</span>
                    <h3 class="timeline-title">${event.title}</h3>
                    <p class="timeline-desc">${event.description}</p>
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
        container.querySelectorAll('.timeline-item').forEach(item => {
            item.classList.add('animate');
        });
    }, 100);
    
    // 绑定编辑按钮
    if (admin) {
        const editBtn = container.querySelector('.edit-timeline-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => openTimelineEditor(timeline));
        }
    }
}

/**
 * 打开时间线编辑器
 */
function openTimelineEditor(timeline) {
    const modal = document.createElement('div');
    modal.className = 'timeline-editor-modal';
    
    modal.innerHTML = `
        <div class="timeline-editor-content">
            <div class="timeline-editor-header">
                <h3><i class="fas fa-edit"></i> 编辑时间线</h3>
                <button class="close-editor-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="timeline-editor-body">
                <div class="timeline-events-list">
                    ${timeline.events.map((event, index) => createEventEditorItem(event, index)).join('')}
                </div>
                <button class="add-event-btn"><i class="fas fa-plus"></i> 添加事件</button>
            </div>
            <div class="timeline-editor-footer">
                <button class="cancel-btn">取消</button>
                <button class="save-btn"><i class="fas fa-save"></i> 保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    bindTimelineEditorEvents(modal, timeline);
}

/**
 * 创建事件编辑项 HTML
 */
function createEventEditorItem(event, index) {
    return `
        <div class="event-edit-item" data-index="${index}">
            <div class="event-edit-header">
                <span class="event-drag-handle"><i class="fas fa-grip-vertical"></i></span>
                <input type="text" class="event-date-input" value="${event.date}" placeholder="日期（如：2024）">
                <select class="event-type-select">
                    ${Object.entries(EVENT_TYPES).map(([key, val]) => 
                        `<option value="${key}" ${event.type === key ? 'selected' : ''}>${val.label}</option>`
                    ).join('')}
                </select>
                <button class="delete-event-btn" title="删除"><i class="fas fa-trash"></i></button>
            </div>
            <div class="event-edit-body">
                <input type="text" class="event-title-input" value="${event.title}" placeholder="标题">
                <textarea class="event-desc-input" placeholder="描述">${event.description}</textarea>
                <div class="event-icon-selector">
                    <span>图标：</span>
                    <div class="icon-options">
                        ${['fa-rocket', 'fa-gamepad', 'fa-lightbulb', 'fa-code', 'fa-graduation-cap', 'fa-briefcase', 'fa-star', 'fa-trophy', 'fa-heart', 'fa-flag', 'fa-bookmark', 'fa-bolt'].map(icon => 
                            `<button class="icon-option ${event.icon === icon ? 'selected' : ''}" data-icon="${icon}"><i class="fas ${icon}"></i></button>`
                        ).join('')}
                    </div>
                    <input type="hidden" class="event-icon-input" value="${event.icon}">
                </div>
            </div>
        </div>
    `;
}

/**
 * 绑定时间线编辑器事件
 */
function bindTimelineEditorEvents(modal, timeline) {
    // 关闭按钮
    modal.querySelector('.close-editor-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    // 图标选择
    modal.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.event-icon-selector');
            parent.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            parent.querySelector('.event-icon-input').value = btn.dataset.icon;
        });
    });
    
    // 删除事件
    modal.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.event-edit-item');
            if (modal.querySelectorAll('.event-edit-item').length <= 1) {
                notify.warning('至少保留一个事件');
                return;
            }
            item.remove();
        });
    });
    
    // 添加事件
    modal.querySelector('.add-event-btn').addEventListener('click', () => {
        const list = modal.querySelector('.timeline-events-list');
        const newIndex = list.children.length;
        
        const newEvent = {
            date: new Date().getFullYear().toString(),
            title: '',
            description: '',
            icon: 'fa-star',
            type: 'milestone'
        };
        
        const newItem = document.createElement('div');
        newItem.innerHTML = createEventEditorItem(newEvent, newIndex);
        const itemElement = newItem.firstElementChild;
        
        // 绑定新元素事件
        itemElement.querySelectorAll('.icon-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.closest('.event-icon-selector');
                parent.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                parent.querySelector('.event-icon-input').value = btn.dataset.icon;
            });
        });
        
        itemElement.querySelector('.delete-event-btn').addEventListener('click', () => {
            if (modal.querySelectorAll('.event-edit-item').length <= 1) {
                notify.warning('至少保留一个事件');
                return;
            }
            itemElement.remove();
        });
        
        list.appendChild(itemElement);
        
        // 滚动到新添加的项
        itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // 保存
    modal.querySelector('.save-btn').addEventListener('click', async () => {
        const newTimeline = { events: [] };
        
        modal.querySelectorAll('.event-edit-item').forEach(item => {
            const title = item.querySelector('.event-title-input').value;
            
            newTimeline.events.push({
                date: item.querySelector('.event-date-input').value || new Date().getFullYear().toString(),
                title: title || '未命名事件',
                description: item.querySelector('.event-desc-input').value || '',
                icon: item.querySelector('.event-icon-input').value || 'fa-star',
                type: item.querySelector('.event-type-select').value || 'milestone'
            });
        });
        
        const success = await saveTimeline(newTimeline);
        if (success) {
            modal.remove();
            // 刷新显示
            const timelineContainer = document.querySelector('.timeline-section')?.parentElement;
            if (timelineContainer) {
                renderTimeline(timelineContainer);
            }
        }
    });
}

export default {
    getTimeline,
    saveTimeline,
    render: renderTimeline
};

