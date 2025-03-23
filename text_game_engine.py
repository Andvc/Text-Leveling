#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import pickle
import random
from typing import Dict, List, Callable, Optional, Any, Union, Set

class PlayerState:
    """玩家状态类，用于存储玩家的各种属性和状态"""
    
    def __init__(self, name: str = "玩家"):
        """初始化玩家状态
        
        Args:
            name: 玩家名称
        """
        self.name = name
        self.attributes = {
            "生命值": 100,
            "精力": 100,
            "金币": 0,
            "经验值": 0,
            "等级": 1
        }
        self.inventory = set()  # 物品背包
        self.flags = set()  # 游戏标记，用于记录特定事件是否发生
        self.visited_events = set()  # 已访问事件ID集合
        
    def modify_attribute(self, attr_name: str, value: int) -> int:
        """修改玩家属性值
        
        Args:
            attr_name: 属性名称
            value: 增加或减少的值
            
        Returns:
            修改后的属性值
        """
        if attr_name not in self.attributes:
            self.attributes[attr_name] = 0
            
        self.attributes[attr_name] += value
        return self.attributes[attr_name]
    
    def get_attribute(self, attr_name: str) -> int:
        """获取属性值
        
        Args:
            attr_name: 属性名称
            
        Returns:
            属性值，如不存在返回0
        """
        return self.attributes.get(attr_name, 0)
    
    def add_item(self, item: str) -> None:
        """添加物品到背包
        
        Args:
            item: 物品名称
        """
        self.inventory.add(item)
        
    def remove_item(self, item: str) -> bool:
        """从背包移除物品
        
        Args:
            item: 物品名称
            
        Returns:
            是否成功移除
        """
        if item in self.inventory:
            self.inventory.remove(item)
            return True
        return False
    
    def has_item(self, item: str) -> bool:
        """检查是否拥有物品
        
        Args:
            item: 物品名称
            
        Returns:
            是否拥有该物品
        """
        return item in self.inventory
    
    def set_flag(self, flag: str) -> None:
        """设置游戏标记
        
        Args:
            flag: 标记名称
        """
        self.flags.add(flag)
        
    def has_flag(self, flag: str) -> bool:
        """检查是否有标记
        
        Args:
            flag: 标记名称
            
        Returns:
            是否有该标记
        """
        return flag in self.flags
    
    def add_visited_event(self, event_id: int) -> None:
        """添加已访问事件
        
        Args:
            event_id: 事件ID
        """
        self.visited_events.add(event_id)
        
    def has_visited_event(self, event_id: int) -> bool:
        """检查是否访问过事件
        
        Args:
            event_id: 事件ID
            
        Returns:
            是否访问过该事件
        """
        return event_id in self.visited_events
    
    def __str__(self) -> str:
        """返回玩家状态的字符串表示"""
        output = [f"--- {self.name}的状态 ---"]
        for attr, value in self.attributes.items():
            output.append(f"{attr}: {value}")
        
        if self.inventory:
            output.append("\n物品:")
            for item in self.inventory:
                output.append(f"- {item}")
                
        return "\n".join(output)


class GameOption:
    """游戏选项类，代表事件中的一个选择"""
    
    def __init__(
        self, 
        text: str, 
        next_event_id: int,
        condition: Optional[Callable[[PlayerState], bool]] = None,
        effects: Optional[Dict[str, Any]] = None
    ):
        """初始化游戏选项
        
        Args:
            text: 选项文本
            next_event_id: 选择后跳转的事件ID
            condition: 选项可用的条件函数
            effects: 选择该选项产生的效果
        """
        self.text = text
        self.next_event_id = next_event_id
        self.condition = condition
        self.effects = effects or {}
        
    def is_available(self, player: PlayerState) -> bool:
        """检查选项是否可用
        
        Args:
            player: 玩家状态
            
        Returns:
            选项是否可用
        """
        if self.condition is None:
            return True
        return self.condition(player)
    
    def apply_effects(self, player: PlayerState) -> None:
        """应用选项效果
        
        Args:
            player: 玩家状态
        """
        for effect_type, effect_data in self.effects.items():
            if effect_type == "属性":
                for attr, value in effect_data.items():
                    player.modify_attribute(attr, value)
            elif effect_type == "物品":
                for item, operation in effect_data.items():
                    if operation:  # True表示添加物品
                        player.add_item(item)
                    else:  # False表示移除物品
                        player.remove_item(item)
            elif effect_type == "标记":
                for flag in effect_data:
                    player.set_flag(flag)


class GameEvent:
    """游戏事件类，代表一个游戏场景或情节"""
    
    def __init__(self, event_id: int, description: str):
        """初始化游戏事件
        
        Args:
            event_id: 事件ID
            description: 事件描述文本
        """
        self.id = event_id
        self.description = description
        self.options: List[GameOption] = []
        self.auto_next: Optional[int] = None  # 自动跳转的下一事件ID
        self.effects: Dict[str, Any] = {}  # 进入事件时自动应用的效果
        
    def add_option(
        self, 
        text: str, 
        next_event_id: int,
        condition: Optional[Callable[[PlayerState], bool]] = None,
        effects: Optional[Dict[str, Any]] = None
    ) -> None:
        """添加选项
        
        Args:
            text: 选项文本
            next_event_id: 选择后跳转的事件ID
            condition: 选项可用的条件函数
            effects: 选择该选项产生的效果
        """
        option = GameOption(text, next_event_id, condition, effects)
        self.options.append(option)
        
    def set_auto_next(self, next_event_id: int) -> None:
        """设置自动跳转的下一事件
        
        Args:
            next_event_id: 下一事件ID
        """
        self.auto_next = next_event_id
        
    def set_effect(self, effect_type: str, key: str, value: Any) -> None:
        """设置事件效果
        
        Args:
            effect_type: 效果类型（属性/物品/标记）
            key: 效果键（属性名/物品名/标记名）
            value: 效果值
        """
        if effect_type not in self.effects:
            self.effects[effect_type] = {}
            
        if effect_type == "属性":
            self.effects[effect_type][key] = value
        elif effect_type == "物品":
            self.effects[effect_type][key] = value  # True添加/False移除
        elif effect_type == "标记":
            if "标记" not in self.effects:
                self.effects["标记"] = []
            if isinstance(self.effects["标记"], list):
                if key not in self.effects["标记"]:
                    self.effects["标记"].append(key)
            else:
                # 如果不是列表，则初始化为列表
                self.effects["标记"] = [key]
            
    def apply_effects(self, player: PlayerState) -> None:
        """应用事件效果
        
        Args:
            player: 玩家状态
        """
        for effect_type, effect_data in self.effects.items():
            if effect_type == "属性":
                for attr, value in effect_data.items():
                    player.modify_attribute(attr, value)
            elif effect_type == "物品":
                for item, operation in effect_data.items():
                    if operation:  # True表示添加物品
                        player.add_item(item)
                    else:  # False表示移除物品
                        player.remove_item(item)
            elif effect_type == "标记":
                if isinstance(effect_data, list):
                    for flag in effect_data:
                        player.set_flag(flag)
     
    def get_available_options(self, player: PlayerState) -> List[GameOption]:
        """获取可用选项列表
        
        Args:
            player: 玩家状态
            
        Returns:
            可用选项列表
        """
        return [opt for opt in self.options if opt.is_available(player)]
    
    def __str__(self) -> str:
        """返回事件的字符串表示"""
        return f"事件 {self.id}: {self.description}"


class GameEngine:
    """游戏引擎类，用于管理游戏事件和流程"""
    
    def __init__(self):
        """初始化游戏引擎"""
        self.events: Dict[int, GameEvent] = {}
        self.player = PlayerState()
        self.current_event_id: Optional[int] = None
        self.game_over = False
        
    def add_event(self, event: GameEvent) -> None:
        """添加事件到游戏
        
        Args:
            event: 游戏事件对象
        """
        self.events[event.id] = event
        
    def load_from_json(self, file_path: str) -> None:
        """从JSON文件加载游戏数据
        
        Args:
            file_path: JSON文件路径
        """
        if not os.path.exists(file_path):
            print(f"错误: 找不到游戏数据文件 {file_path}")
            return
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # 加载事件
            for event_id, event_data in data.get("events", {}).items():
                event_id = int(event_id)
                event = GameEvent(event_id, event_data["description"])
                
                # 加载事件效果
                for effect_type, effects in event_data.get("effects", {}).items():
                    if effect_type == "属性":
                        for attr, value in effects.items():
                            event.set_effect("属性", attr, value)
                    elif effect_type == "物品":
                        for item, operation in effects.items():
                            event.set_effect("物品", item, operation)
                    elif effect_type == "标记":
                        for flag in effects:
                            event.set_effect("标记", flag, True)
                
                # 加载自动跳转
                if "auto_next" in event_data:
                    event.set_auto_next(int(event_data["auto_next"]))
                
                # 加载选项
                for option_data in event_data.get("options", []):
                    next_id = int(option_data["next_id"])
                    condition = None
                    
                    # 处理条件
                    if "condition" in option_data:
                        cond_data = option_data["condition"]
                        cond_type = cond_data["type"]
                        
                        if cond_type == "has_item":
                            item = cond_data["item"]
                            condition = lambda player, item=item: player.has_item(item)
                        elif cond_type == "has_flag":
                            flag = cond_data["flag"]
                            condition = lambda player, flag=flag: player.has_flag(flag)
                        elif cond_type == "attr_check":
                            attr = cond_data["attr"]
                            value = cond_data["value"]
                            op = cond_data.get("op", ">=")
                            
                            if op == ">=":
                                condition = lambda player, attr=attr, value=value: player.get_attribute(attr) >= value
                            elif op == "==":
                                condition = lambda player, attr=attr, value=value: player.get_attribute(attr) == value
                            elif op == "<=":
                                condition = lambda player, attr=attr, value=value: player.get_attribute(attr) <= value
                            elif op == ">":
                                condition = lambda player, attr=attr, value=value: player.get_attribute(attr) > value
                            elif op == "<":
                                condition = lambda player, attr=attr, value=value: player.get_attribute(attr) < value
                    
                    # 处理效果
                    effects = option_data.get("effects", {})
                    
                    event.add_option(option_data["text"], next_id, condition, effects)
                
                self.add_event(event)
                
            print(f"成功从 {file_path} 加载游戏数据")
        except Exception as e:
            print(f"加载游戏数据时出错: {e}")
    
    def save_game(self, file_path: str) -> bool:
        """保存游戏状态
        
        Args:
            file_path: 保存文件路径
            
        Returns:
            是否成功保存
        """
        try:
            game_state = {
                "player": self.player,
                "current_event_id": self.current_event_id,
                "game_over": self.game_over
            }
            
            with open(file_path, 'wb') as f:
                pickle.dump(game_state, f)
                
            print(f"游戏已保存到 {file_path}")
            return True
        except Exception as e:
            print(f"保存游戏时出错: {e}")
            return False
    
    def load_game(self, file_path: str) -> bool:
        """加载游戏状态
        
        Args:
            file_path: 保存文件路径
            
        Returns:
            是否成功加载
        """
        try:
            with open(file_path, 'rb') as f:
                game_state = pickle.load(f)
                
            self.player = game_state["player"]
            self.current_event_id = game_state["current_event_id"]
            self.game_over = game_state["game_over"]
            
            print(f"游戏已从 {file_path} 加载")
            return True
        except Exception as e:
            print(f"加载游戏时出错: {e}")
            return False
    
    def start_game(self, start_event_id: Optional[int] = None) -> None:
        """开始游戏
        
        Args:
            start_event_id: 起始事件ID，如不指定则使用第一个事件
        """
        if not self.events:
            print("错误: 没有加载任何事件")
            return
            
        if start_event_id is None:
            # 使用第一个事件作为起始事件
            start_event_id = min(self.events.keys())
            
        if start_event_id not in self.events:
            print(f"错误: 找不到ID为 {start_event_id} 的事件")
            return
            
        self.current_event_id = start_event_id
        self.game_over = False
        self.game_loop()
    
    def process_event(self, event_id: int) -> None:
        """处理事件
        
        Args:
            event_id: 事件ID
        """
        if event_id not in self.events:
            print(f"错误: 找不到ID为 {event_id} 的事件")
            self.game_over = True
            return
            
        event = self.events[event_id]
        self.current_event_id = event_id
        
        # 记录已访问
        self.player.add_visited_event(event_id)
        
        # 应用事件效果
        event.apply_effects(self.player)
        
        # 显示事件描述
        print("\n" + "="*50)
        print(event.description)
        print("="*50)
        
        # 如果没有选项且有自动跳转，则自动进入下一事件
        if not event.options and event.auto_next is not None:
            print("\n[按回车继续...]")
            input()
            self.process_event(event.auto_next)
            return
            
        # 显示玩家状态
        print(self.player)
        
        # 获取可用选项
        available_options = event.get_available_options(self.player)
        
        # 如果没有可用选项，游戏结束
        if not available_options and event.auto_next is None:
            print("\n没有可用的选项，游戏结束")
            self.game_over = True
            return
            
        # 显示选项
        if available_options:
            print("\n可用选项:")
            for i, option in enumerate(available_options, 1):
                print(f"[{i}] {option.text}")
                
            # 特殊选项
            print("\n[S] 保存游戏")
            print("[Q] 退出游戏")
            
            # 获取玩家选择
            while True:
                choice = input("\n请选择 > ").strip().upper()
                
                if choice == "S":
                    save_path = input("请输入保存文件名: ").strip()
                    if not save_path:
                        save_path = "save.dat"
                    self.save_game(save_path)
                    continue
                    
                if choice == "Q":
                    confirm = input("确定要退出游戏吗? (Y/N) ").strip().upper()
                    if confirm == "Y":
                        self.game_over = True
                        return
                    continue
                    
                try:
                    idx = int(choice) - 1
                    if 0 <= idx < len(available_options):
                        selected_option = available_options[idx]
                        
                        # 应用选项效果
                        selected_option.apply_effects(self.player)
                        
                        # 进入下一事件
                        self.process_event(selected_option.next_event_id)
                        return
                    else:
                        print("无效的选择，请重试")
                except ValueError:
                    print("无效的选择，请重试")
    
    def game_loop(self) -> None:
        """游戏主循环"""
        while not self.game_over:
            if self.current_event_id is not None:
                self.process_event(self.current_event_id)
            else:
                print("错误: 没有当前事件")
                self.game_over = True
                
        print("\n游戏结束，感谢游玩！")


# 条件函数生成器
def create_conditions():
    """创建常用条件函数"""
    
    def has_item(item_name: str) -> Callable[[PlayerState], bool]:
        """创建检查玩家是否拥有物品的条件函数
        
        Args:
            item_name: 物品名称
            
        Returns:
            条件函数
        """
        return lambda player: player.has_item(item_name)
        
    def has_flag(flag_name: str) -> Callable[[PlayerState], bool]:
        """创建检查玩家是否有标记的条件函数
        
        Args:
            flag_name: 标记名称
            
        Returns:
            条件函数
        """
        return lambda player: player.has_flag(flag_name)
        
    def attr_gte(attr_name: str, value: int) -> Callable[[PlayerState], bool]:
        """创建检查玩家属性是否大于等于指定值的条件函数
        
        Args:
            attr_name: 属性名称
            value: 比较值
            
        Returns:
            条件函数
        """
        return lambda player: player.get_attribute(attr_name) >= value
        
    def attr_lte(attr_name: str, value: int) -> Callable[[PlayerState], bool]:
        """创建检查玩家属性是否小于等于指定值的条件函数
        
        Args:
            attr_name: 属性名称
            value: 比较值
            
        Returns:
            条件函数
        """
        return lambda player: player.get_attribute(attr_name) <= value
        
    def attr_eq(attr_name: str, value: int) -> Callable[[PlayerState], bool]:
        """创建检查玩家属性是否等于指定值的条件函数
        
        Args:
            attr_name: 属性名称
            value: 比较值
            
        Returns:
            条件函数
        """
        return lambda player: player.get_attribute(attr_name) == value
        
    def not_visited(event_id: int) -> Callable[[PlayerState], bool]:
        """创建检查玩家是否未访问过某事件的条件函数
        
        Args:
            event_id: 事件ID
            
        Returns:
            条件函数
        """
        return lambda player: not player.has_visited_event(event_id)
        
    def combine_and(*conditions: Callable[[PlayerState], bool]) -> Callable[[PlayerState], bool]:
        """组合多个条件为逻辑与关系
        
        Args:
            *conditions: 条件函数列表
            
        Returns:
            组合后的条件函数
        """
        return lambda player: all(cond(player) for cond in conditions)
        
    def combine_or(*conditions: Callable[[PlayerState], bool]) -> Callable[[PlayerState], bool]:
        """组合多个条件为逻辑或关系
        
        Args:
            *conditions: 条件函数列表
            
        Returns:
            组合后的条件函数
        """
        return lambda player: any(cond(player) for cond in conditions)
        
    return {
        "has_item": has_item,
        "has_flag": has_flag,
        "attr_gte": attr_gte,
        "attr_lte": attr_lte,
        "attr_eq": attr_eq,
        "not_visited": not_visited,
        "combine_and": combine_and,
        "combine_or": combine_or
    }


# 导出常用条件函数
conditions = create_conditions() 