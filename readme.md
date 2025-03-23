# 文本冒险游戏 - Text Leveling

这是一个基于文本的冒险游戏框架，玩家通过做出选择来推进故事情节，获取物品，提升属性。

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

## 项目结构

```
Text Leveling/
├── assets/           # 游戏资源文件
├── src/              # 源代码
│   ├── data/         # 游戏数据
│   │   ├── events/   # 事件数据
│   │   ├── items/    # 物品数据
│   │   └── attributes/ # 属性数据
│   ├── js/           # JavaScript脚本
├── index.html        # 游戏入口页面
├── config.json       # 游戏配置
└── start_game.sh     # 启动脚本
```

## 文件说明

### 事件数据（src/data/events/events.json）

事件是游戏的核心组成部分，定义了故事情节和玩家可以做出的选择。

```json
{
  "event_id": {
    "type": "story",
    "title": "事件标题",
    "description": "事件描述",
    "choices": [
      {
        "text": "选项文本",
        "results": [
          {
            "type": "next_event",
            "event_id": "下一个事件ID"
          }
        ]
      }
    ],
    "storyLineId": "故事线ID",
    "storyNodeIndex": 0
  }
}
```

### 物品数据（src/data/items/items.json）

物品定义了玩家可以在游戏中获取和使用的道具。

```json
{
  "item_id": {
    "id": "物品ID",
    "name": "物品名称",
    "description": "物品描述",
    "type": "物品类型", // key_item, consumable, equipment
    "effects": [
      {
        "type": "attribute_change",
        "attribute": "属性ID",
        "value": 5
      }
    ]
  }
}
```

### 属性数据（src/data/attributes/attributes.json）

属性定义了角色的能力值和状态。

```json
{
  "attribute_id": {
    "id": "属性ID",
    "name": "属性名称",
    "description": "属性描述",
    "minValue": 0,
    "maxValue": 100,
    "defaultValue": 50
  }
}
```

## 如何扩展游戏

1. 添加新事件：在`src/data/events/events.json`中添加新的事件对象
2. 添加新物品：在`src/data/items/items.json`中添加新的物品对象
3. 添加新属性：在`src/data/attributes/attributes.json`中添加新的属性对象

## 游戏特性

- 分支故事情节
- 物品收集与使用
- 角色属性系统
- 基于属性的条件选择 