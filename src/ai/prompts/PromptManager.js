/**
 * 文字机遇 - 提示词管理器
 * 负责构建高质量的提示词，确保AI生成符合游戏需求的内容
 */

export class PromptManager {
  /**
   * 创建提示词管理器实例
   * @param {Object} [options] 配置选项
   * @param {string} [options.language='zh-CN'] 语言设置
   * @param {string} [options.toneStyle='descriptive'] 文本风格
   * @param {Object} [options.templates] 自定义提示词模板
   */
  constructor(options = {}) {
    this.language = options.language || 'zh-CN';
    this.toneStyle = options.toneStyle || 'descriptive';
    this.templates = options.templates || {};
    
    // 初始化默认模板
    this._initializeDefaultTemplates();
  }

  /**
   * 设置语言
   * @param {string} language 语言代码
   */
  setLanguage(language) {
    this.language = language;
  }

  /**
   * 设置文本风格
   * @param {string} style 风格名称
   */
  setToneStyle(style) {
    this.toneStyle = style;
  }

  /**
   * 添加自定义模板
   * @param {string} templateName 模板名称
   * @param {string} template 模板内容
   */
  addTemplate(templateName, template) {
    this.templates[templateName] = template;
  }

  /**
   * 获取特定模板
   * @param {string} templateName 模板名称
   * @returns {string} 模板内容
   */
  getTemplate(templateName) {
    if (!this.templates[templateName]) {
      throw new Error(`模板 ${templateName} 不存在`);
    }
    return this.templates[templateName];
  }

  /**
   * 构建提示词
   * @param {Object} context - 游戏上下文
   * @returns {string} - 构建的提示词
   */
  async buildPrompt(context) {
    const eventType = context.type || 'exploration';
    let template;
    
    // 获取对应的模板
    try {
      template = this.templates[`${eventType}_template`];
      if (!template) {
        template = this.templates['default_template'];
      }
    } catch (error) {
      template = this.templates['default_template'];
    }

    // 构建系统消息
    const systemMessage = this._buildSystemMessage(context);
    
    // 构建用户消息（填充模板）
    const userMessage = this._fillTemplate(template, context);
    
    return {
      systemMessage,
      userMessage
    };
  }

  /**
   * 构建系统消息
   * @param {Object} context 上下文信息
   * @returns {string} 系统消息
   * @private
   */
  _buildSystemMessage(context) {
    const { type } = context;
    
    // 根据事件类型选择系统消息
    switch (type) {
      case 'exploration':
        return this.templates.system_exploration;
      case 'encounter':
        return this.templates.system_encounter;
      case 'dialogue':
        return this.templates.system_dialogue;
      case 'combat':
        return this.templates.system_combat;
      case 'puzzle':
        return this.templates.system_puzzle;
      case 'rest':
        return this.templates.system_rest;
      default:
        return this.templates.system_default;
    }
  }

  /**
   * 填充模板
   * @param {string} template 模板字符串
   * @param {Object} context 上下文信息
   * @returns {string} 填充后的模板
   * @private
   */
  _fillTemplate(template, context) {
    let filledTemplate = template;
    
    // 替换位置
    if (context.location) {
      filledTemplate = filledTemplate.replace(/\{location\}/g, context.location);
    }
    
    // 替换事件类型
    if (context.type) {
      filledTemplate = filledTemplate.replace(/\{eventType\}/g, context.type);
    }
    
    // 替换玩家状态
    if (context.playerState) {
      // 格式化玩家属性
      const formattedAttributes = this._formatAttributes(context.playerState.attributes);
      filledTemplate = filledTemplate.replace(/\{playerAttributes\}/g, formattedAttributes);
      
      // 格式化玩家物品栏
      const formattedInventory = this._formatInventory(context.playerState.inventory);
      filledTemplate = filledTemplate.replace(/\{playerInventory\}/g, formattedInventory);
      
      // 格式化标记
      const formattedFlags = this._formatFlags(context.playerState.flags);
      filledTemplate = filledTemplate.replace(/\{playerFlags\}/g, formattedFlags);
    }
    
    // 替换前一个事件
    if (context.previousEvents && context.previousEvents.length > 0) {
      const previousEvent = context.previousEvents[context.previousEvents.length - 1];
      const formattedPreviousEvent = this._formatPreviousEvent(previousEvent);
      filledTemplate = filledTemplate.replace(/\{previousEvent\}/g, formattedPreviousEvent);
    } else {
      filledTemplate = filledTemplate.replace(/\{previousEvent\}/g, "无前置事件");
    }
    
    return filledTemplate;
  }

  /**
   * 格式化玩家属性
   * @param {Object} attributes 玩家属性对象
   * @returns {string} 格式化后的属性字符串
   * @private
   */
  _formatAttributes(attributes) {
    if (!attributes) return "无特殊属性";
    
    return Object.entries(attributes).map(([key, value]) => {
      return `${key}: ${value}`;
    }).join(", ");
  }

  /**
   * 格式化玩家物品栏
   * @param {Array} inventory 物品栏数组
   * @returns {string} 格式化后的物品栏字符串
   * @private
   */
  _formatInventory(inventory) {
    if (!inventory || inventory.length === 0) return "空";
    
    return inventory.map(item => {
      return `${item.name || item.id}${item.amount > 1 ? ` x${item.amount}` : ''}`;
    }).join(", ");
  }

  /**
   * 格式化玩家标记
   * @param {Object} flags 标记对象
   * @returns {string} 格式化后的标记字符串
   * @private
   */
  _formatFlags(flags) {
    if (!flags || Object.keys(flags).length === 0) return "无标记";
    
    return Object.entries(flags)
      .filter(([_, value]) => value === true) // 只包含为true的标记
      .map(([key, _]) => key)
      .join(", ");
  }

  /**
   * 格式化前一个事件
   * @param {Object} event 前一个事件对象
   * @returns {string} 格式化后的事件字符串
   * @private
   */
  _formatPreviousEvent(event) {
    if (!event) return "无前置事件";
    
    return `${event.title || '未命名事件'}: ${event.description || '无描述'}`;
  }

  /**
   * 初始化默认提示词模板
   * @private
   */
  _initializeDefaultTemplates() {
    // 系统消息模板
    this.templates.system_default = `你是一个文字冒险游戏的创意讲故事者，负责创造引人入胜的故事情节和有趣的选择。你的内容应该生动具体，符合游戏的剧情设定。始终输出JSON格式的事件数据，不要包含任何解释或前后文。`;
    
    this.templates.system_exploration = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个探索类事件。探索事件应该描述玩家在特定地点的发现和遭遇，提供生动的环境描述和有趣的互动选择。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本，以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    this.templates.system_encounter = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个遭遇类事件。遭遇事件应该描述玩家与NPC、生物或情境的特殊互动，可能带来挑战或机遇。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本，以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    this.templates.system_dialogue = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个对话类事件。对话事件应该描述玩家与游戏世界中某个角色的交谈，展现角色性格和故事线索。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本（包含对话内容），以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    this.templates.system_combat = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个战斗类事件。战斗事件应该描述玩家面临的战斗场景，提供战略选择和动态结果。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本（展现战斗场景），以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    this.templates.system_puzzle = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个解谜类事件。解谜事件应该呈现玩家需要解决的谜题或挑战，测试玩家的智力或游戏技巧。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本（清晰呈现谜题），以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    this.templates.system_rest = `你是"文字机遇"文字冒险游戏的创意讲故事者。现在，你需要生成一个休息类事件。休息事件应该描述玩家在旅途中的休息场景，可能带来回复、反思或小型互动。事件必须包含以下要素：一个唯一的事件ID，一个简洁的标题，生动的描述文本，以及2-4个选择，每个选择都应考虑玩家属性作为条件，以及每个选择的结果。请以JSON格式输出，不要包含任何解释或额外文本。`;
    
    // 用户消息模板（事件类型模板）
    this.templates.default_template = `请为"文字机遇"游戏生成一个{eventType}类型的事件，位于{location}。

玩家当前状态:
- 属性: {playerAttributes}
- 物品栏: {playerInventory}
- 标记: {playerFlags}

前一个事件: {previousEvent}

请确保事件具有以下JSON结构:
{
  "event_id": "唯一事件ID",
  "title": "事件标题",
  "description": "事件详细描述",
  "choices": [
    {
      "text": "选项文本",
      "conditions": [
        {"type": "attribute/item/flag", "详细条件": "值"}
      ],
      "results": [
        {"type": "结果类型", "详细结果": "值"}
      ]
    }
  ]
}

结果类型可以包括：next_event（下一个事件）、attribute_change（属性变化）、item_add（获得物品）、item_remove（失去物品）、flag_set（设置标记）等。

请直接输出JSON格式，不要添加任何其他文本或注释。`;

    this.templates.exploration_template = `请为"文字机遇"游戏生成一个探索类型的事件，位于{location}。

玩家当前状态:
- 属性: {playerAttributes}
- 物品栏: {playerInventory}
- 标记: {playerFlags}

前一个事件: {previousEvent}

请生成一个生动的探索场景，描述环境、发现和可能的遭遇。提供2-4个选择，让玩家决定如何探索或应对发现。

请确保事件具有以下JSON结构:
{
  "event_id": "唯一事件ID",
  "title": "事件标题",
  "description": "事件详细描述",
  "choices": [
    {
      "text": "选项文本",
      "conditions": [
        {"type": "attribute/item/flag", "详细条件": "值"}
      ],
      "results": [
        {"type": "结果类型", "详细结果": "值"}
      ]
    }
  ]
}

请直接输出JSON格式，不要添加任何其他文本或注释。`;

    this.templates.encounter_template = `请为"文字机遇"游戏生成一个遭遇类型的事件，位于{location}。

玩家当前状态:
- 属性: {playerAttributes}
- 物品栏: {playerInventory}
- 标记: {playerFlags}

前一个事件: {previousEvent}

请生成一个有趣的遭遇事件，描述玩家遇到的角色、生物或特殊情境。提供2-4个选择，让玩家决定如何回应这次遭遇。

请确保事件具有以下JSON结构:
{
  "event_id": "唯一事件ID",
  "title": "事件标题",
  "description": "事件详细描述",
  "choices": [
    {
      "text": "选项文本",
      "conditions": [
        {"type": "attribute/item/flag", "详细条件": "值"}
      ],
      "results": [
        {"type": "结果类型", "详细结果": "值"}
      ]
    }
  ]
}

请直接输出JSON格式，不要添加任何其他文本或注释。`;

    // 为其他类型添加模板...
  }
}

export default PromptManager; 