#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
文字冒险游戏启动入口
可以从JSON加载游戏数据或使用代码定义的游戏数据
"""

import os
import argparse
from text_game_engine import GameEngine
from game_data import create_demo_game


def main():
    """游戏入口函数"""
    parser = argparse.ArgumentParser(description="文字冒险游戏")
    parser.add_argument("--json", "-j", help="从JSON文件加载游戏数据")
    parser.add_argument("--save", "-s", help="从保存文件加载游戏状态")
    parser.add_argument("--start", "-i", type=int, help="指定起始事件ID", default=1)
    args = parser.parse_args()
    
    # 显示游戏标题
    print("\n" + "="*50)
    print("                  奇幻森林冒险")
    print("="*50)
    print("你将在一个神秘的森林中醒来，探索并寻找出路...")
    print("输入选项前的数字进行选择，按S保存游戏，按Q退出游戏")
    print("="*50 + "\n")
    
    # 创建游戏引擎
    if args.json:
        # 从JSON文件加载游戏数据
        if not os.path.exists(args.json):
            print(f"错误: 找不到游戏数据文件 {args.json}")
            return
            
        engine = GameEngine()
        engine.load_from_json(args.json)
        print(f"从 {args.json} 加载游戏数据")
    else:
        # 使用代码定义的游戏数据
        engine = create_demo_game()
        print("使用默认游戏数据")
    
    # 加载保存的游戏状态
    if args.save:
        if not os.path.exists(args.save):
            print(f"错误: 找不到存档文件 {args.save}")
        elif engine.load_game(args.save):
            print(f"从 {args.save} 加载游戏状态")
        else:
            print(f"无法从 {args.save} 加载游戏状态，使用新游戏")
    
    # 开始游戏
    start_id = args.start
    if not args.save:  # 如果没有加载存档
        engine.start_game(start_id)
    else:
        # 如果加载了存档，继续游戏
        engine.game_loop()


if __name__ == "__main__":
    main() 