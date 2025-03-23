/**
 * 事件适配器 - 负责将AI生成的内容转换为游戏事件格式
 * 
 * 该类处理AI返回的原始内容，将其解析和转换为符合游戏系统要求的事件格式。
 * 它还负责验证事件数据的结构和内容，确保其符合预期格式。
 */
export class EventAdapter {
    /**
     * 创建事件适配器实例
     */
    constructor() {
        this.partialContent = "";
    }

    /**
     * 将AI生成的内容适配为游戏事件格式
     * @param {string} content AI生成的内容
     * @param {Object} context 生成上下文
     * @returns {Object} 游戏事件对象
     */
    async adaptToGameEvent(content, context) {
        try {
            // 提取JSON部分
            const jsonContent = this._extractJsonFromContent(content);
            
            // 解析JSON
            let event = JSON.parse(jsonContent);
            
            // 添加默认值和校验结构
            event = this._validateAndEnrichEvent(event, context);
            
            return event;
        } catch (error) {
            console.error("解析AI生成的事件失败:", error);
            throw new Error(`适配事件失败: ${error.message}`);
        }
    }

    /**
     * 处理流式生成的部分内容
     * @param {string} partialContent 部分内容
     * @param {Object} context 生成上下文
     * @returns {Object|null} 部分处理的事件对象，如果无法解析则返回null
     */
    adaptPartialContent(partialContent, context) {
        // 累积部分内容
        this.partialContent += partialContent;
        
        try {
            // 尝试提取和解析JSON
            const jsonContent = this._extractJsonFromContent(this.partialContent);
            const partialEvent = JSON.parse(jsonContent);
            
            // 返回部分处理的事件
            return partialEvent;
        } catch (error) {
            // 如果无法解析，返回部分文本
            return {
                partial: true,
                text: this.partialContent
            };
        }
    }

    /**
     * 获取最终累积的内容
     * @returns {string} 完整的内容
     */
    getFinalContent() {
        const content = this.partialContent;
        this.partialContent = ""; // 重置
        return content;
    }

    /**
     * 从内容中提取JSON部分
     * @param {string} content 原始内容
     * @returns {string} JSON字符串
     * @private
     */
    _extractJsonFromContent(content) {
        // 尝试找到JSON对象的起始和结束位置
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
            throw new Error("无法在内容中找到有效的JSON对象");
        }
        
        // 提取JSON部分
        return content.substring(jsonStart, jsonEnd + 1);
    }

    /**
     * 验证和丰富事件对象
     * @param {Object} event 原始事件对象
     * @param {Object} context 生成上下文
     * @returns {Object} 验证和丰富后的事件对象
     * @private
     */
    _validateAndEnrichEvent(event, context) {
        // 确保事件有ID
        if (!event.event_id) {
            event.event_id = this._generateEventId(context);
        }
        
        // 确保事件有标题
        if (!event.title) {
            event.title = "未命名事件";
        }
        
        // 确保事件有描述
        if (!event.description) {
            event.description = "无描述";
        }
        
        // 确保事件有选项
        if (!event.choices || !Array.isArray(event.choices) || event.choices.length === 0) {
            event.choices = [{
                text: "继续",
                conditions: [],
                results: [
                    { type: "next_event", event_id: "default_next" }
                ]
            }];
        }
        
        // 处理每个选项
        event.choices = event.choices.map(choice => this._validateAndEnrichChoice(choice));
        
        return event;
    }

    /**
     * 验证和丰富选项对象
     * @param {Object} choice 选项对象
     * @returns {Object} 验证和丰富后的选项对象
     * @private
     */
    _validateAndEnrichChoice(choice) {
        // 确保选项有文本
        if (!choice.text) {
            choice.text = "未命名选项";
        }
        
        // 确保选项有条件数组
        if (!choice.conditions || !Array.isArray(choice.conditions)) {
            choice.conditions = [];
        }
        
        // 确保选项有结果数组
        if (!choice.results || !Array.isArray(choice.results) || choice.results.length === 0) {
            choice.results = [
                { type: "next_event", event_id: "default_next" }
            ];
        }
        
        // 处理每个结果
        choice.results = choice.results.map(result => this._validateAndEnrichResult(result));
        
        return choice;
    }

    /**
     * 验证和丰富结果对象
     * @param {Object} result 结果对象
     * @returns {Object} 验证和丰富后的结果对象
     * @private
     */
    _validateAndEnrichResult(result) {
        // 确保结果有类型
        if (!result.type) {
            result.type = "next_event";
        }
        
        // 根据类型验证和丰富结果
        switch (result.type) {
            case "next_event":
                if (!result.event_id) {
                    result.event_id = "default_next";
                }
                break;
            case "attribute_change":
                if (!result.attribute) {
                    result.attribute = "unknown";
                }
                if (result.value === undefined) {
                    result.value = 0;
                }
                break;
            case "item_add":
            case "item_remove":
                if (!result.item_id) {
                    result.item_id = "unknown";
                }
                if (!result.amount || result.amount <= 0) {
                    result.amount = 1;
                }
                break;
            case "flag_set":
                if (!result.flag) {
                    result.flag = "unknown";
                }
                if (result.value === undefined) {
                    result.value = true;
                }
                break;
        }
        
        return result;
    }

    /**
     * 生成事件ID
     * @param {Object} context 生成上下文
     * @returns {string} 事件ID
     * @private
     */
    _generateEventId(context) {
        const type = context.type || "event";
        const location = context.location ? context.location.toLowerCase().replace(/\s+/g, "_") : "unknown";
        const timestamp = Date.now().toString(36).slice(-4);
        
        return `${type}_${location}_${timestamp}`;
    }
} 