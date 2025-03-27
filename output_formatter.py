"""
输出格式化模块：负责格式解析和内容分段处理
"""

import re
import json
from typing import Dict, List, Any, Optional, Union, Tuple, Callable
from config import PROMPT_CONFIG

class OutputFormatter:
    """输出格式化器，负责解析和处理AI输出的格式化内容"""
    
    def __init__(self, output_formats: Dict[str, Dict[str, str]] = None):
        """
        初始化输出格式化器
        
        Args:
            output_formats: 输出格式配置，默认从配置文件中获取
        """
        self.output_formats = output_formats or PROMPT_CONFIG["output_format"]
        self._compile_patterns()
    
    def _compile_patterns(self):
        """编译用于匹配各种输出格式的正则表达式模式"""
        self.patterns = {}
        
        for format_type, format_info in self.output_formats.items():
            start_tag = format_info["start_tag"]
            end_tag = format_info["end_tag"]
            
            # 处理包含参数的标签（如OPTION的id）
            if "{" in start_tag:
                # 创建能匹配参数的模式
                # 例如: <OPTION id="{id}"> 转换为 <OPTION id="([^"]+)">
                pattern_str = re.escape(start_tag).replace("\\{id\\}", '([^"]+)')
                pattern_str += "(.*?)" + re.escape(end_tag)
                self.patterns[format_type] = re.compile(pattern_str, re.DOTALL)
            else:
                # 对于没有参数的标签，使用简单的模式
                pattern_str = re.escape(start_tag) + "(.*?)" + re.escape(end_tag)
                self.patterns[format_type] = re.compile(pattern_str, re.DOTALL)
    
    def parse_content(self, content: str) -> List[Dict[str, Any]]:
        """
        解析格式化内容，提取所有标记的内容段
        
        Args:
            content: AI生成的完整内容字符串
            
        Returns:
            解析后的内容段列表，每个元素包含类型和内容
        """
        parsed_segments = []
        
        # 遍历所有格式类型，查找匹配
        for format_type, pattern in self.patterns.items():
            for match in pattern.finditer(content):
                if "{" in self.output_formats[format_type]["start_tag"]:
                    # 带参数的标签（如OPTION）
                    id_value = match.group(1)
                    content_text = match.group(2)
                    parsed_segments.append({
                        "type": format_type,
                        "content": content_text,
                        "id": id_value
                    })
                else:
                    # 无参数标签（如NARRATIVE）
                    content_text = match.group(1)
                    parsed_segments.append({
                        "type": format_type,
                        "content": content_text
                    })
        
        # 按照在原始文本中的顺序排序解析结果
        parsed_segments.sort(key=lambda x: content.find(x["content"]))
        
        return parsed_segments
    
    def extract_by_type(self, content: str, format_type: str) -> List[Dict[str, Any]]:
        """
        从内容中提取指定类型的所有内容段
        
        Args:
            content: AI生成的完整内容字符串
            format_type: 要提取的内容类型
            
        Returns:
            指定类型的内容段列表
        """
        if format_type not in self.patterns:
            raise ValueError(f"未知的格式类型: {format_type}")
            
        pattern = self.patterns[format_type]
        result = []
        
        for match in pattern.finditer(content):
            if "{" in self.output_formats[format_type]["start_tag"]:
                # 带参数的标签（如OPTION）
                id_value = match.group(1)
                content_text = match.group(2)
                result.append({
                    "type": format_type,
                    "content": content_text,
                    "id": id_value
                })
            else:
                # 无参数标签（如NARRATIVE）
                content_text = match.group(1)
                result.append({
                    "type": format_type,
                    "content": content_text
                })
                
        return result
    
    def format_content(self, content: str, format_type: str, **kwargs) -> str:
        """
        使用指定格式包装内容
        
        Args:
            content: 要格式化的内容
            format_type: 格式类型
            **kwargs: 格式化参数（如id）
            
        Returns:
            格式化后的内容
            
        Raises:
            ValueError: 如果格式类型不存在
        """
        if format_type not in self.output_formats:
            raise ValueError(f"未知的格式类型: {format_type}")
            
        format_info = self.output_formats[format_type]
        start_tag = format_info["start_tag"]
        end_tag = format_info["end_tag"]
        
        # 处理包含参数的标签
        if "{" in start_tag:
            start_tag = start_tag.format(**kwargs)
            
        return f"{start_tag}{content}{end_tag}"
    
    def format_game_output(self, parsed_content: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        将解析后的内容组织为游戏输出格式
        
        Args:
            parsed_content: 解析后的内容段列表
            
        Returns:
            格式化的游戏输出字典
        """
        result = {
            "narrative": [],
            "actions": [],
            "options": [],
            "system": [],
            "errors": []
        }
        
        for segment in parsed_content:
            content_type = segment["type"]
            
            if content_type == "narrative":
                result["narrative"].append(segment["content"])
            elif content_type == "action":
                result["actions"].append(segment["content"])
            elif content_type == "option":
                result["options"].append({
                    "id": segment.get("id", "unknown"),
                    "text": segment["content"]
                })
            elif content_type == "system":
                result["system"].append(segment["content"])
            elif content_type == "error":
                result["errors"].append(segment["content"])
                
        return result
    
    def format_to_html(self, parsed_content: List[Dict[str, Any]]) -> str:
        """
        将解析后的内容转换为HTML格式
        
        Args:
            parsed_content: 解析后的内容段列表
            
        Returns:
            HTML格式的内容
        """
        html_parts = []
        
        for segment in parsed_content:
            content_type = segment["type"]
            content = segment["content"]
            
            if content_type == "narrative":
                html_parts.append(f'<div class="narrative">{content}</div>')
            elif content_type == "action":
                html_parts.append(f'<div class="action">{content}</div>')
            elif content_type == "option":
                option_id = segment.get("id", "unknown")
                html_parts.append(f'<button class="option" data-id="{option_id}">{content}</button>')
            elif content_type == "system":
                html_parts.append(f'<div class="system-message">{content}</div>')
            elif content_type == "error":
                html_parts.append(f'<div class="error-message">{content}</div>')
                
        return "\n".join(html_parts)
    
    def format_to_text(self, parsed_content: List[Dict[str, Any]]) -> str:
        """
        将解析后的内容转换为纯文本格式
        
        Args:
            parsed_content: 解析后的内容段列表
            
        Returns:
            文本格式的内容
        """
        text_parts = []
        
        for segment in parsed_content:
            content_type = segment["type"]
            content = segment["content"]
            
            if content_type == "narrative":
                text_parts.append(f"{content}")
            elif content_type == "action":
                text_parts.append(f"* {content}")
            elif content_type == "option":
                option_id = segment.get("id", "unknown")
                text_parts.append(f"[{option_id}] {content}")
            elif content_type == "system":
                text_parts.append(f"系统: {content}")
            elif content_type == "error":
                text_parts.append(f"错误: {content}")
                
        return "\n\n".join(text_parts)


# 示例用法
def example_usage():
    """输出格式化器示例用法"""
    # 模拟AI生成的格式化内容
    ai_content = """
    <NARRATIVE>你来到了一个神秘的洞穴入口。入口上方有古老的符文，石壁上爬满了藤蔓。洞穴深处传来微弱的光芒和神秘的声音。</NARRATIVE>
    
    <SYSTEM>发现新地点：神秘洞穴</SYSTEM>
    
    <ACTION>你点燃了火把，准备探索洞穴深处。</ACTION>
    
    <OPTION id="enter_cave">进入洞穴探索</OPTION>
    <OPTION id="examine_runes">检查入口的符文</OPTION>
    <OPTION id="gather_plants">采集洞口周围的植物</OPTION>
    <OPTION id="return_town">返回小镇寻求帮助</OPTION>
    """
    
    # 创建输出格式化器
    formatter = OutputFormatter()
    
    # 解析内容
    parsed_content = formatter.parse_content(ai_content)
    print("解析后的内容段:")
    for segment in parsed_content:
        segment_type = segment["type"]
        if segment_type == "option":
            print(f"[{segment_type} - {segment.get('id')}] {segment['content']}")
        else:
            print(f"[{segment_type}] {segment['content']}")
    
    # 提取指定类型的内容
    options = formatter.extract_by_type(ai_content, "option")
    print("\n可选选项:")
    for option in options:
        print(f"- [{option['id']}] {option['content']}")
    
    # 格式化为游戏输出
    game_output = formatter.format_game_output(parsed_content)
    print("\n游戏输出格式:")
    print(json.dumps(game_output, ensure_ascii=False, indent=2))
    
    # 格式化为HTML
    html_output = formatter.format_to_html(parsed_content)
    print("\nHTML输出:")
    print(html_output)
    
    # 格式化为纯文本
    text_output = formatter.format_to_text(parsed_content)
    print("\n文本输出:")
    print(text_output)


if __name__ == "__main__":
    example_usage()