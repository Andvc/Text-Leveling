#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
游戏数据定义示例文件
包含示例事件、选项和条件逻辑
"""

from text_game_engine import GameEngine, GameEvent, conditions

def create_demo_game() -> GameEngine:
    """创建示例游戏
    
    Returns:
        配置好的游戏引擎实例
    """
    engine = GameEngine()
    
    # 创建起始事件
    start_event = GameEvent(1, "你醒来发现自己在一个陌生的森林里。四周是高大的树木，阳光透过树叶洒在地上。"
                           "你记不清自己是怎么来到这里的，但你感觉必须找到出路。")
    start_event.add_option("向北走", 2)
    start_event.add_option("向东走", 3)
    start_event.add_option("向南走", 4)
    start_event.add_option("检查自己的背包", 5)
    engine.add_event(start_event)
    
    # 向北 - 小溪
    north_event = GameEvent(2, "你来到一条小溪边。溪水清澈见底，看起来可以饮用。"
                           "溪边有一些浆果丛，有些浆果看起来很诱人。")
    north_event.add_option("喝点溪水", 6)
    north_event.add_option("摘些浆果", 7)
    north_event.add_option("沿着溪流走", 8)
    north_event.add_option("返回", 1)
    engine.add_event(north_event)
    
    # 向东 - 小屋
    east_event = GameEvent(3, "走了一段时间，你发现一座古老的小屋。小屋看起来已经荒废多年，"
                          "门半开着，里面黑洞洞的。")
    east_event.add_option("进入小屋", 9)
    east_event.add_option("查看小屋周围", 10)
    east_event.add_option("返回", 1)
    engine.add_event(east_event)
    
    # 向南 - 悬崖
    south_event = GameEvent(4, "你走到一处悬崖边。从这里可以看到远处的风景，似乎有一座城镇在地平线上。"
                           "悬崖太陡峭了，无法直接下去，但你注意到旁边有一条窄小的山路。")
    south_event.add_option("尝试走山路下去", 11)
    south_event.add_option("在悬崖边张望", 12)
    south_event.add_option("返回", 1)
    engine.add_event(south_event)
    
    # 检查背包
    check_bag_event = GameEvent(5, "你检查了自己的背包，里面有一把小刀、一个空水壶和一些绳子。")
    check_bag_event.set_effect("物品", "小刀", True)
    check_bag_event.set_effect("物品", "空水壶", True)
    check_bag_event.set_effect("物品", "绳子", True)
    check_bag_event.set_auto_next(1)  # 自动返回起始位置
    engine.add_event(check_bag_event)
    
    # 喝溪水
    drink_water_event = GameEvent(6, "你喝了一些清澈的溪水，感觉精神好多了。")
    drink_water_event.set_effect("属性", "精力", 20)
    # 如果有空水壶，添加填充水壶的选项
    drink_water_event.add_option("用水壶装水", 13, 
                                condition=conditions["has_item"]("空水壶"), 
                                effects={"物品": {"空水壶": False, "装满水的水壶": True}})
    drink_water_event.add_option("返回", 2)
    engine.add_event(drink_water_event)
    
    # 摘浆果
    berry_event = GameEvent(7, "你摘了一些红色的浆果。它们看起来很美味，但你不确定是否可以安全食用。")
    berry_event.set_effect("物品", "红色浆果", True)
    berry_event.add_option("尝一颗浆果", 14)
    berry_event.add_option("收集浆果但不吃", 15)
    berry_event.add_option("返回", 2)
    engine.add_event(berry_event)
    
    # 沿溪流走
    follow_stream_event = GameEvent(8, "你沿着溪流走了一段时间，发现了一片开阔地。"
                                  "这里有一个简陋的营地，看起来是猎人或旅行者留下的。")
    follow_stream_event.add_option("调查营地", 16)
    follow_stream_event.add_option("继续沿溪流走", 17)
    follow_stream_event.add_option("返回", 2)
    engine.add_event(follow_stream_event)
    
    # 进入小屋
    enter_cabin_event = GameEvent(9, "你小心地进入小屋。里面布满灰尘，但你可以看到一些家具和物品。"
                                "一张桌子上有一本书，角落里有一个箱子。")
    enter_cabin_event.add_option("查看书", 18)
    enter_cabin_event.add_option("检查箱子", 19)
    enter_cabin_event.add_option("离开小屋", 3)
    engine.add_event(enter_cabin_event)
    
    # 查看小屋周围
    cabin_surroundings_event = GameEvent(10, "你在小屋周围发现了一个小花园，虽然杂草丛生，但仍有一些药草在生长。"
                                       "你还注意到小屋后面有一条小路。")
    cabin_surroundings_event.add_option("采摘药草", 20)
    cabin_surroundings_event.add_option("沿着小路走", 21)
    cabin_surroundings_event.add_option("返回", 3)
    engine.add_event(cabin_surroundings_event)
    
    # 尝试走山路
    mountain_path_event = GameEvent(11, "你开始沿着狭窄的山路下山。路很陡，但还算安全。"
                                   "途中，你看到一个山洞入口。")
    mountain_path_event.add_option("继续下山", 22)
    mountain_path_event.add_option("探索山洞", 23)
    mountain_path_event.add_option("返回悬崖顶部", 4)
    engine.add_event(mountain_path_event)
    
    # 在悬崖边张望
    cliff_view_event = GameEvent(12, "你在悬崖边仔细观察，发现远处的城镇似乎有一些烟雾升起。"
                               "你还注意到一只鹰在天空中盘旋，然后降落在不远处的一棵树上。")
    cliff_view_event.set_effect("标记", "看到城镇", True)
    cliff_view_event.add_option("观察鹰", 24)
    cliff_view_event.add_option("返回", 4)
    engine.add_event(cliff_view_event)
    
    # 填充水壶
    fill_bottle_event = GameEvent(13, "你用水壶装满了清澈的溪水。这水应该可以在接下来的旅程中派上用场。")
    fill_bottle_event.set_auto_next(2)  # 自动返回溪边
    engine.add_event(fill_bottle_event)
    
    # 尝浆果
    taste_berry_event = GameEvent(14, "你尝了一颗浆果，味道有点酸但很甜。片刻后，你感到一阵头晕。"
                                 "这些浆果似乎有轻微的致幻效果。")
    taste_berry_event.set_effect("属性", "生命值", -10)
    taste_berry_event.set_effect("标记", "食用浆果", True)
    taste_berry_event.set_auto_next(2)  # 自动返回溪边
    engine.add_event(taste_berry_event)
    
    # 收集浆果
    collect_berries_event = GameEvent(15, "你决定收集浆果但不冒险尝试。也许以后会找到辨认它们的方法。")
    collect_berries_event.set_auto_next(2)  # 自动返回溪边
    engine.add_event(collect_berries_event)
    
    # 调查营地
    investigate_camp_event = GameEvent(16, "营地看起来已经被遗弃一段时间了，但你找到了一些有用的物品：一根火把和一个小包裹。")
    investigate_camp_event.set_effect("物品", "火把", True)
    investigate_camp_event.add_option("打开小包裹", 25)
    investigate_camp_event.add_option("离开营地", 8)
    engine.add_event(investigate_camp_event)
    
    # 继续沿溪流走
    continue_stream_event = GameEvent(17, "继续沿着溪流走，你发现溪流变宽，形成了一个小湖。湖边有一艘破旧的小船。")
    continue_stream_event.add_option("检查小船", 26)
    continue_stream_event.add_option("绕湖而行", 27)
    continue_stream_event.add_option("返回营地", 16)
    engine.add_event(continue_stream_event)
    
    # 查看书
    book_event = GameEvent(18, "这是一本日记，记录了小屋前主人的生活。最后几页提到发现了一个神秘的洞穴，"
                         "里面可能藏有宝藏，但也有危险。日记还附有一张简易地图。")
    book_event.set_effect("物品", "地图", True)
    book_event.set_effect("标记", "知道洞穴", True)
    book_event.add_option("继续查看小屋", 9)
    engine.add_event(book_event)
    
    # 检查箱子
    chest_event = GameEvent(19, "箱子上着锁。你需要钥匙才能打开它。")
    # 如果有钥匙，添加打开箱子的选项
    chest_event.add_option("用钥匙打开箱子", 28, 
                         condition=conditions["has_item"]("钥匙"))
    chest_event.add_option("尝试撬开箱子", 29,
                         condition=conditions["has_item"]("小刀"))
    chest_event.add_option("离开箱子", 9)
    engine.add_event(chest_event)
    
    # 采摘药草
    herbs_event = GameEvent(20, "你仔细辨认了一些药草并采摘了它们。有些可以用来治疗伤口，有些可以缓解疲劳。")
    herbs_event.set_effect("物品", "药草", True)
    herbs_event.set_auto_next(10)  # 自动返回小屋周围
    engine.add_event(herbs_event)
    
    # 沿着小路走
    hidden_path_event = GameEvent(21, "小路蜿蜒穿过树林，最终到达一个小湖边。湖水平静如镜，倒映着蓝天。"
                                 "湖边的一块石头上有什么东西在闪闪发光。")
    hidden_path_event.add_option("走近查看发光物", 30)
    hidden_path_event.add_option("环顾湖边", 31)
    hidden_path_event.add_option("返回小屋", 10)
    engine.add_event(hidden_path_event)
    
    # 继续下山
    descent_event = GameEvent(22, "你小心翼翼地沿着山路下山。途中，你偶尔听到远处传来的野兽吼叫声。"
                            "最终，你到达了山脚下，前方是一片开阔的草原。")
    descent_event.add_option("穿过草原", 32)
    descent_event.add_option("沿着山脚前行", 33)
    descent_event.add_option("返回山路", 11)
    engine.add_event(descent_event)
    
    # 探索山洞
    cave_event = GameEvent(23, "山洞入口很暗，你几乎看不清里面。")
    # 如果有火把，添加使用火把的选项
    cave_event.add_option("用火把照明", 34, 
                        condition=conditions["has_item"]("火把"))
    cave_event.add_option("摸黑进入", 35)
    cave_event.add_option("离开山洞", 11)
    engine.add_event(cave_event)
    
    # 观察鹰
    eagle_event = GameEvent(24, "鹰似乎并不怕人。它静静地栖息在树上，锐利的眼睛注视着你。"
                          "你注意到它的爪子上似乎抓着什么小东西。")
    eagle_event.add_option("试图接近鹰", 36)
    eagle_event.add_option("离开", 12)
    engine.add_event(eagle_event)
    
    # 打开小包裹
    package_event = GameEvent(25, "包裹里有一些干粮和一把生锈的钥匙。食物虽然有点硬，但还能吃。")
    package_event.set_effect("物品", "干粮", True)
    package_event.set_effect("物品", "生锈的钥匙", True)
    package_event.set_auto_next(16)  # 自动返回营地
    engine.add_event(package_event)
    
    # 检查小船
    boat_event = GameEvent(26, "小船有些漏水，但经过简单修补应该可以使用。船上放着一支钓鱼竿。")
    boat_event.set_effect("物品", "钓鱼竿", True)
    boat_event.add_option("修补小船", 37, 
                        condition=conditions["has_item"]("绳子"))
    boat_event.add_option("离开小船", 17)
    engine.add_event(boat_event)
    
    # 绕湖而行
    lake_path_event = GameEvent(27, "你沿着湖边行走，发现了一条小溪从湖中流出，通向远方。湖的另一侧有一块奇怪的石碑。")
    lake_path_event.add_option("查看石碑", 38)
    lake_path_event.add_option("沿着小溪走", 39)
    lake_path_event.add_option("返回", 17)
    engine.add_event(lake_path_event)
    
    # 用钥匙打开箱子
    unlock_chest_event = GameEvent(28, "你用钥匙打开了箱子。里面有一本古老的魔法书和一些金币。")
    unlock_chest_event.set_effect("物品", "魔法书", True)
    unlock_chest_event.set_effect("属性", "金币", 50)
    unlock_chest_event.set_auto_next(9)  # 自动返回小屋内部
    engine.add_event(unlock_chest_event)
    
    # 尝试撬开箱子
    force_chest_event = GameEvent(29, "你用小刀试图撬开箱子，但箱子非常结实。在多次尝试后，"
                                 "你的小刀断了，而箱子只留下一些刮痕。")
    force_chest_event.set_effect("物品", "小刀", False)  # 移除小刀
    force_chest_event.set_auto_next(9)  # 自动返回小屋内部
    engine.add_event(force_chest_event)
    
    # 走近查看发光物
    shiny_object_event = GameEvent(30, "走近后，你发现是一枚金色的钥匙在阳光下闪闪发光。这把钥匙看起来很特别，"
                                  "可能可以打开一扇重要的门或箱子。")
    shiny_object_event.set_effect("物品", "钥匙", True)
    shiny_object_event.set_auto_next(21)  # 自动返回小路
    engine.add_event(shiny_object_event)
    
    # 环顾湖边
    lake_shore_event = GameEvent(31, "湖边风景优美，你感到一阵平静。在湖的中央，似乎有一个小岛。")
    lake_shore_event.add_option("试图游到小岛", 40)
    lake_shore_event.add_option("用修好的船去小岛", 41, 
                              condition=conditions["has_flag"]("修好小船"))
    lake_shore_event.add_option("返回", 21)
    engine.add_event(lake_shore_event)
    
    # 穿过草原
    grassland_event = GameEvent(32, "草原上生长着茂密的野草，偶尔能看到一些野生动物。"
                              "走着走着，你看到远处有一座小木屋，炊烟袅袅。")
    grassland_event.add_option("走向木屋", 42)
    grassland_event.add_option("继续穿过草原", 43)
    grassland_event.add_option("返回山脚", 22)
    engine.add_event(grassland_event)
    
    # 沿着山脚前行
    mountain_base_event = GameEvent(33, "山脚下的地形比较平坦，你看到一些动物足迹。"
                                   "不远处似乎有一个狩猎陷阱。")
    mountain_base_event.add_option("检查陷阱", 44)
    mountain_base_event.add_option("继续前行", 45)
    mountain_base_event.add_option("返回山路", 22)
    engine.add_event(mountain_base_event)
    
    # 用火把照明
    torch_cave_event = GameEvent(34, "火把的光芒照亮了洞穴。你看到洞壁上有一些古老的壁画，"
                               "描绘着奇怪的仪式和宝藏。深处似乎有更多的通道。")
    torch_cave_event.add_option("查看壁画", 46)
    torch_cave_event.add_option("深入洞穴", 47)
    torch_cave_event.add_option("离开洞穴", 11)
    engine.add_event(torch_cave_event)
    
    # 摸黑进入
    dark_cave_event = GameEvent(35, "你在黑暗中摸索，但很快就迷失了方向。突然，你踩空了，"
                              "坠入一个深坑。你受了轻伤，但幸运的是，坑底有一束光线照进来，"
                              "你看到一条狭窄的通道。")
    dark_cave_event.set_effect("属性", "生命值", -30)
    dark_cave_event.add_option("沿着通道爬行", 48)
    dark_cave_event.add_option("尝试爬出深坑", 49)
    engine.add_event(dark_cave_event)
    
    # 几个关键节点的游戏结局
    
    # 试图接近鹰
    approach_eagle_event = GameEvent(36, "当你靠近时，鹰突然展翅飞走了，但掉下了它抓着的东西——一块闪亮的水晶。"
                                    "这块水晶似乎不是普通的宝石，它微微发着蓝光。")
    approach_eagle_event.set_effect("物品", "蓝色水晶", True)
    approach_eagle_event.set_effect("标记", "获得水晶", True)
    approach_eagle_event.set_auto_next(12)  # 自动返回悬崖边
    engine.add_event(approach_eagle_event)
    
    # 修补小船
    repair_boat_event = GameEvent(37, "你用绳子修补了小船的裂缝。现在它看起来可以安全地在湖上航行了。")
    repair_boat_event.set_effect("标记", "修好小船", True)
    repair_boat_event.set_auto_next(26)  # 自动返回小船处
    engine.add_event(repair_boat_event)
    
    # 查看石碑
    stone_tablet_event = GameEvent(38, "石碑上刻着古老的符文，虽然你看不懂，但它们似乎在述说湖中小岛的秘密。"
                                  "其中有一些图案展示了蓝色水晶和一扇门。")
    stone_tablet_event.set_effect("标记", "石碑知识", True)
    stone_tablet_event.set_auto_next(27)  # 自动返回湖边
    engine.add_event(stone_tablet_event)
    
    # 沿着小溪走
    follow_creek_event = GameEvent(39, "沿着小溪走，地势逐渐降低，你来到一片湿地。空气中弥漫着雾气，"
                                  "远处隐约可见一些建筑物的轮廓。")
    follow_creek_event.add_option("穿过湿地", 50)
    follow_creek_event.add_option("返回湖边", 27)
    engine.add_event(follow_creek_event)
    
    # 尝试游到小岛
    swim_island_event = GameEvent(40, "你脱下累赘的装备，开始游向小岛。但湖水比你想象的要冷，"
                                "而且距离也更远。在游到一半时，你的体力开始不支，最终决定返回岸边。")
    swim_island_event.set_effect("属性", "精力", -30)
    swim_island_event.set_auto_next(31)  # 自动返回湖边
    engine.add_event(swim_island_event)
    
    # 用船去小岛
    boat_to_island_event = GameEvent(41, "你划着修好的小船向小岛前进。当你靠近时，发现小岛上有一个古老的石头祭坛。")
    boat_to_island_event.add_option("调查祭坛", 51, 
                                  condition=conditions["has_item"]("蓝色水晶"))
    boat_to_island_event.add_option("环顾小岛", 52)
    boat_to_island_event.add_option("返回岸边", 31)
    engine.add_event(boat_to_island_event)
    
    # 调查祭坛（带水晶）
    altar_with_crystal_event = GameEvent(51, "你走近祭坛，发现中央有一个与蓝色水晶形状相符的凹槽。"
                                        "当你将水晶放入凹槽时，祭坛开始发光，地面震动，"
                                        "露出一个通往地下的楼梯。")
    altar_with_crystal_event.add_option("进入地下通道", 53)
    altar_with_crystal_event.add_option("先返回岸边", 31)
    engine.add_event(altar_with_crystal_event)
    
    # 进入地下通道
    underground_passage_event = GameEvent(53, "石阶通往一个点燃着蓝色火焰的地下洞穴。在洞穴的中央，"
                                        "有一个看起来像传送门的构造，闪烁着蓝色的光芒。")
    underground_passage_event.add_option("进入传送门", 54)
    underground_passage_event.add_option("返回地面", 51)
    engine.add_event(underground_passage_event)
    
    # 进入传送门（游戏胜利结局）
    portal_event = GameEvent(54, "你鼓起勇气，踏入传送门。眼前一片闪光，你感到自己被拉扯穿越空间。"
                           "当感觉恢复正常时，你发现自己站在一个完全陌生的世界——一个魔法世界的入口。"
                           "你的冒险才刚刚开始...")
    portal_event.set_effect("标记", "游戏胜利", True)
    engine.add_event(portal_event)
    
    return engine


if __name__ == "__main__":
    # 直接运行此文件可以测试游戏
    game = create_demo_game()
    game.start_game(1) 