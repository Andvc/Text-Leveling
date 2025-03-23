/**
 * GameAIIntegrator.js
 * 游戏与AI故事引擎的集成模块，负责协调游戏系统与AI生成系统的交互
 */

export class GameAIIntegrator {
    /**
     * 创建游戏AI集成器实例
     * @param {Object} game 游戏实例
     * @param {Object} aiStoryEngine AI故事引擎实例
     * @param {Object} config 配置选项
     */
    constructor(game, aiStoryEngine, config = {}) {
        this.game = game;
        this.aiStoryEngine = aiStoryEngine;
        this.config = {
            enableCache: true,
            dynamicEventPrefix: "ai_generated_",
            defaultEventType: "exploration",
            ...config
        };
        
        // 记录已生成的事件ID
        this.generatedEventIds = new Set();
        
        console.log("游戏AI集成器已初始化");
    }

    /**
     * 初始化集成器
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async initialize() {
        try {
            if (!this.aiStoryEngine) {
                console.error("无法初始化游戏AI集成器：AI故事引擎未提供");
                return false;
            }
            
            // 启用或禁用调试模式
            this.aiStoryEngine.setDebug(this.game.config.debugMode || false);
            
            // 如果游戏有注册事件的机制，注册事件处理
            if (this.game.eventManager && typeof this.game.eventManager.registerHandler === 'function') {
                this.game.eventManager.registerHandler(
                    this.config.dynamicEventPrefix + "*", 
                    this.handleDynamicEvent.bind(this)
                );
            }
            
            return true;
        } catch (error) {
            console.error("初始化游戏AI集成器失败:", error);
            return false;
        }
    }

    /**
     * 动态生成事件
     * @param {Object} options 生成选项
     * @param {string} options.type 事件类型
     * @param {string} options.location 地点
     * @param {Object} options.context 其他上下文信息
     * @returns {Promise<Object>} 生成的事件对象
     */
    async generateEvent(options = {}) {
        try {
            // 获取玩家状态
            const playerState = this.game.player.getState();
            
            // 获取当前位置（如果未提供）
            const location = options.location || this.game.player.getCurrentLocation() || "未知地点";
            
            // 获取事件类型
            const eventType = options.type || this.config.defaultEventType;
            
            // 获取最近的事件历史
            const recentEvents = this.game.eventManager.getRecentEvents(5);
            
            console.log(`正在生成${eventType}类型事件，地点：${location}`);
            
            // 构建AI生成上下文
            const context = {
                type: eventType,
                location: location,
                playerState: playerState,
                previousEvents: recentEvents,
                ...options.context
            };
            
            // 调用AI故事引擎生成事件
            const event = await this.aiStoryEngine.generateEvent(context);
            
            // 记录生成的事件ID
            if (event && event.event_id) {
                this.generatedEventIds.add(event.event_id);
            }
            
            // 添加事件到游戏事件管理器
            if (event && this.game.eventManager && typeof this.game.eventManager.addEvent === 'function') {
                this.game.eventManager.addEvent(event);
            }
            
            return event;
        } catch (error) {
            console.error("生成事件失败:", error);
            return this._createFallbackEvent(options);
        }
    }

    /**
     * 流式生成事件
     * @param {Object} options 生成选项
     * @param {Function} callback 回调函数，用于接收生成的内容
     * @returns {Promise<void>}
     */
    async streamEvent(options = {}, callback) {
        try {
            // 获取玩家状态
            const playerState = this.game.player.getState();
            
            // 获取当前位置（如果未提供）
            const location = options.location || this.game.player.getCurrentLocation() || "未知地点";
            
            // 获取事件类型
            const eventType = options.type || this.config.defaultEventType;
            
            // 获取最近的事件历史
            const recentEvents = this.game.eventManager.getRecentEvents(5);
            
            // 构建AI生成上下文
            const context = {
                type: eventType,
                location: location,
                playerState: playerState,
                previousEvents: recentEvents,
                ...options.context
            };
            
            // 调用AI故事引擎流式生成事件
            await this.aiStoryEngine.streamEvent(context, (event, isComplete) => {
                callback(event, isComplete);
                
                // 如果生成完成，记录事件并添加到游戏
                if (isComplete && event && !event.error) {
                    // 记录生成的事件ID
                    if (event.event_id) {
                        this.generatedEventIds.add(event.event_id);
                    }
                    
                    // 添加事件到游戏事件管理器
                    if (this.game.eventManager && typeof this.game.eventManager.addEvent === 'function') {
                        this.game.eventManager.addEvent(event);
                    }
                }
            });
        } catch (error) {
            console.error("流式生成事件失败:", error);
            callback(this._createFallbackEvent(options), true);
        }
    }

    /**
     * 处理动态事件（可供游戏事件系统调用）
     * @param {string} eventId 事件ID
     * @param {Object} context 上下文信息
     * @returns {Promise<Object>} 处理结果
     */
    async handleDynamicEvent(eventId, context = {}) {
        // 如果已经有这个ID的事件，直接返回
        if (this.generatedEventIds.has(eventId)) {
            return { success: true, eventId };
        }
        
        // 从事件ID解析信息
        const info = this._parseEventId(eventId);
        
        // 生成事件
        const event = await this.generateEvent({
            type: info.type,
            location: info.location,
            context: context
        });
        
        return {
            success: !!event,
            eventId: event ? event.event_id : null,
            event: event
        };
    }

    /**
     * 检查给定的事件ID是否是动态生成的
     * @param {string} eventId 事件ID
     * @returns {boolean} 是否是动态生成的事件
     */
    isDynamicEvent(eventId) {
        return eventId && (
            eventId.startsWith(this.config.dynamicEventPrefix) || 
            this.generatedEventIds.has(eventId)
        );
    }

    /**
     * 创建后备事件（当生成失败时使用）
     * @param {Object} options 生成选项
     * @returns {Object} 后备事件对象
     * @private
     */
    _createFallbackEvent(options = {}) {
        const location = options.location || this.game.player.getCurrentLocation() || "未知地点";
        const timestamp = Date.now().toString(36).slice(-4);
        const eventId = `fallback_${location.toLowerCase().replace(/\s+/g, "_")}_${timestamp}`;
        
        return {
            event_id: eventId,
            title: "意外的发现",
            description: "在前行的过程中，你遇到了一些意想不到的情况。可能是由于环境变化或是你的感知出现了偏差，周围的景象变得有些模糊不清。你需要决定如何应对这个情况。",
            choices: [
                {
                    text: "环顾四周",
                    conditions: [],
                    results: [
                        { 
                            type: "next_event", 
                            event_id: this.game.eventManager.getLastEventId() || "game_intro" 
                        }
                    ]
                },
                {
                    text: "继续前进",
                    conditions: [],
                    results: [
                        { 
                            type: "next_event", 
                            event_id: "exploration_continue" 
                        }
                    ]
                }
            ]
        };
    }

    /**
     * 从事件ID解析信息
     * @param {string} eventId 事件ID
     * @returns {Object} 解析后的信息
     * @private
     */
    _parseEventId(eventId) {
        // 移除前缀
        const cleanId = eventId.replace(this.config.dynamicEventPrefix, "");
        
        // 尝试解析类型和位置
        const parts = cleanId.split("_");
        
        // 默认值
        let type = this.config.defaultEventType;
        let location = "unknown";
        
        // 尝试提取类型
        const knownTypes = ["exploration", "combat", "dialogue", "puzzle", "rest", "encounter"];
        if (parts.length > 0 && knownTypes.includes(parts[0])) {
            type = parts[0];
            parts.shift();
        }
        
        // 剩余部分作为位置
        if (parts.length > 0) {
            location = parts.join("_").replace(/_/g, " ");
        }
        
        return { type, location };
    }
}

// 导出GameAIIntegrator类
export default GameAIIntegrator; 