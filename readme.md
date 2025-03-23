# 文字机遇 (Text Opportunities)

这是一个基于文本的冒险游戏引擎，专注于四个核心理念：
1. 玩家属性系统
2. 机遇事件系统
3. 简单且有趣的体验
4. 清晰的结构与良好的可扩展性

## 文件索引

- `/src/core/` - 游戏核心代码
  - `game.js` - 游戏主类
  - `player.js` - 玩家系统
  - `eventManager.js` - 事件管理器
  - `saveSystem.js` - 存档系统
- `/src/data/` - 游戏数据
  - `/events/` - 事件数据文件夹
    - `events.json` - 游戏事件数据
  - `/items/` - 物品数据文件夹
    - `items.json` - 游戏物品数据
  - `/attributes/` - 属性数据文件夹
    - `attributes.json` - 游戏属性数据
- `/src/ui/` - 用户界面
  - `gameUI.js` - 游戏UI组件
  - `eventUI.js` - 事件UI组件
  - `playerUI.js` - 玩家UI组件
- `/src/utils/` - 工具类
  - `debugger.js` - 调试工具
  - `storageUtil.js` - 存储工具
  - `textUtil.js` - 文本处理工具
- `/src/ai/` - AI动态故事生成系统
  - `AIStoryEngine.js` - AI故事引擎主类
  - `/services/` - AI服务连接器
  - `/prompts/` - 提示词管理
  - `/state/` - 游戏状态跟踪
  - `/adapters/` - 适配器
  - `/utils/` - AI相关工具
  - `/demo/` - 演示模式
  - `/integrations/` - 游戏集成
- `index.html` - 游戏主页面
- `config.json` - 游戏配置文件
- `start_game.sh` - 游戏启动脚本
- `start_debug.sh` - 调试模式启动脚本

## 使用方法

### 开始游戏

1. 使用脚本启动：
```
./start_game.sh
```

2. 或使用Python的http.server：
```
python -m http.server
```
然后在浏览器中访问 http://localhost:8000

### 调试模式

启动调试模式：
```
./start_debug.sh
```

调试功能：
- 实时游戏状态跟踪
- 事件流程可视化
- 属性和物品变化监控
- 按F12键（或配置中指定的键）切换调试面板

## AI动态故事生成系统

AI动态故事生成系统允许游戏根据玩家的选择和状态动态生成故事内容，使每次游戏体验都独一无二。

### 特点

- 完全集成到游戏核心中
- 支持在线和离线（演示）模式
- 缓存机制减少API调用
- 强大的错误处理和重试机制
- 模块化设计便于扩展

### 配置

在`config.json`中配置AI系统：

```json
"ai": {
    "enabled": true,
    "apiEndpoint": "https://api.openai.com/v1/chat/completions",
    "apiKey": "你的API密钥",
    "model": "gpt-3.5-turbo",
    "useCache": true,
    "demo": {
        "enabled": true,  // 设置为false使用真实API
        "requireApiKey": false,
        "mockData": true,
        "delayMs": 1000
    }
}
```

### 使用演示模式

默认情况下，游戏使用演示模式，不需要API密钥。演示模式提供预设的AI生成内容，模拟真实AI行为。

### 使用真实API

1. 在`config.json`中设置你的API密钥
2. 将`demo.enabled`设置为`false`
3. 重启游戏

### 扩展AI系统

1. 在`/src/ai/prompts/`中添加新的提示词模板
2. 在`/src/ai/adapters/`中创建新的适配器来处理特定类型的AI生成内容
3. 通过`GameAIIntegrator`将新功能集成到游戏中

## 扩展游戏

### 添加新事件

在`src/data/events/events.json`中定义新事件：

```json
{
  "event_id": "your_new_event",
  "description": "事件描述",
  "choices": [
    {
      "text": "选项1",
      "next_event": "next_event_id",
      "requirements": {
        "strength": 10
      }
    }
  ]
}
```

### 添加新物品

在`src/data/items/items.json`中定义新物品：

```json
{
  "item_id": "your_new_item",
  "name": "物品名称",
  "description": "物品描述",
  "effects": {
    "health": 10
  }
}
```

### 添加新属性

在`src/data/attributes/attributes.json`中定义新属性：

```json
{
  "attribute_id": "your_new_attribute",
  "name": "属性名称",
  "description": "属性描述",
  "min": 0,
  "max": 100,
  "default": 50
}
```

## 游戏理念

本游戏是一款以文字为主的冒险小说游戏，核心设计理念如下：

1. **玩家属性系统**：玩家拥有多种可成长的属性，这些属性会影响游戏中的事件走向和选择结果。同时，玩家拥有背包系统用于存储和使用获得的物品。

2. **机遇事件系统**：游戏中的剧情通过预设的文字段落（称为"机遇"）呈现，每个机遇都是特殊且有意义的事件。玩家在关键节点做出简单的抉择，这些抉择会根据玩家的属性值、前置条件和选择结果导向不同的后续事件。事件结束后会调整玩家属性并可能获得物品奖励。

3. **简单爽快的体验**：整体的游戏设计思路是让玩家玩得简单、玩得爽，不需要太多的思考决策，只需要简单的选择、交互和听有趣的故事。

4. **清晰结构与良好拓展性**：框架具有极为清晰的结构、极为良好的拓展性和分类结构，便于添加新的内容和功能。

## 如何运行游戏

有三种方式可以运行游戏：

1. **使用启动脚本**：
   ```
   ./start_game.sh
   ```
   启动脚本会自动创建一个本地web服务器并尝试打开浏览器。

2. **使用调试模式启动**：
   ```
   ./start_debug.sh
   ```
   以调试模式启动游戏，将启用调试器功能，便于开发和测试。

3. **手动启动**：
   - 使用Python：`python -m http.server 8080`
   - 使用Node.js：`npx http-server -p 8080`
   
   然后在浏览器中访问：`http://localhost:8080`

## 文件结构

```
文字机遇/
├── src/                          # 源代码目录
│   ├── core/                     # 核心系统
│   │   ├── game.js               # 游戏主循环和管理
│   │   ├── event_manager.js      # 事件管理器
│   │   ├── player.js             # 玩家类和属性系统
│   │   ├── inventory.js          # 背包系统
│   │   └── save_system.js        # 存档系统
│   ├── events/                   # 事件定义
│   │   ├── event_base.js         # 事件基类
│   │   ├── event_types/          # 不同类型的事件
│   │   │   ├── story_event.js    # 故事事件
│   │   │   ├── random_event.js   # 随机事件
│   │   │   └── choice_event.js   # 选择事件
│   │   └── conditions/           # 事件条件检查
│   │       ├── attribute_condition.js  # 属性条件
│   │       ├── item_condition.js       # 物品条件
│   │       └── flag_condition.js       # 标志条件
│   ├── ai/                       # AI故事引擎
│   │   ├── services/             # AI服务连接器
│   │   │   └── AIServiceConnector.js # 与AI服务通信
│   │   ├── prompts/              # 提示词管理
│   │   │   └── PromptManager.js  # 提示词构建和管理
│   │   ├── state/                # 状态管理
│   │   │   └── GameStateTracker.js # 游戏状态跟踪
│   │   ├── adapters/             # 适配器
│   │   │   └── EventAdapter.js   # AI内容转换为游戏事件
│   │   ├── utils/                # 工具类
│   │   │   ├── CacheManager.js   # 缓存管理
│   │   │   └── ErrorHandler.js   # 错误处理
│   │   ├── integrations/         # 集成
│   │   │   └── GameAIIntegrator.js # 游戏与AI整合
│   │   ├── demo/                 # 演示
│   │   │   ├── AIStoryEngineDemo.js # 引擎演示脚本
│   │   │   └── index.html        # 演示页面
│   │   └── AIStoryEngine.js      # AI故事引擎核心
│   ├── data/                     # 游戏数据
│   │   ├── events/               # 事件数据定义
│   │   ├── items/                # 物品数据定义
│   │   └── attributes/           # 属性数据定义
│   ├── ui/                       # 用户界面
│   │   ├── text_renderer.js      # 文本渲染
│   │   ├── choice_panel.js       # 选择面板
│   │   ├── player_status.js      # 玩家状态显示
│   │   └── inventory_panel.js    # 背包界面
│   └── utils/                    # 工具函数
│       ├── random.js             # 随机数生成
│       ├── parser.js             # 数据解析工具
│       └── debugger.js           # 调试工具
├── assets/                       # 资源文件
│   ├── text/                     # 文本资源
│   └── images/                   # 图片资源
├── config.json                   # 配置文件
└── index.html                    # 主HTML文件
```

## 核心系统设计

### 1. 玩家系统 (Player)

玩家系统负责管理玩家的所有属性、状态和背包：

- **属性系统**：管理玩家的基本属性（如力量、智力、魅力等）和衍生属性
- **背包系统**：管理玩家获得的物品，包括使用、丢弃等功能
- **状态系统**：跟踪玩家的特殊状态（如疾病、buff等）

### 2. 事件系统 (Event)

事件系统是游戏的核心，负责呈现剧情和处理玩家交互：

- **事件基类**：定义所有事件的基本结构和接口
- **事件类型**：包括故事事件、随机事件、选择事件等
- **条件系统**：检查事件触发和选项可用的条件
- **结果系统**：处理事件和选择后的结果，包括属性变化、物品获得等

### 3. 游戏管理器 (Game Manager)

游戏管理器负责协调各个系统的运行：

- **游戏循环**：控制游戏的主循环和流程
- **事件管理**：加载和调度事件
- **存档系统**：保存和加载游戏进度

### 4. AI驱动的动态故事生成系统

AI系统负责根据玩家行为和状态生成动态内容：

- **AI服务连接器**：与AI模型通信，发送提示词并接收生成内容
- **提示词管理**：根据游戏状态构建高质量提示词
- **游戏状态追踪**：记录和管理用于AI生成的游戏状态
- **事件适配器**：将AI生成的内容转换为游戏事件
- **缓存与错误处理**：优化性能并处理异常情况

## 数据结构示例

### 玩家属性定义

```json
{
  "attributes": {
    "strength": {
      "name": "力量",
      "description": "影响物理攻击和负重能力",
      "initial_value": 10,
      "max_value": 100
    },
    "intelligence": {
      "name": "智力",
      "description": "影响知识检定和解谜能力",
      "initial_value": 10,
      "max_value": 100
    }
  }
}
```

### 事件定义

```json
{
  "event_id": "forest_encounter",
  "title": "森林遭遇",
  "description": "你在森林中遇到了一个神秘的人物...",
  "choices": [
    {
      "text": "上前交谈",
      "conditions": [
        { "type": "attribute", "attribute": "charisma", "value": 15, "operator": ">=" }
      ],
      "results": [
        { "type": "attribute_change", "attribute": "reputation", "value": 5 },
        { "type": "next_event", "event_id": "friendly_conversation" }
      ]
    },
    {
      "text": "保持警惕",
      "conditions": [],
      "results": [
        { "type": "item_gain", "item_id": "mysterious_note", "amount": 1 },
        { "type": "next_event", "event_id": "cautious_approach" }
      ]
    }
  ]
}
```

## 游戏扩展性

该框架设计有以下扩展性特点：

1. **模块化设计**：各个系统相互独立，可以单独扩展或修改
2. **数据驱动**：游戏内容通过JSON等数据文件定义，无需修改代码即可添加新内容
3. **事件系统**：可以轻松添加新的事件类型和条件类型
4. **属性系统**：可以根据游戏需求自定义各种属性
5. **物品系统**：支持定义各种不同类型和效果的物品

## 使用指南

1. 添加新属性：在`data/attributes`目录下定义新的属性
2. 添加新物品：在`data/items`目录下定义新的物品
3. 添加新事件：在`data/events`目录下定义新的事件
4. 自定义游戏流程：修改`config.json`配置初始事件和游戏参数

## 未来扩展方向

1. 增加成就系统
2. 添加音效和背景音乐
3. 增加视觉效果和简单动画
4. 支持多结局系统
5. 添加时间系统，让某些事件只在特定时间出现

## 调试功能

游戏提供了强大的调试功能，帮助开发者跟踪游戏状态和诊断问题：

### 启用调试模式

1. 使用调试启动脚本：
   ```
   ./start_debug.sh
   ```

2. 手动修改配置：
   在`config.json`中将`"debugMode"`设置为`true`

### 调试器功能

- **调试面板**：按`F12`键可以打开或关闭调试面板
- **状态追踪**：实时显示游戏状态、玩家属性和事件信息
- **日志系统**：记录所有游戏事件、条件检查和错误信息
- **状态变化检测**：自动检测并高亮显示状态变化

### 调试操作

在调试模式下，游戏会详细记录以下内容：

1. **事件跟踪**：每个事件的开始、执行和结束
2. **条件检查**：所有条件检查的结果，包括属性条件、物品条件和标志条件
3. **状态变化**：玩家属性、物品和标志的变化
4. **错误信息**：详细的错误信息和堆栈跟踪

这些功能可以帮助开发者快速定位和解决游戏中的问题，特别是在添加新内容或修改现有功能时。 

## AI故事生成系统使用

### 核心功能

AI故事生成系统提供以下功能：

1. **动态事件生成**：根据玩家当前状态、历史选择和环境生成新的事件
2. **个性化内容**：生成的内容会考虑玩家的属性、物品和游戏进度
3. **流式生成**：支持流式内容生成，提供更自然的阅读体验
4. **条件选项**：生成的选项会根据玩家属性提供条件检查
5. **故事连贯性**：保持故事的连贯性和一致性

### 系统组件

AI故事生成系统由以下核心组件组成：

#### 1. AI故事引擎 (AIStoryEngine)

核心引擎类，负责协调各组件生成动态故事内容。这是整个AI系统的中心，它整合了各个组件并提供了对外的接口。

```javascript
// 创建故事引擎实例
const storyEngine = new AIStoryEngine({
    serviceConnector,
    promptManager,
    stateTracker,
    eventAdapter
});

// 生成事件
const event = await storyEngine.generateEvent({
    type: "exploration",
    location: "神秘森林",
    playerState: player.getState(),
    previousEvents: gameManager.getRecentEvents()
});
```

#### 2. AI服务连接器 (AIServiceConnector)

负责与AI服务通信，发送提示词并接收生成内容。这个组件处理所有与AI API的交互，包括错误处理和重试机制。

```javascript
// 创建服务连接器
const serviceConnector = new AIServiceConnector(apiKey, {
    model: "gpt-3.5-turbo",
    maxTokens: 2000,
    temperature: 0.7
});

// 生成内容
const content = await serviceConnector.generateContent(prompt);
```

#### 3. 提示词管理器 (PromptManager)

根据游戏上下文构建高质量提示词。这个组件负责创建能够引导AI生成高质量游戏内容的提示词。

```javascript
// 创建提示词管理器
const promptManager = new PromptManager({
    language: "zh-CN",
    toneStyle: "descriptive"
});

// 添加自定义模板
promptManager.addTemplate("combat_template", "自定义战斗模板内容...");

// 构建提示词
const prompt = await promptManager.buildPrompt({
    type: "exploration",
    location: "古老遗迹",
    playerState: currentPlayerState,
    previousEvents: recentEvents
});
```

#### 4. 游戏状态跟踪器 (GameStateTracker)

记录和管理用于AI生成的游戏状态。这个组件维护游戏的上下文和历史，为AI提供必要的背景信息。

```javascript
// 创建状态跟踪器
const stateTracker = new GameStateTracker();

// 更新游戏状态
stateTracker.updateState(
    player.getState(),
    gameManager.getRecentEvents()
);

// 创建状态快照
const snapshot = stateTracker.createSnapshot();
```

#### 5. 事件适配器 (EventAdapter)

将AI生成的内容转换为游戏事件格式。这个组件处理解析、验证和转换过程，确保AI生成的内容符合游戏需求。

```javascript
// 创建事件适配器
const eventAdapter = new EventAdapter();

// 适配AI内容为游戏事件
const gameEvent = await eventAdapter.adaptToGameEvent(
    aiGeneratedContent,
    context
);
```

### 配置指南

在`config.json`中配置AI系统：

```json
"ai": {
    "enabled": true,
    "apiEndpoint": "https://api.openai.com/v1/chat/completions",
    "apiKey": "你的API密钥",
    "model": "gpt-3.5-turbo",
    "useCache": true,
    "maxTokens": 2000,
    "temperature": 0.8,
    "presencePenalty": 0.2,
    "frequencyPenalty": 0.2,
    "timeout": 30000,
    "maxRetries": 3,
    "demo": {
        "enabled": true,
        "requireApiKey": false,
        "mockData": true,
        "delayMs": 1000
    },
    "systemPrompt": "你是一个文字冒险游戏的创意讲故事者..."
}
```

### 演示系统

AI故事生成系统提供了一个独立的演示页面，可以测试和展示AI生成能力：

1. **访问演示页面**：打开 `http://localhost:8080/src/ai/demo/`
2. **设置API密钥**：在演示页面设置你的AI服务API密钥
3. **生成测试事件**：选择事件类型和位置，生成测试事件
4. **查看生成结果**：查看生成的事件、选项和条件

### 集成到游戏中

将AI故事生成系统集成到游戏中需要以下步骤：

1. **初始化AI系统**：在游戏启动时初始化AI故事引擎及其组件
   ```javascript
   // 在game.js中初始化AI系统
   this.initAIStoryEngine = function() {
       const serviceConnector = new AIServiceConnector(config.ai.apiKey, {
           model: config.ai.model,
           maxTokens: config.ai.maxTokens,
           temperature: config.ai.temperature
       });
       
       const promptManager = new PromptManager();
       const stateTracker = new GameStateTracker();
       const eventAdapter = new EventAdapter();
       
       this.aiStoryEngine = new AIStoryEngine({
           serviceConnector,
           promptManager,
           stateTracker,
           eventAdapter
       });
   };
   ```

2. **生成动态事件**：在需要时调用AI生成内容
   ```javascript
   // 在event_manager.js中添加动态事件生成
   this.generateDynamicEvent = async function(context) {
       if (!game.aiStoryEngine) return null;
       
       const event = await game.aiStoryEngine.generateEvent({
           type: context.type || "exploration",
           location: context.location || player.getCurrentLocation(),
           playerState: player.getState(),
           previousEvents: this.getRecentEvents(5)
       });
       
       return event;
   };
   ```

3. **处理生成的事件**：将生成的事件整合到游戏流程中
   ```javascript
   // 在event_manager.js中处理生成的事件
   this.handleDynamicEvent = function(event) {
       if (!event) return false;
       
       // 添加事件到事件池
       this.events[event.event_id] = event;
       
       // 显示事件
       this.displayEvent(event);
       
       return true;
   };
   ```

### 自定义和扩展

AI故事生成系统设计为高度可扩展的模块化系统：

1. **添加新的事件类型**：扩展提示词管理器中的模板
   ```javascript
   promptManager.addTemplate("mystery_template", "你的神秘事件模板...");
   ```

2. **自定义AI提示词**：修改系统提示词以更改AI风格
   ```javascript
   // 在config.json中修改systemPrompt
   // 或在代码中设置
   promptManager.setSystemPrompt("自定义系统提示词...");
   ```

3. **添加新的结果类型**：扩展事件适配器以处理新的结果类型
   ```javascript
   // 在EventAdapter._validateAndEnrichResult中添加新的结果类型处理
   case "new_result_type":
       // 处理新的结果类型
       break;
   ```

4. **集成不同的AI服务**：创建新的服务连接器子类
   ```javascript
   // 创建自定义AI服务连接器
   class CustomAIServiceConnector extends AIServiceConnector {
       // 重写方法以连接不同的AI服务
   }
   ```

### 最佳实践

1. **缓存常用内容**：启用缓存以减少API调用
2. **设置合理的温度值**：0.7-0.8的温度能提供良好的创意性和一致性平衡
3. **优化提示词**：精心设计提示词是获得高质量内容的关键
4. **错误处理**：实现良好的错误处理和后备机制
5. **预生成内容**：对于关键故事节点，考虑预生成内容

### 故障排除

1. **生成内容格式错误**：检查提示词是否明确要求JSON格式
2. **API连接失败**：验证API密钥和网络连接
3. **内容不相关**：调整提示词和系统消息以更好地引导AI
4. **生成速度慢**：考虑使用流式生成或减少生成内容的长度
5. **超出API限制**：实现请求节流或考虑升级API计划

### API限制和成本

使用AI服务时请注意以下几点：

1. **API限制**：大多数AI服务有请求频率限制
2. **成本考虑**：每次API调用都有成本，特别是使用高级模型时
3. **备选策略**：在高流量情况下，考虑使用预生成内容或本地模型
4. **离线模式**：提供离线模式或演示模式以减少API依赖

通过合理配置和使用AI动态故事生成系统，你可以为玩家创造独特的、个性化的游戏体验，同时保持游戏的连贯性和趣味性。 