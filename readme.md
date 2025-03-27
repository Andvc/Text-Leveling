# 文本冒险游戏 AI 驱动框架

## 项目概述
这是一个基于Python的文本冒险游戏框架，核心功能是通过大模型API实现智能文本生成和处理。系统采用流式处理方式，实时接收和处理AI生成的内容，并按照预设格式进行解析与输出。

## 核心功能
1. **AI接口调用**: 连接并调用大模型API，发送自定义提示词
2. **格式化输出**: 指导AI按照特定格式输出内容，便于程序解析
3. **流式内容处理**: 实时接收AI生成的内容流
4. **动态内容解析**: 根据预设格式实时解析AI输出内容并进行相应处理
5. **模块化设计**: 高扩展性架构，支持自定义处理管线和功能扩展

## 技术特点
- **高扩展性**: 支持更换不同的AI模型API
- **可定制化**: 提示词系统可以灵活配置和扩展
- **实时处理**: 流式接收与处理确保即时响应
- **模块化**: 清晰的代码结构便于功能扩展和维护

## 文件结构
- `ai_core.py`: AI接口核心模块，负责API调用和响应处理
- `prompt_manager.py`: 提示词管理器，处理提示词模板和动态生成
- `stream_processor.py`: 流式内容处理器，实时解析AI输出
- `output_formatter.py`: 输出格式化模块，统一管理输出格式
- `game_integration.py`: 游戏集成模块，连接AI系统与游戏逻辑
- `main.py`: 主程序，提供命令行界面
- `config.py`: 配置文件，包含API密钥和其他设置
- `requirements.txt`: 依赖包列表
- `dev.md`: 开发日志，记录开发过程和更新内容

## 安装方法

### 依赖安装
1. 确保已安装Python 3.7+
2. 安装依赖包：
```bash
pip install -r requirements.txt
```

### 配置AI服务
1. 获取OpenAI、Anthropic或DeepSeek的API密钥
2. 设置环境变量（推荐）：
```bash
# Windows
set OPENAI_API_KEY=your_api_key_here
set ANTHROPIC_API_KEY=your_api_key_here
set DEEPSEEK_API_KEY=your_api_key_here

# Linux/Mac
export OPENAI_API_KEY=your_api_key_here
export ANTHROPIC_API_KEY=your_api_key_here
export DEEPSEEK_API_KEY=your_api_key_here
```
或者在启动游戏时通过命令行参数提供

## 使用方法

### 启动游戏
```bash
# 基本启动
python main.py

# 使用特定API密钥启动
python main.py --api-key your_api_key_here

# 使用特定AI服务提供商启动
python main.py --provider openai
python main.py --provider anthropic
python main.py --provider deepseek

# 加载特定存档启动
python main.py --load save_name
```

### 游戏内命令
- `help`: 显示帮助信息
- `save`: 保存游戏
- `load`: 加载游戏
- `inventory`或`i`: 查看物品栏
- `status`或`s`: 查看角色状态
- `look`或`l`: 查看当前位置
- `quit`: 退出游戏

### 自定义模型与提示词
1. 在`config.py`中修改API设置
2. 创建自定义提示词模板并保存在`prompts`目录

## 开发与扩展
本框架采用模块化设计，可以方便地扩展功能：

1. **添加新的AI服务提供商**：在`config.py`中添加新的提供商配置，并在`ai_core.py`中适配请求格式

2. **自定义提示词模板**：使用`PromptManager`类创建和管理新的提示词模板

3. **扩展输出格式**：在`config.py`的`PROMPT_CONFIG["output_format"]`中添加新的输出格式类型

4. **添加游戏功能**：通过扩展`GameSession`类添加新的游戏功能

## 开发状态
项目已完成基础功能开发，可以运行一个完整的文本冒险游戏。未来计划添加更多功能和改进：

1. 图形用户界面
2. 更多游戏机制（如战斗系统、升级系统）
3. 多语言支持
4. 更多AI模型的集成

详细的开发日志和计划请查看`dev.md`。 