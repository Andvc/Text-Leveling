"""
主程序：集成所有功能并提供简单的命令行界面
"""

import os
import sys
import asyncio
import argparse
from typing import Dict, List, Any, Optional

from ai_core import AICore, create_messages
from prompt_manager import PromptManager
from stream_processor import StreamProcessor
from output_formatter import OutputFormatter
from game_integration import GameSession, Character, GameState, Item
from config import API_CONFIG

class TextAdventureGame:
    """文本冒险游戏主程序"""
    
    def __init__(self, api_key: str = None, ai_provider: str = None):
        """
        初始化游戏
        
        Args:
            api_key: API密钥，如果不提供则尝试从环境变量读取
            ai_provider: AI服务提供商，默认使用配置文件中的设置
        """
        self.ai_provider = ai_provider or API_CONFIG["default_provider"]
        self.api_key = api_key
        
        # 如果未提供API密钥，尝试从环境变量读取
        if not self.api_key:
            env_var_name = f"{self.ai_provider.upper()}_API_KEY"
            self.api_key = os.environ.get(env_var_name)
            
            if not self.api_key:
                print(f"警告: 未设置API密钥，请设置环境变量{env_var_name}或在启动时提供--api-key参数")
        
        # 创建游戏会话
        self.session = GameSession(
            character=Character(name="冒险者"),
            game_state=GameState(location="起点"),
            ai_provider=self.ai_provider,
            api_key=self.api_key,
            callbacks={
                "narrative": self._on_narrative,
                "action": self._on_action,
                "option": self._on_option,
                "system": self._on_system,
                "error": self._on_error
            }
        )
        
        # 当前可用选项
        self.current_options = []
    
    def _on_narrative(self, content: Dict[str, Any]):
        """处理叙述内容"""
        print(f"\n{content['content']}")
    
    def _on_action(self, content: Dict[str, Any]):
        """处理动作内容"""
        print(f"\n* {content['content']}")
    
    def _on_option(self, content: Dict[str, Any]):
        """处理选项内容"""
        option_id = content.get('id', 'unknown')
        self.current_options.append({"id": option_id, "text": content['content']})
        print(f"\n[{option_id}] {content['content']}")
    
    def _on_system(self, content: Dict[str, Any]):
        """处理系统内容"""
        print(f"\n系统: {content['content']}")
    
    def _on_error(self, content: Dict[str, Any]):
        """处理错误内容"""
        print(f"\n错误: {content['content']}")
    
    async def start_new_game(self):
        """开始新游戏"""
        print("\n" + "="*50)
        print("欢迎来到文本冒险游戏！")
        print("="*50)
        
        # 角色创建
        name = input("\n请输入你的角色名称（默认：冒险者）: ").strip()
        if name:
            self.session.character.name = name
        
        print(f"\n你好，{self.session.character.name}！你的冒险即将开始。")
        print("\n输入 'help' 可查看帮助信息，输入 'quit' 可退出游戏。")
        print("\n" + "-"*50)
        
        # 开始游戏
        await self.process_input("我环顾四周，看看这里有什么。")
        
        # 进入主循环
        await self.game_loop()
    
    async def load_game(self, save_name: str = None):
        """
        加载游戏
        
        Args:
            save_name: 存档名称，如果不提供则显示存档列表供用户选择
        """
        if not save_name:
            # 显示存档列表
            saves = self.session.list_saves()
            if not saves:
                print("\n没有找到任何存档。")
                await self.start_new_game()
                return
                
            print("\n可用存档:")
            for i, save in enumerate(saves, 1):
                print(f"{i}. {save}")
                
            choice = input("\n请选择要加载的存档（输入编号）或输入 'n' 开始新游戏: ")
            if choice.lower() == 'n':
                await self.start_new_game()
                return
                
            try:
                save_index = int(choice) - 1
                if 0 <= save_index < len(saves):
                    save_name = saves[save_index]
                else:
                    print("\n无效的选择，将开始新游戏。")
                    await self.start_new_game()
                    return
            except ValueError:
                print("\n无效的输入，将开始新游戏。")
                await self.start_new_game()
                return
        
        # 加载存档
        if self.session.load_game(save_name):
            print(f"\n成功加载存档: {save_name}")
            print(f"\n你是{self.session.character.name}，当前位置：{self.session.game_state.location}")
            
            # 显示物品栏
            if self.session.inventory:
                print("\n你的物品栏:")
                for item in self.session.inventory:
                    print(f"- {item.name} (x{item.quantity}): {item.description}")
            
            print("\n" + "-"*50)
            print("\n游戏继续...")
            
            # 进入主循环
            await self.game_loop()
        else:
            print(f"\n无法加载存档: {save_name}，将开始新游戏。")
            await self.start_new_game()
    
    async def game_loop(self):
        """游戏主循环"""
        while True:
            # 清空当前选项
            self.current_options = []
            
            # 获取用户输入
            user_input = input("\n> ").strip()
            
            # 检查特殊命令
            if user_input.lower() == 'quit':
                self._handle_quit()
                break
            elif user_input.lower() == 'help':
                self._show_help()
                continue
            elif user_input.lower() == 'save':
                self._handle_save()
                continue
            elif user_input.lower() == 'load':
                await self._handle_load()
                continue
            elif user_input.lower() == 'inventory' or user_input.lower() == 'i':
                self._show_inventory()
                continue
            elif user_input.lower() == 'status' or user_input.lower() == 's':
                self._show_status()
                continue
            elif user_input.lower() == 'look' or user_input.lower() == 'l':
                user_input = "我环顾四周，看看这里有什么。"
            
            # 处理用户输入
            await self.process_input(user_input)
    
    async def process_input(self, user_input: str):
        """
        处理用户输入
        
        Args:
            user_input: 用户输入文本
        """
        try:
            # 检查是否是选择选项
            option_input = user_input.strip().lower()
            
            # 如果用户输入的是选项ID，将其转换为相应的选项文本
            for option in self.current_options:
                if option["id"].lower() == option_input:
                    print(f"\n你选择了: {option['text']}")
                    user_input = option['text']
                    break
            
            # 处理输入
            print("\n正在思考...")
            result = await self.session.process_input(user_input)
            
            # 结果已通过回调函数处理
            
        except Exception as e:
            print(f"\n发生错误: {str(e)}")
    
    def _handle_save(self):
        """处理保存游戏"""
        save_name = input("\n请输入存档名称（默认：autosave）: ").strip()
        if not save_name:
            save_name = "autosave"
            
        save_path = self.session.save_game(save_name)
        print(f"\n游戏已保存至: {save_path}")
    
    async def _handle_load(self):
        """处理加载游戏"""
        saves = self.session.list_saves()
        if not saves:
            print("\n没有找到任何存档。")
            return
            
        print("\n可用存档:")
        for i, save in enumerate(saves, 1):
            print(f"{i}. {save}")
            
        choice = input("\n请选择要加载的存档（输入编号）或按Enter取消: ")
        if not choice:
            return
            
        try:
            save_index = int(choice) - 1
            if 0 <= save_index < len(saves):
                save_name = saves[save_index]
                if self.session.load_game(save_name):
                    print(f"\n成功加载存档: {save_name}")
                    print(f"\n你是{self.session.character.name}，当前位置：{self.session.game_state.location}")
                    
                    # 生成当前位置的描述
                    await self.process_input("我环顾四周，看看这里有什么。")
                else:
                    print(f"\n无法加载存档: {save_name}")
            else:
                print("\n无效的选择。")
        except ValueError:
            print("\n无效的输入。")
    
    def _handle_quit(self):
        """处理退出游戏"""
        save = input("\n是否保存游戏？(y/n): ").strip().lower()
        if save == 'y':
            self._handle_save()
            
        print("\n感谢游玩！再见！")
    
    def _show_help(self):
        """显示帮助信息"""
        print("\n" + "="*50)
        print("游戏帮助")
        print("="*50)
        print("\n基本命令:")
        print("- help       : 显示帮助信息")
        print("- save       : 保存游戏")
        print("- load       : 加载游戏")
        print("- inventory, i: 查看物品栏")
        print("- status, s  : 查看角色状态")
        print("- look, l    : 查看当前位置")
        print("- quit       : 退出游戏")
        print("\n游戏提示:")
        print("- 你可以输入任何文本来描述你的行动")
        print("- 也可以直接输入选项ID（如'examine_runes'）来选择选项")
        print("- AI会根据你的输入生成游戏内容和可能的选项")
        print("\n" + "="*50)
    
    def _show_inventory(self):
        """显示物品栏"""
        if not self.session.inventory:
            print("\n你的物品栏是空的。")
            return
            
        print("\n" + "="*50)
        print("物品栏")
        print("="*50)
        
        for item in self.session.inventory:
            print(f"\n- {item.name} (x{item.quantity})")
            print(f"  描述: {item.description}")
            print(f"  类型: {item.type}")
            
            if item.properties:
                print("  属性:")
                for prop_name, prop_value in item.properties.items():
                    print(f"    {prop_name}: {prop_value}")
        
        print("\n" + "="*50)
    
    def _show_status(self):
        """显示角色状态"""
        char = self.session.character
        
        print("\n" + "="*50)
        print("角色状态")
        print("="*50)
        
        print(f"\n名称: {char.name}")
        print(f"生命值: {char.health}/{char.max_health}")
        print(f"魔法值: {char.mana}/{char.max_mana}")
        print(f"等级: {char.level}")
        print(f"经验值: {char.experience}")
        
        print("\n属性:")
        for attr_name, attr_value in char.attributes.items():
            print(f"- {attr_name}: {attr_value}")
            
        if char.skills:
            print("\n技能:")
            for skill_name, skill_value in char.skills.items():
                print(f"- {skill_name}: {skill_value}")
        
        print(f"\n当前位置: {self.session.game_state.location}")
        print("\n" + "="*50)


async def main():
    """主函数"""
    # 解析命令行参数
    parser = argparse.ArgumentParser(description="文本冒险游戏")
    parser.add_argument("--api-key", help="API密钥")
    parser.add_argument("--provider", help="AI服务提供商（例如openai, anthropic, deepseek）")
    parser.add_argument("--load", help="加载指定的存档")
    args = parser.parse_args()
    
    # 创建游戏实例
    game = TextAdventureGame(api_key=args.api_key, ai_provider=args.provider)
    
    try:
        # 加载存档或开始新游戏
        if args.load:
            await game.load_game(args.load)
        else:
            # 检查是否有存档
            saves = game.session.list_saves()
            if saves:
                print("\n发现现有存档，是否加载？")
                for i, save in enumerate(saves, 1):
                    print(f"{i}. {save}")
                print("n. 开始新游戏")
                
                choice = input("\n请选择: ").strip().lower()
                if choice == 'n':
                    await game.start_new_game()
                else:
                    try:
                        save_index = int(choice) - 1
                        if 0 <= save_index < len(saves):
                            await game.load_game(saves[save_index])
                        else:
                            await game.start_new_game()
                    except ValueError:
                        await game.start_new_game()
            else:
                await game.start_new_game()
    except KeyboardInterrupt:
        print("\n\n游戏已中断。再见！")
    except Exception as e:
        print(f"\n发生错误: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main()) 