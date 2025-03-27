"""
提示词管理器模块：负责提示词模板和动态生成
"""

import os
import json
from typing import Dict, List, Any, Optional, Union
from string import Template
from config import PROMPT_CONFIG

class PromptTemplate:
    """提示词模板类，用于管理和渲染提示词模板"""
    
    def __init__(self, template: str):
        """
        初始化提示词模板
        
        Args:
            template: 提示词模板字符串，可包含$name格式的占位符
        """
        self.template = Template(template)
    
    def render(self, **kwargs) -> str:
        """
        渲染提示词模板
        
        Args:
            **kwargs: 用于替换模板中占位符的键值对
            
        Returns:
            渲染后的提示词字符串
        """
        return self.template.safe_substitute(**kwargs)


class PromptManager:
    """提示词管理器，用于管理和生成提示词"""
    
    def __init__(self, system_prompt: str = None, templates_dir: str = None):
        """
        初始化提示词管理器
        
        Args:
            system_prompt: 系统提示词，默认使用配置文件中的系统提示词
            templates_dir: 提示词模板目录，默认为"./prompts"
        """
        self.system_prompt = system_prompt or PROMPT_CONFIG["system_prompt"]
        self.templates_dir = templates_dir or "./prompts"
        self.templates: Dict[str, PromptTemplate] = {}
        self.context: Dict[str, Any] = {}
        
        # 加载内置的输出格式模板
        self.output_formats = PROMPT_CONFIG["output_format"]
        
        # 确保模板目录存在
        if not os.path.exists(self.templates_dir):
            os.makedirs(self.templates_dir)
        
        # 加载模板目录中的所有模板
        self._load_templates()
    
    def _load_templates(self):
        """加载模板目录中的所有模板文件"""
        if not os.path.exists(self.templates_dir):
            return
            
        for filename in os.listdir(self.templates_dir):
            if filename.endswith(".txt") or filename.endswith(".prompt"):
                template_name = os.path.splitext(filename)[0]
                file_path = os.path.join(self.templates_dir, filename)
                
                with open(file_path, "r", encoding="utf-8") as f:
                    template_content = f.read()
                    
                self.templates[template_name] = PromptTemplate(template_content)
    
    def save_template(self, name: str, template: str):
        """
        保存提示词模板
        
        Args:
            name: 模板名称
            template: 模板内容
        """
        # 创建模板对象
        self.templates[name] = PromptTemplate(template)
        
        # 保存到文件
        file_path = os.path.join(self.templates_dir, f"{name}.prompt")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(template)
    
    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """
        获取提示词模板
        
        Args:
            name: 模板名称
            
        Returns:
            提示词模板对象，如果不存在则返回None
        """
        return self.templates.get(name)
    
    def render_template(self, name: str, **kwargs) -> str:
        """
        渲染指定的提示词模板
        
        Args:
            name: 模板名称
            **kwargs: 用于替换模板中占位符的键值对
            
        Returns:
            渲染后的提示词字符串
            
        Raises:
            ValueError: 如果模板不存在
        """
        template = self.get_template(name)
        if not template:
            raise ValueError(f"提示词模板'{name}'不存在")
            
        # 合并上下文和传入的参数
        render_params = {**self.context, **kwargs}
        
        return template.render(**render_params)
    
    def update_context(self, **kwargs):
        """
        更新提示词上下文
        
        Args:
            **kwargs: 要更新的上下文键值对
        """
        self.context.update(kwargs)
    
    def clear_context(self):
        """清空提示词上下文"""
        self.context.clear()
    
    def get_system_prompt(self) -> str:
        """
        获取系统提示词，可根据上下文动态生成
        
        Returns:
            系统提示词字符串
        """
        # 如果系统提示词是模板，则进行渲染
        if "$" in self.system_prompt:
            template = PromptTemplate(self.system_prompt)
            return template.render(**self.context)
            
        return self.system_prompt
    
    def format_output(self, content: str, format_type: str, **kwargs) -> str:
        """
        使用指定的输出格式包装内容
        
        Args:
            content: 要包装的内容
            format_type: 输出格式类型，必须是配置中定义的格式之一
            **kwargs: 格式化参数
            
        Returns:
            格式化后的内容
            
        Raises:
            ValueError: 如果格式类型不存在
        """
        if format_type not in self.output_formats:
            raise ValueError(f"未定义的输出格式类型: {format_type}")
            
        format_template = self.output_formats[format_type]
        start_tag = format_template["start_tag"]
        end_tag = format_template["end_tag"]
        
        # 处理包含参数的标签（如OPTION的id）
        if "{" in start_tag:
            start_tag = start_tag.format(**kwargs)
            
        return f"{start_tag}{content}{end_tag}"
    
    def create_game_prompt(
        self, 
        user_input: str, 
        game_state: Dict[str, Any] = None,
        inventory: List[Dict[str, Any]] = None,
        character: Dict[str, Any] = None,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """
        创建游戏提示词，集成游戏状态、物品栏和角色信息
        
        Args:
            user_input: 用户输入
            game_state: 游戏状态信息
            inventory: 物品栏信息
            character: 角色信息
            conversation_history: 对话历史
            
        Returns:
            完整的游戏提示词
        """
        prompt_parts = []
        
        # 添加游戏状态信息
        if game_state:
            state_info = json.dumps(game_state, ensure_ascii=False, indent=2)
            prompt_parts.append(f"当前游戏状态:\n{state_info}")
            
        # 添加角色信息
        if character:
            char_info = json.dumps(character, ensure_ascii=False, indent=2)
            prompt_parts.append(f"角色信息:\n{char_info}")
            
        # 添加物品栏信息
        if inventory:
            inv_info = json.dumps(inventory, ensure_ascii=False, indent=2)
            prompt_parts.append(f"物品栏:\n{inv_info}")
            
        # 添加对话历史摘要（如果提供）
        if conversation_history:
            # 简化为最近5条对话
            recent_history = conversation_history[-5:] if len(conversation_history) > 5 else conversation_history
            history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in recent_history])
            prompt_parts.append(f"最近对话:\n{history_text}")
            
        # 添加用户当前输入
        prompt_parts.append(f"用户输入: {user_input}")
        
        # 添加输出格式说明
        prompt_parts.append("请使用以下格式回应:")
        for format_type, format_info in self.output_formats.items():
            prompt_parts.append(f"- {format_info['description']}: {format_info['start_tag']}内容{format_info['end_tag']}")
            
        # 组合所有部分
        return "\n\n".join(prompt_parts)


# 示例用法
def example_usage():
    """提示词管理器示例用法"""
    # 创建提示词管理器
    prompt_manager = PromptManager()
    
    # 保存自定义模板
    prompt_manager.save_template(
        "cave_exploration",
        """你是一个洞穴探险的向导，请描述$player_name在$cave_name中遇到的情况。
        
环境描述:
$cave_description

请生成一个探险场景，并提供三个可能的行动选择。"""
    )
    
    # 更新上下文
    prompt_manager.update_context(
        player_name="勇敢的探险家",
        cave_name="龙骨洞穴",
        cave_description="这是一个古老的洞穴，墙壁上布满了奇怪的符文，地面上散落着不知名生物的骨头。"
    )
    
    # 渲染模板
    prompt = prompt_manager.render_template("cave_exploration")
    print("渲染后的提示词:\n", prompt)
    
    # 创建游戏提示词
    game_prompt = prompt_manager.create_game_prompt(
        user_input="我想查看那些符文",
        game_state={"location": "龙骨洞穴", "time": "夜晚", "events_triggered": ["入口触发器"]},
        character={"name": "勇敢的探险家", "health": 100, "mana": 50},
        inventory=[{"id": "torch", "name": "火把", "description": "照亮黑暗的工具"}]
    )
    print("\n游戏提示词:\n", game_prompt)
    
    # 使用输出格式
    narrative = prompt_manager.format_output("你小心翼翼地靠近墙壁，仔细观察那些神秘的符文。", "narrative")
    option1 = prompt_manager.format_output("尝试触摸符文", "option", id="touch_runes")
    option2 = prompt_manager.format_output("记录符文图案", "option", id="record_runes")
    option3 = prompt_manager.format_output("继续往洞穴深处探索", "option", id="explore_deeper")
    
    print("\n格式化输出示例:")
    print(narrative)
    print(option1)
    print(option2)
    print(option3)


if __name__ == "__main__":
    example_usage() 