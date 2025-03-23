/**
 * AIStoryEngineDemo.js
 * 演示和测试AI故事引擎的功能
 */

import { AIStoryEngine } from '../AIStoryEngine.js';
import { AIServiceConnector } from '../services/AIServiceConnector.js';
import { PromptManager } from '../prompts/PromptManager.js';
import { GameStateTracker } from '../state/GameStateTracker.js';
import { EventAdapter } from '../adapters/EventAdapter.js';
import config from '../../../config.json' assert { type: 'json' };

// 全局变量
let storyEngine = null;
let apiKey = null;
let defaultModel = 'gpt-3.5-turbo';

// 创建示例状态
const playerState = {
    attributes: {
        health: 100,
        strength: 15,
        intelligence: 12,
        charisma: 10
    },
    inventory: [
        { id: "wooden_sword", amount: 1 },
        { id: "healing_potion", amount: 3 }
    ],
    flags: {
        met_villager: true,
        found_treasure: false
    }
};

/**
 * 初始化演示
 */
export async function initDemo() {
    console.log('正在初始化AI故事引擎演示...');
    
    // 尝试从本地存储获取API密钥
    apiKey = localStorage.getItem('aiStoryEngineApiKey');
    const model = localStorage.getItem('aiStoryEngineModel') || defaultModel;
    
    // 更新UI显示
    document.getElementById('api-key').value = apiKey ? '********' + apiKey.slice(-4) : '未设置';
    document.getElementById('model').value = model;
    
    // 启用按钮
    document.getElementById('set-api-key-btn').disabled = false;
    
    // 如果有API密钥，初始化引擎
    if (apiKey) {
        await initializeEngine(apiKey, model);
        document.getElementById('generate-btn').disabled = false;
        document.getElementById('status').textContent = '引擎已就绪';
    } else {
        document.getElementById('status').textContent = '请设置API密钥';
    }
}

/**
 * 设置API密钥
 */
export async function setApiKey() {
    const newApiKey = document.getElementById('api-key-input').value.trim();
    
    if (!newApiKey) {
        alert('请输入有效的API密钥');
        return;
    }
    
    // 保存到本地存储
    localStorage.setItem('aiStoryEngineApiKey', newApiKey);
    apiKey = newApiKey;
    
    // 更新UI显示
    document.getElementById('api-key').value = '********' + apiKey.slice(-4);
    document.getElementById('api-key-input').value = '';
    
    // 初始化引擎
    document.getElementById('status').textContent = '初始化引擎中...';
    await initializeEngine(apiKey, defaultModel);
    
    // 启用生成按钮
    document.getElementById('generate-btn').disabled = false;
    document.getElementById('status').textContent = '引擎已就绪';
}

/**
 * 初始化AI故事引擎及其依赖组件
 */
async function initializeEngine(apiKey, model) {
    try {
        // 创建服务连接器
        const serviceConnector = new AIServiceConnector(apiKey, {
            model: model,
            maxRetries: 2
        });
        
        // 创建提示词管理器
        const promptManager = new PromptManager();
        
        // 创建游戏状态跟踪器
        const stateTracker = new GameStateTracker();
        
        // 创建事件适配器
        const eventAdapter = new EventAdapter();
        
        // 创建故事引擎
        storyEngine = new AIStoryEngine({
            serviceConnector,
            promptManager,
            stateTracker,
            eventAdapter
        });
        
        return true;
    } catch (error) {
        console.error('初始化引擎失败:', error);
        document.getElementById('status').textContent = '初始化失败: ' + error.message;
        return false;
    }
}

/**
 * 生成测试事件
 */
export async function generateTestEvent() {
    if (!storyEngine) {
        alert('AI故事引擎未初始化，请先设置API密钥');
        return;
    }
    
    const promptType = document.getElementById('prompt-type').value;
    const location = document.getElementById('location-input').value;
    
    // 禁用按钮防止重复点击
    document.getElementById('generate-btn').disabled = true;
    document.getElementById('status').textContent = '正在生成事件...';
    
    try {
        // 模拟玩家状态
        const playerState = {
            attributes: {
                strength: 12,
                intelligence: 15,
                charisma: 10,
                health: 80,
                mana: 50
            },
            inventory: [
                { id: 'dagger', name: '匕首', amount: 1 },
                { id: 'health_potion', name: '生命药水', amount: 3 }
            ],
            flags: {
                has_met_elder: true,
                knows_about_crystal: false
            }
        };
        
        // 生成上下文
        const context = {
            type: promptType,
            location: location,
            playerState: playerState,
            previousEvents: []
        };
        
        // 生成事件
        const event = await storyEngine.generateEvent(context);
        
        // 显示结果
        displayResult(event);
        
        document.getElementById('status').textContent = '生成完成';
    } catch (error) {
        console.error('生成事件失败:', error);
        document.getElementById('status').textContent = '生成失败: ' + error.message;
        
        // 显示错误信息
        const resultContainer = document.getElementById('result');
        resultContainer.innerHTML = `
            <h3>生成失败</h3>
            <p>错误信息: ${error.message}</p>
            <p>请检查API密钥是否有效，以及网络连接是否正常。</p>
        `;
    } finally {
        // 重新启用按钮
        document.getElementById('generate-btn').disabled = false;
    }
}

/**
 * 显示生成的事件
 */
function displayResult(event) {
    const resultContainer = document.getElementById('result');
    
    // 清空现有内容
    resultContainer.innerHTML = '';
    
    // 添加标题
    const titleElement = document.createElement('h3');
    titleElement.textContent = event.title;
    resultContainer.appendChild(titleElement);
    
    // 添加描述
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = event.description;
    resultContainer.appendChild(descriptionElement);
    
    // 添加选项
    if (event.choices && event.choices.length > 0) {
        const choicesTitle = document.createElement('h4');
        choicesTitle.textContent = '可用选项:';
        resultContainer.appendChild(choicesTitle);
        
        const choicesList = document.createElement('div');
        event.choices.forEach((choice, index) => {
            const choiceItem = document.createElement('div');
            choiceItem.style.margin = '10px 0';
            choiceItem.style.padding = '10px';
            choiceItem.style.backgroundColor = '#f5f5f5';
            choiceItem.style.borderRadius = '4px';
            
            // 选项文本
            const choiceText = document.createElement('div');
            choiceText.innerHTML = `<strong>${index + 1}. ${choice.text}</strong>`;
            choiceItem.appendChild(choiceText);
            
            // 条件（如果有）
            if (choice.conditions && choice.conditions.length > 0) {
                const conditionsElement = document.createElement('div');
                conditionsElement.className = 'conditions';
                conditionsElement.innerHTML = '<strong>条件:</strong> ' + choice.conditions.map(c => {
                    if (c.type === 'attribute') {
                        return `${c.attribute} ${c.operator} ${c.value}`;
                    } else if (c.type === 'item') {
                        return `持有 ${c.item_id}`;
                    } else if (c.type === 'flag') {
                        return `标记 ${c.flag} = ${c.value}`;
                    }
                    return JSON.stringify(c);
                }).join(', ');
                choiceItem.appendChild(conditionsElement);
            }
            
            // 结果（如果有）
            if (choice.results && choice.results.length > 0) {
                const resultsElement = document.createElement('div');
                resultsElement.className = 'conditions';
                resultsElement.innerHTML = '<strong>结果:</strong> ' + choice.results.map(r => {
                    if (r.type === 'next_event') {
                        return `跳转到事件 ${r.event_id}`;
                    } else if (r.type === 'attribute_change') {
                        return `${r.attribute} ${r.value >= 0 ? '+' : ''}${r.value}`;
                    } else if (r.type === 'flag_set') {
                        return `设置标记 ${r.flag} = ${r.value}`;
                    } else if (r.type === 'item_add') {
                        return `获得物品 ${r.item_id} x${r.amount || 1}`;
                    } else if (r.type === 'item_remove') {
                        return `失去物品 ${r.item_id} x${r.amount || 1}`;
                    }
                    return JSON.stringify(r);
                }).join(', ');
                choiceItem.appendChild(resultsElement);
            }
            
            choicesList.appendChild(choiceItem);
        });
        resultContainer.appendChild(choicesList);
    }
    
    // 添加原始JSON数据（可折叠）
    const jsonContainer = document.createElement('details');
    const jsonSummary = document.createElement('summary');
    jsonSummary.textContent = '查看原始JSON数据';
    jsonContainer.appendChild(jsonSummary);
    
    const jsonContent = document.createElement('pre');
    jsonContent.className = 'json-data';
    jsonContent.textContent = JSON.stringify(event, null, 2);
    jsonContainer.appendChild(jsonContent);
    
    resultContainer.appendChild(jsonContainer);
}

// 导出函数供HTML使用
window.initDemo = initDemo;
window.generateTestEvent = generateTestEvent;
window.setApiKey = setApiKey; 