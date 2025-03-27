"""
游戏集成模块：连接AI系统与游戏逻辑
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, asdict

from ai_core import AICore, create_messages
from prompt_manager import PromptManager
from stream_processor import StreamProcessor
from output_formatter import OutputFormatter
from config import GAME_CONFIG, LOG_CONFIG, PROMPT_CONFIG

# 设置日志
logging.basicConfig(
    level=getattr(logging, LOG_CONFIG["level"]),
    format=LOG_CONFIG["format"],
    filename=LOG_CONFIG.get("file")
)
logger = logging.getLogger("game_integration")

@dataclass
class Character:
    """游戏角色数据结构"""
    name: str
    health: int = 100
    max_health: int = 100
    mana: int = 50
    max_mana: int = 50
    level: int = 1
    experience: int = 0
    attributes: Dict[str, int] = None
    skills: Dict[str, int] = None
    
    def __post_init__(self):
        """初始化默认值"""
        if self.attributes is None:
            self.attributes = {
                "strength": 10,
                "intelligence": 10,
                "agility": 10,
                "constitution": 10
            }
        if self.skills is None:
            self.skills = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Character':
        """从字典创建角色"""
        return cls(**data)


@dataclass
class Item:
    """物品数据结构"""
    id: str
    name: str
    description: str
    type: str
    quantity: int = 1
    properties: Dict[str, Any] = None
    
    def __post_init__(self):
        """初始化默认值"""
        if self.properties is None:
            self.properties = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Item':
        """从字典创建物品"""
        return cls(**data)


@dataclass
class GameState:
    """游戏状态数据结构"""
    location: str
    scenes_visited: List[str] = None
    quest_flags: Dict[str, bool] = None
    variables: Dict[str, Any] = None
    events_triggered: List[str] = None
    
    def __post_init__(self):
        """初始化默认值"""
        if self.scenes_visited is None:
            self.scenes_visited = []
        if self.quest_flags is None:
            self.quest_flags = {}
        if self.variables is None:
            self.variables = {}
        if self.events_triggered is None:
            self.events_triggered = []
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GameState':
        """从字典创建游戏状态"""
        return cls(**data)


class GameSession:
    """游戏会话，管理游戏状态和与AI的交互"""
    
    def __init__(self, 
                 character: Character = None, 
                 game_state: GameState = None,
                 ai_provider: str = None,
                 api_key: str = None,
                 callbacks: Dict[str, Callable] = None,
                 save_directory: str = None):
        """
        初始化游戏会话
        
        Args:
            character: 玩家角色
            game_state: 游戏状态
            ai_provider: AI服务提供商
            api_key: API密钥
            callbacks: 回调函数字典
            save_directory: 存档目录
        """
        # 设置游戏数据
        self.character = character or Character(name="冒险者")
        self.game_state = game_state or GameState(location="起始位置")
        self.inventory: List[Item] = []
        self.conversation_history: List[Dict[str, str]] = []
        
        # 设置AI工具
        self.ai_provider = ai_provider
        self.api_key = api_key
        self.prompt_manager = PromptManager()
        self.save_directory = save_directory or GAME_CONFIG.get("save_directory", "./saves")
        
        # 确保存档目录存在
        if not os.path.exists(self.save_directory):
            os.makedirs(self.save_directory)
            
        # 设置回调函数
        self.callbacks = callbacks or {}
        
        # 初始化处理器
        self.formatter = OutputFormatter()
        self.stream_processor = StreamProcessor()
        
        # 更新回调
        self._setup_callbacks()
        
        logger.info("游戏会话初始化完成")
    
    def _setup_callbacks(self):
        """设置流处理器的回调函数"""
        # 首先设置从callbacks传入的回调
        for content_type, callback in self.callbacks.items():
            self.stream_processor.register_callback(content_type, callback)
            
        # 然后设置默认回调（如果没有对应的自定义回调）
        default_callbacks = {
            "narrative": self._on_narrative,
            "action": self._on_action,
            "option": self._on_option,
            "system": self._on_system,
            "error": self._on_error
        }
        
        for content_type, callback in default_callbacks.items():
            if content_type not in self.callbacks:
                self.stream_processor.register_callback(content_type, callback)
    
    def _on_narrative(self, content: Dict[str, Any]):
        """处理叙述内容"""
        logger.debug(f"叙述: {content['content']}")
    
    def _on_action(self, content: Dict[str, Any]):
        """处理动作内容"""
        logger.debug(f"动作: {content['content']}")
    
    def _on_option(self, content: Dict[str, Any]):
        """处理选项内容"""
        logger.debug(f"选项 [{content.get('id', 'unknown')}]: {content['content']}")
    
    def _on_system(self, content: Dict[str, Any]):
        """处理系统内容"""
        logger.debug(f"系统: {content['content']}")
        
        # 处理系统指令，例如更新游戏状态
        system_content = content['content']
        
        # 示例：检测位置更新
        if "发现新地点：" in system_content:
            new_location = system_content.split("发现新地点：")[1].strip()
            self.game_state.location = new_location
            self.game_state.scenes_visited.append(new_location)
            logger.info(f"更新位置: {new_location}")
            
        # 处理其他系统指令...
    
    def _on_error(self, content: Dict[str, Any]):
        """处理错误内容"""
        logger.error(f"错误: {content['content']}")
    
    async def process_input(self, user_input: str) -> Dict[str, Any]:
        """
        处理用户输入并获取AI响应
        
        Args:
            user_input: 用户输入文本
            
        Returns:
            处理后的游戏输出
        """
        # 创建游戏提示词
        game_prompt = self.prompt_manager.create_game_prompt(
            user_input=user_input,
            game_state=self.game_state.to_dict(),
            inventory=[item.to_dict() for item in self.inventory],
            character=self.character.to_dict(),
            conversation_history=self.conversation_history
        )
        
        # 创建消息列表
        system_prompt = self.prompt_manager.get_system_prompt()
        messages = create_messages(system_prompt, game_prompt, self.conversation_history)
        
        # 记录当前用户输入到对话历史
        self.conversation_history.append({"role": "user", "content": user_input})
        
        # 调用AI接口
        try:
            async with AICore(provider=self.ai_provider, api_key=self.api_key) as ai:
                # 获取AI响应
                response_stream = await ai.generate_with_retry(messages, stream=True)
                
                # 处理流式响应
                result = await self.stream_processor.process_stream(response_stream)
                
                # 获取完整的AI输出
                all_content = self.stream_processor.get_all_content()
                formatted_output = self.formatter.format_game_output(all_content)
                
                # 组合所有文本内容以保存到对话历史
                ai_content = ""
                for segment in all_content:
                    if segment["type"] == "narrative":
                        ai_content += segment["content"] + " "
                
                # 记录AI响应到对话历史
                self.conversation_history.append({"role": "assistant", "content": ai_content.strip()})
                
                return formatted_output
                
        except Exception as e:
            logger.error(f"调用AI时发生错误: {str(e)}")
            return {
                "errors": [f"与AI通信时发生错误: {str(e)}"],
                "narrative": ["系统暂时无法响应，请稍后再试。"],
                "options": [{"id": "retry", "text": "重试"}],
                "actions": [],
                "system": []
            }
    
    def add_item(self, item: Union[Item, Dict[str, Any]]) -> Item:
        """
        添加物品到物品栏
        
        Args:
            item: 物品对象或物品数据字典
            
        Returns:
            添加的物品对象
        """
        if isinstance(item, dict):
            item = Item.from_dict(item)
            
        # 检查是否已有该物品，如果有则增加数量
        for existing_item in self.inventory:
            if existing_item.id == item.id:
                existing_item.quantity += item.quantity
                logger.info(f"增加物品数量: {item.name} (x{item.quantity})")
                return existing_item
        
        # 如果没有，则添加新物品
        self.inventory.append(item)
        logger.info(f"添加新物品: {item.name} (x{item.quantity})")
        return item
    
    def remove_item(self, item_id: str, quantity: int = 1) -> Optional[Item]:
        """
        从物品栏移除物品
        
        Args:
            item_id: 物品ID
            quantity: 要移除的数量
            
        Returns:
            移除的物品，如果物品不存在或数量不足则返回None
        """
        for i, item in enumerate(self.inventory):
            if item.id == item_id:
                if item.quantity <= quantity:
                    # 如果要移除的数量大于等于物品数量，则移除整个物品
                    removed_item = self.inventory.pop(i)
                    logger.info(f"移除物品: {removed_item.name}")
                    return removed_item
                else:
                    # 否则减少物品数量
                    item.quantity -= quantity
                    logger.info(f"减少物品数量: {item.name} (剩余: {item.quantity})")
                    return item
        
        logger.warning(f"尝试移除不存在的物品: {item_id}")
        return None
    
    def update_character(self, updates: Dict[str, Any]):
        """
        更新角色属性
        
        Args:
            updates: 要更新的属性字典
        """
        char_dict = self.character.to_dict()
        
        for key, value in updates.items():
            if key in char_dict:
                # 处理嵌套字典
                if isinstance(char_dict[key], dict) and isinstance(value, dict):
                    char_dict[key].update(value)
                else:
                    char_dict[key] = value
        
        self.character = Character.from_dict(char_dict)
        logger.info(f"更新角色属性: {updates}")
    
    def update_game_state(self, updates: Dict[str, Any]):
        """
        更新游戏状态
        
        Args:
            updates: 要更新的状态字典
        """
        state_dict = self.game_state.to_dict()
        
        for key, value in updates.items():
            if key in state_dict:
                # 处理嵌套字典
                if isinstance(state_dict[key], dict) and isinstance(value, dict):
                    state_dict[key].update(value)
                # 处理列表
                elif isinstance(state_dict[key], list) and isinstance(value, list):
                    state_dict[key].extend(value)
                else:
                    state_dict[key] = value
        
        self.game_state = GameState.from_dict(state_dict)
        logger.info(f"更新游戏状态: {updates}")
    
    def save_game(self, save_name: str = "autosave") -> str:
        """
        保存游戏
        
        Args:
            save_name: 存档名称
            
        Returns:
            存档文件路径
        """
        save_data = {
            "character": self.character.to_dict(),
            "game_state": self.game_state.to_dict(),
            "inventory": [item.to_dict() for item in self.inventory],
            "conversation_history": self.conversation_history
        }
        
        # 构建存档文件路径
        save_path = os.path.join(self.save_directory, f"{save_name}.json")
        
        # 写入存档
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(save_data, ensure_ascii=False, indent=2, fp=f)
            
        logger.info(f"游戏已保存: {save_path}")
        return save_path
    
    def load_game(self, save_name: str = "autosave") -> bool:
        """
        加载游戏
        
        Args:
            save_name: 存档名称
            
        Returns:
            是否成功加载
        """
        # 构建存档文件路径
        save_path = os.path.join(self.save_directory, f"{save_name}.json")
        
        # 检查文件是否存在
        if not os.path.exists(save_path):
            logger.warning(f"存档文件不存在: {save_path}")
            return False
        
        try:
            # 读取存档
            with open(save_path, "r", encoding="utf-8") as f:
                save_data = json.load(f)
            
            # 恢复游戏状态
            self.character = Character.from_dict(save_data["character"])
            self.game_state = GameState.from_dict(save_data["game_state"])
            self.inventory = [Item.from_dict(item) for item in save_data["inventory"]]
            self.conversation_history = save_data["conversation_history"]
            
            logger.info(f"游戏已加载: {save_path}")
            return True
            
        except Exception as e:
            logger.error(f"加载存档失败: {str(e)}")
            return False
    
    def list_saves(self) -> List[str]:
        """
        列出所有存档
        
        Returns:
            存档名称列表
        """
        if not os.path.exists(self.save_directory):
            return []
            
        save_files = [f for f in os.listdir(self.save_directory) if f.endswith(".json")]
        return [os.path.splitext(f)[0] for f in save_files]


# 示例用法
async def example_usage():
    """游戏集成示例用法"""
    # 创建游戏会话
    session = GameSession(
        character=Character(name="勇敢的探险家"),
        game_state=GameState(location="森林入口"),
        callbacks={
            "narrative": lambda content: print(f"\n{content['content']}"),
            "action": lambda content: print(f"\n* {content['content']}"),
            "option": lambda content: print(f"\n[{content.get('id', 'unknown')}] {content['content']}"),
            "system": lambda content: print(f"\n系统: {content['content']}"),
            "error": lambda content: print(f"\n错误: {content['content']}")
        }
    )
    
    # 添加物品
    session.add_item(Item(
        id="torch", 
        name="火把", 
        description="照亮黑暗的工具", 
        type="工具",
        properties={"light": 5, "durability": 10}
    ))
    
    session.add_item(Item(
        id="potion", 
        name="生命药水", 
        description="恢复少量生命值", 
        type="消耗品",
        properties={"heal": 20}
    ))
    
    # 设置API密钥（实际应用中应通过安全方式设置）
    os.environ["OPENAI_API_KEY"] = "你的API密钥"
    
    # 处理用户输入
    print("===== 游戏开始 =====")
    print(f"你是{session.character.name}，当前位置：{session.game_state.location}")
    print("你的物品栏:")
    for item in session.inventory:
        print(f"- {item.name} (x{item.quantity}): {item.description}")
    print("\n")
    
    # 进行游戏对话
    user_input = "我环顾四周，看看这个森林入口有什么特别之处"
    print(f"你: {user_input}")
    
    result = await session.process_input(user_input)
    
    # 保存游戏
    session.save_game("demo_save")
    
    print("\n可用选项:")
    for option in result["options"]:
        print(f"- [{option['id']}] {option['text']}")
    
    print("\n===== 游戏演示结束 =====")


if __name__ == "__main__":
    asyncio.run(example_usage()) 