/**
 * 游戏状态跟踪器 - 负责记录和管理游戏状态，供AI参考
 * 
 * 该类跟踪玩家的属性、物品栏、标记以及游戏历史，为AI内容生成提供必要的上下文。
 * 它可以记录玩家的选择历史，管理状态变化，并提供当前游戏状态的快照。
 */
export class GameStateTracker {
    /**
     * 创建游戏状态跟踪器实例
     */
    constructor() {
        this.resetState();
    }

    /**
     * 重置游戏状态
     */
    resetState() {
        this.currentState = {
            playerState: {
                attributes: {},
                inventory: [],
                flags: {}
            },
            eventHistory: [],
            choiceHistory: []
        };
    }

    /**
     * 更新游戏状态
     * @param {Object} playerState 玩家状态
     * @param {Array} previousEvents 之前的事件
     */
    updateState(playerState, previousEvents = []) {
        if (playerState) {
            this.currentState.playerState = this._deepCopy(playerState);
        }
        
        if (previousEvents && previousEvents.length > 0) {
            // 只保留最后10个事件作为历史记录
            this.currentState.eventHistory = previousEvents.slice(-10);
        }
    }

    /**
     * 更新玩家属性
     * @param {string} attribute 属性名
     * @param {number|string} value 属性值
     */
    updateAttribute(attribute, value) {
        if (!this.currentState.playerState.attributes) {
            this.currentState.playerState.attributes = {};
        }
        
        this.currentState.playerState.attributes[attribute] = value;
    }

    /**
     * 更新多个玩家属性
     * @param {Object} attributes 属性对象，键为属性名，值为属性值
     */
    updateAttributes(attributes) {
        if (!attributes) return;
        
        Object.entries(attributes).forEach(([attribute, value]) => {
            this.updateAttribute(attribute, value);
        });
    }

    /**
     * 添加物品到物品栏
     * @param {string} itemId 物品ID
     * @param {string} itemName 物品名称
     * @param {number} amount 数量
     */
    addItem(itemId, itemName, amount = 1) {
        if (!this.currentState.playerState.inventory) {
            this.currentState.playerState.inventory = [];
        }
        
        // 检查物品是否已存在
        const existingItem = this.currentState.playerState.inventory.find(item => item.id === itemId);
        
        if (existingItem) {
            // 如果物品已存在，增加数量
            existingItem.amount += amount;
        } else {
            // 如果物品不存在，添加新物品
            this.currentState.playerState.inventory.push({
                id: itemId,
                name: itemName,
                amount: amount
            });
        }
    }

    /**
     * 从物品栏移除物品
     * @param {string} itemId 物品ID
     * @param {number} amount 数量
     * @returns {boolean} 是否成功移除
     */
    removeItem(itemId, amount = 1) {
        if (!this.currentState.playerState.inventory) {
            return false;
        }
        
        const itemIndex = this.currentState.playerState.inventory.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return false;
        }
        
        const item = this.currentState.playerState.inventory[itemIndex];
        
        if (item.amount <= amount) {
            // 如果移除数量大于等于现有数量，移除整个物品
            this.currentState.playerState.inventory.splice(itemIndex, 1);
        } else {
            // 否则减少数量
            item.amount -= amount;
        }
        
        return true;
    }

    /**
     * 设置游戏标记
     * @param {string} flag 标记名
     * @param {boolean|string|number} value 标记值
     */
    setFlag(flag, value) {
        if (!this.currentState.playerState.flags) {
            this.currentState.playerState.flags = {};
        }
        
        this.currentState.playerState.flags[flag] = value;
    }

    /**
     * 获取游戏标记值
     * @param {string} flag 标记名
     * @returns {boolean|string|number|null} 标记值，如果不存在则返回null
     */
    getFlag(flag) {
        if (!this.currentState.playerState.flags) {
            return null;
        }
        
        return this.currentState.playerState.flags[flag] !== undefined ? 
            this.currentState.playerState.flags[flag] : null;
    }

    /**
     * 添加事件到历史记录
     * @param {Object} event 事件对象
     * @param {number} choiceIndex 做出的选择索引
     */
    addEventToHistory(event, choiceIndex) {
        if (!event) return;
        
        // 添加事件到历史记录
        this.currentState.eventHistory.push(this._simplifyEvent(event));
        
        // 添加选择到历史记录
        if (event.choices && event.choices[choiceIndex]) {
            this.currentState.choiceHistory.push({
                eventId: event.event_id,
                choiceText: event.choices[choiceIndex].text,
                choiceIndex: choiceIndex
            });
        }
        
        // 限制历史记录长度，只保留最近的10个事件
        if (this.currentState.eventHistory.length > 10) {
            this.currentState.eventHistory.shift();
        }
        
        // 限制选择历史记录长度，只保留最近的20个选择
        if (this.currentState.choiceHistory.length > 20) {
            this.currentState.choiceHistory.shift();
        }
    }

    /**
     * 获取完整的游戏状态
     * @returns {Object} 游戏状态对象
     */
    getState() {
        return this._deepCopy(this.currentState);
    }

    /**
     * 获取玩家状态
     * @returns {Object} 玩家状态对象
     */
    getPlayerState() {
        return this._deepCopy(this.currentState.playerState);
    }

    /**
     * 获取事件历史
     * @param {number} limit 限制数量
     * @returns {Array} 事件历史数组
     */
    getEventHistory(limit = 10) {
        const history = this._deepCopy(this.currentState.eventHistory);
        return limit ? history.slice(-limit) : history;
    }

    /**
     * 获取选择历史
     * @param {number} limit 限制数量
     * @returns {Array} 选择历史数组
     */
    getChoiceHistory(limit = 20) {
        const history = this._deepCopy(this.currentState.choiceHistory);
        return limit ? history.slice(-limit) : history;
    }

    /**
     * 创建游戏状态的快照
     * @returns {string} 游戏状态的JSON字符串
     */
    createSnapshot() {
        return JSON.stringify(this.currentState);
    }

    /**
     * 从快照恢复游戏状态
     * @param {string} snapshot 游戏状态的JSON字符串
     * @returns {boolean} 是否成功恢复
     */
    restoreFromSnapshot(snapshot) {
        try {
            const state = JSON.parse(snapshot);
            this.currentState = state;
            return true;
        } catch (error) {
            console.error('恢复游戏状态失败:', error);
            return false;
        }
    }

    /**
     * 简化事件对象，只保留必要信息
     * @param {Object} event 完整事件对象
     * @returns {Object} 简化后的事件对象
     * @private
     */
    _simplifyEvent(event) {
        return {
            event_id: event.event_id,
            title: event.title,
            description: event.description
        };
    }

    /**
     * 深拷贝对象
     * @param {Object} obj 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     * @private
     */
    _deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
} 