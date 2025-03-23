# 文字机遇：小说冒险游戏框架

## 游戏理念

本游戏是一款以文字为主的冒险小说游戏，核心设计理念如下：

1. **玩家属性系统**：玩家拥有多种可成长的属性，这些属性会影响游戏中的事件走向和选择结果。同时，玩家拥有背包系统用于存储和使用获得的物品。

2. **机遇事件系统**：游戏中的剧情通过预设的文字段落（称为"机遇"）呈现，每个机遇都是特殊且有意义的事件。玩家在关键节点做出简单的抉择，这些抉择会根据玩家的属性值、前置条件和选择结果导向不同的后续事件。事件结束后会调整玩家属性并可能获得物品奖励。

3. **简单爽快的体验**：整体的游戏设计思路是让玩家玩得简单、玩得爽，不需要太多的思考决策，只需要简单的选择、交互和听有趣的故事。

4. **清晰结构与良好拓展性**：框架具有极为清晰的结构、极为良好的拓展性和分类结构，便于添加新的内容和功能。

## 如何运行游戏

有两种方式可以运行游戏：

1. **使用启动脚本**：
   ```
   ./start_game.sh
   ```
   启动脚本会自动创建一个本地web服务器并尝试打开浏览器。

2. **手动启动**：
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
│       └── parser.js             # 数据解析工具
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