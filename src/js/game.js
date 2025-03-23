/**
 * 文本冒险游戏 - 游戏主脚本
 */

// 游戏状态
const gameState = {
    // 当前事件
    currentEvent: null,
    // 玩家属性
    playerAttributes: {
        health: 100,
        strength: 10,
        intelligence: 10
    },
    // 玩家背包
    inventory: []
};

// DOM元素引用
const elements = {
    eventTitle: document.getElementById('eventTitle'),
    eventDescription: document.getElementById('eventDescription'),
    choicesContainer: document.getElementById('choicesContainer'),
    healthValue: document.getElementById('healthValue'),
    strengthValue: document.getElementById('strengthValue'),
    intelligenceValue: document.getElementById('intelligenceValue'),
    inventoryButton: document.getElementById('inventoryButton')
};

// 游戏初始化
async function initGame() {
    try {
        // 加载事件数据
        const eventsResponse = await fetch('/src/data/events/events.json');
        const eventsData = await eventsResponse.json();
        
        // 加载物品数据
        const itemsResponse = await fetch('/src/data/items/items.json');
        const itemsData = await itemsResponse.json();
        
        // 加载属性数据
        const attributesResponse = await fetch('/src/data/attributes/attributes.json');
        const attributesData = await attributesResponse.json();
        
        // 保存游戏数据
        window.gameData = {
            events: eventsData,
            items: itemsData,
            attributes: attributesData
        };
        
        // 开始游戏，从第一个事件开始
        startGameWithEvent('game_intro');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        elements.eventTitle.textContent = '加载失败';
        elements.eventDescription.textContent = `游戏数据加载失败: ${error.message}`;
    }
}

// 开始游戏
function startGameWithEvent(eventId) {
    // 获取事件数据
    const eventData = window.gameData.events[eventId];
    if (!eventData) {
        console.error(`事件 ${eventId} 不存在`);
        return;
    }
    
    // 设置当前事件
    gameState.currentEvent = eventData;
    
    // 更新界面
    updateEventDisplay();
    updatePlayerStatus();
}

// 更新事件显示
function updateEventDisplay() {
    const event = gameState.currentEvent;
    
    // 更新标题和描述
    elements.eventTitle.textContent = event.title;
    elements.eventDescription.textContent = event.description;
    
    // 清空选项容器
    elements.choicesContainer.innerHTML = '';
    
    // 添加选项按钮
    event.choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = choice.text;
        
        // 检查选项是否有条件
        let isAvailable = true;
        if (choice.conditions && choice.conditions.length > 0) {
            isAvailable = checkConditions(choice.conditions);
        }
        
        if (!isAvailable) {
            button.disabled = true;
            button.title = '不满足选择条件';
        } else {
            button.addEventListener('click', () => handleChoice(choice));
        }
        
        elements.choicesContainer.appendChild(button);
    });
}

// 检查条件
function checkConditions(conditions) {
    return conditions.every(condition => {
        switch (condition.type) {
            case 'attribute':
                const attributeValue = gameState.playerAttributes[condition.attribute];
                switch (condition.operator) {
                    case '>': return attributeValue > condition.value;
                    case '>=': return attributeValue >= condition.value;
                    case '<': return attributeValue < condition.value;
                    case '<=': return attributeValue <= condition.value;
                    case '==': return attributeValue === condition.value;
                    default: return false;
                }
            case 'has_item':
                return gameState.inventory.some(item => item.id === condition.item_id);
            default:
                return false;
        }
    });
}

// 处理选择
function handleChoice(choice) {
    // 应用选择的结果
    if (choice.results && choice.results.length > 0) {
        for (const result of choice.results) {
            applyResult(result);
        }
    }
}

// 应用结果
function applyResult(result) {
    switch (result.type) {
        case 'next_event':
            startGameWithEvent(result.event_id);
            break;
        case 'attribute_change':
            gameState.playerAttributes[result.attribute] += result.value;
            updatePlayerStatus();
            break;
        case 'item_gain':
            const item = window.gameData.items[result.item_id];
            if (item) {
                gameState.inventory.push(item);
                showMessage(`获得物品: ${item.name}`);
            }
            break;
        case 'item_use':
            // 从背包中移除物品
            const itemIndex = gameState.inventory.findIndex(i => i.id === result.item_id);
            if (itemIndex !== -1) {
                const usedItem = gameState.inventory.splice(itemIndex, 1)[0];
                showMessage(`使用物品: ${usedItem.name}`);
                
                // 应用物品效果
                if (usedItem.effects && usedItem.effects.length > 0) {
                    for (const effect of usedItem.effects) {
                        applyItemEffect(effect);
                    }
                }
            }
            break;
        default:
            console.warn(`未知结果类型: ${result.type}`);
    }
}

// 应用物品效果
function applyItemEffect(effect) {
    switch (effect.type) {
        case 'attribute_change':
            gameState.playerAttributes[effect.attribute] += effect.value;
            updatePlayerStatus();
            break;
        default:
            console.warn(`未知物品效果类型: ${effect.type}`);
    }
}

// 更新玩家状态显示
function updatePlayerStatus() {
    elements.healthValue.textContent = gameState.playerAttributes.health;
    elements.strengthValue.textContent = gameState.playerAttributes.strength;
    elements.intelligenceValue.textContent = gameState.playerAttributes.intelligence;
}

// 显示消息
function showMessage(message) {
    // 简单实现，未来可改进
    alert(message);
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame); 