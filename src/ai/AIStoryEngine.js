/**
 * AIStoryEngine.js
 * AI故事引擎核心，整合所有AI组件，提供对外接口
 */

import AIServiceConnector from './services/AIServiceConnector.js';
import PromptManager from './prompts/PromptManager.js';
import GameStateTracker from './state/GameStateTracker.js';
import EventAdapter from './adapters/EventAdapter.js';
import CacheManager from './utils/CacheManager.js';
import ErrorHandler from './utils/ErrorHandler.js';

/**
 * AI故事引擎 - 负责协调各组件生成动态故事内容
 * 
 * 这个类是AI动态故事生成系统的核心，负责整合服务连接器、提示词管理器、
 * 游戏状态跟踪器和事件适配器，并协调它们的工作流程，最终生成符合游戏
 * 规则和上下文的动态故事事件。
 */
export class AIStoryEngine {
    /**
     * 创建AI故事引擎实例
     * @param {Object} config 配置对象
     * @param {AIServiceConnector} config.serviceConnector AI服务连接器
     * @param {PromptManager} config.promptManager 提示词管理器
     * @param {GameStateTracker} config.stateTracker 游戏状态跟踪器
     * @param {EventAdapter} config.eventAdapter 事件适配器
     */
    constructor({ serviceConnector, promptManager, stateTracker, eventAdapter }) {
        this.serviceConnector = serviceConnector;
        this.promptManager = promptManager;
        this.stateTracker = stateTracker;
        this.eventAdapter = eventAdapter;
        this.isInitialized = false;
        this.debug = false;
    }

    /**
     * 启用或禁用调试模式
     * @param {boolean} enabled 是否启用调试
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 生成新的故事事件
     * @param {Object} context 上下文信息
     * @param {string} context.type 事件类型
     * @param {string} context.location 地点
     * @param {Object} context.playerState 玩家状态
     * @param {Array} context.previousEvents 之前的事件
     * @returns {Promise<Object>} 生成的事件对象
     */
    async generateEvent(context) {
        this._log('开始生成事件', context);

        try {
            // 1. 记录当前游戏状态
            this.stateTracker.updateState(context.playerState, context.previousEvents);
            
            // 2. 基于上下文构建提示词
            const prompt = await this.promptManager.buildPrompt({
                type: context.type || 'exploration',
                location: context.location,
                playerState: context.playerState,
                previousEvents: context.previousEvents || []
            });
            
            this._log('生成的提示词', prompt);
            
            // 3. 调用AI服务生成内容
            const generatedContent = await this.serviceConnector.generateContent(prompt);
            
            this._log('AI生成的原始内容', generatedContent);
            
            // 4. 解析和适配为游戏事件格式
            const gameEvent = await this.eventAdapter.adaptToGameEvent(generatedContent, context);
            
            this._log('适配后的游戏事件', gameEvent);
            
            // 5. 验证事件格式
            this._validateEvent(gameEvent);
            
            return gameEvent;
        } catch (error) {
            this._logError('生成事件失败', error);
            throw new Error(`生成事件失败: ${error.message}`);
        }
    }

    /**
     * 流式生成故事事件
     * @param {Object} context 上下文信息
     * @param {Function} callback 回调函数，用于接收生成的内容
     * @returns {Promise<void>}
     */
    async streamEvent(context, callback) {
        this._log('开始流式生成事件', context);

        try {
            // 更新游戏状态
            this.stateTracker.updateState(context.playerState, context.previousEvents);
            
            // 构建提示词
            const prompt = await this.promptManager.buildPrompt({
                type: context.type || 'exploration',
                location: context.location,
                playerState: context.playerState,
                previousEvents: context.previousEvents || []
            });
            
            // 调用AI服务流式生成内容
            await this.serviceConnector.streamContent(prompt, (content) => {
                // 实时解析和适配内容
                const partialEvent = this.eventAdapter.adaptPartialContent(content, context);
                
                // 通过回调返回部分结果
                callback(partialEvent, false);
            });
            
            // 最终回调完整事件
            const finalContent = this.eventAdapter.getFinalContent();
            const gameEvent = await this.eventAdapter.adaptToGameEvent(finalContent, context);
            
            // 验证事件格式
            this._validateEvent(gameEvent);
            
            callback(gameEvent, true);
        } catch (error) {
            this._logError('流式生成事件失败', error);
            callback({ error: error.message }, true);
        }
    }

    /**
     * 验证事件格式是否符合要求
     * @param {Object} event 要验证的事件
     * @throws {Error} 如果事件格式不符合要求
     * @private
     */
    _validateEvent(event) {
        if (!event) {
            throw new Error('生成的事件为空');
        }
        
        if (!event.event_id) {
            throw new Error('事件缺少event_id');
        }
        
        if (!event.title) {
            throw new Error('事件缺少title');
        }
        
        if (!event.description) {
            throw new Error('事件缺少description');
        }
        
        if (!Array.isArray(event.choices) || event.choices.length === 0) {
            throw new Error('事件缺少有效的choices数组');
        }
        
        // 验证每个选项
        event.choices.forEach((choice, index) => {
            if (!choice.text) {
                throw new Error(`选项 ${index} 缺少text属性`);
            }
            
            if (!Array.isArray(choice.results) || choice.results.length === 0) {
                throw new Error(`选项 ${index} 缺少有效的results数组`);
            }
        });
    }

    /**
     * 记录调试日志
     * @param {string} message 日志消息
     * @param {any} data 相关数据
     * @private
     */
    _log(message, data) {
        if (this.debug) {
            console.log(`[AIStoryEngine] ${message}:`, data);
        }
    }

    /**
     * 记录错误日志
     * @param {string} message 错误消息
     * @param {Error} error 错误对象
     * @private
     */
    _logError(message, error) {
        console.error(`[AIStoryEngine] ${message}:`, error);
    }
}

export default AIStoryEngine; 