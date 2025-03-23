# 文字冒险游戏引擎

这是一个基于Python的文字冒险游戏引擎，可以创建具有分支选择、条件判断和属性系统的交互式文字游戏。

## 功能特点

- **事件系统**：预设文字事件，包含描述和选项
- **选择机制**：每个事件可以包含多个选项或自动进行
- **条件判断**：根据玩家属性和前置条件解锁选项
- **属性系统**：事件会影响玩家属性，属性又影响可用选项
- **事件连接**：根据选择和条件自动连接到下一个事件
- **游戏存档**：支持保存和加载游戏进度
- **JSON支持**：可以通过JSON文件定义游戏内容

## 安装和运行

1. 确保您已安装Python 3.6或更高版本
2. 克隆或下载此仓库
3. 运行游戏：

```bash
# 使用默认游戏数据运行
python3 -m main

# 从JSON文件加载游戏数据
python3 -m main --json game_data.json

# 加载已保存的游戏
python3 -m main --save save.dat

# 从特定事件开始游戏
python3 -m main --start 5
```

## 使用方法

### 1. 基本用法

```python
from text_game_engine import GameEngine, PlayerState, GameEvent

# 创建游戏引擎
engine = GameEngine()

# 创建事件
event1 = GameEvent(1, "你站在森林的入口，面前有两条小路。")
event1.add_option("走左边的小路", 2)
event1.add_option("走右边的小路", 3)

event2 = GameEvent(2, "你来到一个小湖边，看到一把钓鱼竿。")
event2.add_option("拿起钓鱼竿", 4)
event2.add_option("继续前进", 5)
event2.set_effect("物品", "钓鱼竿", True)

# 添加事件到引擎
engine.add_event(event1)
engine.add_event(event2)

# 启动游戏
engine.start_game(1)  # 从事件1开始
```

### 2. 条件选项

```python
# 创建一个需要特定属性的选项
def has_key(player):
    return player.has_item("钥匙")

event3 = GameEvent(3, "你面前有一扇锁着的门。")
event3.add_option("用钥匙开门", 6, condition=has_key)
event3.add_option("返回", 1)
```

### 3. 从JSON加载游戏数据

游戏数据可以使用JSON文件定义，格式如下：

```json
{
  "events": {
    "1": {
      "description": "你醒来发现自己在一个陌生的森林里...",
      "options": [
        {
          "text": "向北走",
          "next_id": 2
        },
        {
          "text": "检查背包",
          "next_id": 3
        }
      ]
    },
    "2": {
      "description": "你来到一条小溪边...",
      "effects": {
        "属性": {
          "精力": 20
        }
      },
      "auto_next": 4
    }
  }
}
```

然后通过以下代码加载：

```python
engine = GameEngine()
engine.load_from_json("game_data.json")
engine.start_game()
```

## 文件结构

- `text_game_engine.py` - 游戏引擎核心代码
- `game_data.py` - 游戏数据定义示例
- `main.py` - 游戏启动入口
- `game_data.json` - JSON格式的游戏数据示例

## 扩展游戏

你可以通过以下方式扩展游戏内容：

1. 编辑 `game_data.py` 文件，添加更多事件和选项
2. 创建或修改 `game_data.json` 文件，定义你自己的游戏世界
3. 开发新的条件函数，实现更复杂的游戏逻辑

## 已知问题和改进方向

- 添加更多游戏机制，如战斗系统、NPC对话等
- 改进用户界面，支持颜色和简单动画
- 增加音效支持
- 添加更多随机事件和分支选择
- 实现更复杂的属性系统和技能树

## 许可证

MIT 许可证 