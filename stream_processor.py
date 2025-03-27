"""
流式内容处理器模块：负责实时接收和处理AI生成的内容流
"""

import re
import asyncio
from typing import Dict, List, Any, Optional, Callable, AsyncGenerator, Union, Set
from config import STREAM_CONFIG, PROMPT_CONFIG

class StreamBuffer:
    """流内容缓冲区，用于处理流式传输的文本块"""
    
    def __init__(self, buffer_size: int = None):
        """
        初始化缓冲区
        
        Args:
            buffer_size: 缓冲区大小，默认从配置中获取
        """
        self.buffer_size = buffer_size or STREAM_CONFIG.get("buffer_size", 1024)
        self.buffer = ""
        self.processed_content = ""
    
    def add_chunk(self, chunk: str) -> str:
        """
        添加文本块到缓冲区，并返回处理后的文本
        
        Args:
            chunk: 新接收的文本块
            
        Returns:
            处理后可以输出的文本
        """
        # 添加新块到缓冲区
        self.buffer += chunk
        
        # 确保缓冲区不超过最大大小
        if len(self.buffer) > self.buffer_size:
            # 保留后半部分以避免截断标签
            self.buffer = self.buffer[-self.buffer_size:]
        
        return chunk
    
    def get_buffer(self) -> str:
        """
        获取当前缓冲区内容
        
        Returns:
            缓冲区内的全部内容
        """
        return self.buffer
    
    def clear(self):
        """清空缓冲区"""
        self.buffer = ""
        self.processed_content = ""


class TagTracker:
    """标签跟踪器，用于跟踪嵌套标签的开闭状态"""
    
    def __init__(self, output_formats: Dict[str, Dict[str, str]] = None):
        """
        初始化标签跟踪器
        
        Args:
            output_formats: 输出格式配置，默认从配置文件中获取
        """
        self.output_formats = output_formats or PROMPT_CONFIG["output_format"]
        self.open_tags: List[str] = []
        self.complete_contents: List[Dict[str, Any]] = []
        
        # 编译正则表达式来匹配所有可能的开始和结束标签
        self._start_tag_patterns = {}
        self._end_tag_patterns = {}
        
        for format_type, format_info in self.output_formats.items():
            # 处理包含参数的标签（如OPTION的id）
            start_tag = format_info["start_tag"]
            if "{" in start_tag:
                # 创建正则模式来匹配带参数的标签
                # 例如: <OPTION id="xxx"> 转换为 <OPTION id="([^"]+)">
                pattern = re.escape(start_tag).replace('\\{id\\}', '([^"]+)')
                self._start_tag_patterns[format_type] = re.compile(pattern)
            else:
                # 对于没有参数的标签，使用精确匹配
                self._start_tag_patterns[format_type] = re.compile(re.escape(start_tag))
                
            # 结束标签总是精确匹配
            self._end_tag_patterns[format_type] = re.compile(re.escape(format_info["end_tag"]))
    
    def process_chunk(self, chunk: str) -> List[Dict[str, Any]]:
        """
        处理文本块，跟踪标签状态并返回完整的内容段
        
        Args:
            chunk: 文本块
            
        Returns:
            完整的内容段列表，每个元素包含类型和内容
        """
        result = []
        
        for format_type, start_pattern in self._start_tag_patterns.items():
            # 查找开始标签
            for start_match in start_pattern.finditer(chunk):
                # 记录开始标签和位置
                start_pos = start_match.start()
                tag_params = {}
                
                # 如果是带参数的标签，提取参数
                if "{" in self.output_formats[format_type]["start_tag"]:
                    tag_params["id"] = start_match.group(1)
                
                self.open_tags.append({
                    "type": format_type,
                    "start_pos": start_pos,
                    "params": tag_params
                })
        
        # 查找结束标签并匹配开始标签
        for format_type, end_pattern in self._end_tag_patterns.items():
            for end_match in end_pattern.finditer(chunk):
                end_pos = end_match.end()
                
                # 查找对应的开始标签
                for i, tag_info in enumerate(self.open_tags):
                    if tag_info["type"] == format_type:
                        # 找到匹配的标签对
                        full_content = chunk[tag_info["start_pos"]:end_pos]
                        start_tag = self._start_tag_patterns[format_type].search(full_content).group(0)
                        end_tag = end_pattern.search(full_content).group(0)
                        
                        # 提取标签之间的纯文本内容
                        content = full_content[len(start_tag):-len(end_tag)]
                        
                        # 创建完整内容对象
                        complete_content = {
                            "type": format_type,
                            "content": content,
                            **tag_info["params"]
                        }
                        
                        result.append(complete_content)
                        self.complete_contents.append(complete_content)
                        
                        # 从开放标签列表中删除已处理的标签
                        self.open_tags.pop(i)
                        break
        
        return result
    
    def get_complete_contents(self) -> List[Dict[str, Any]]:
        """
        获取所有已完成的内容段
        
        Returns:
            完整的内容段列表
        """
        return self.complete_contents
    
    def clear(self):
        """清空跟踪状态"""
        self.open_tags = []
        self.complete_contents = []


class StreamProcessor:
    """流式内容处理器，用于处理来自AI的流式响应"""
    
    def __init__(self, 
                 callbacks: Dict[str, Callable[[Dict[str, Any]], None]] = None,
                 raw_content_callback: Callable[[str], None] = None):
        """
        初始化流式内容处理器
        
        Args:
            callbacks: 内容处理回调函数字典，键为内容类型，值为回调函数
            raw_content_callback: 原始内容回调函数，用于处理未格式化的文本块
        """
        self.buffer = StreamBuffer()
        self.tag_tracker = TagTracker()
        self.callbacks = callbacks or {}
        self.raw_content_callback = raw_content_callback
        self.all_content: List[Dict[str, Any]] = []
    
    async def process_stream(self, stream: AsyncGenerator[str, None]) -> List[Dict[str, Any]]:
        """
        处理流式内容
        
        Args:
            stream: 文本块的异步生成器
            
        Returns:
            处理后的所有内容段列表
        """
        # 清空之前的状态
        self.buffer.clear()
        self.tag_tracker.clear()
        self.all_content = []
        
        try:
            async for chunk in stream:
                # 添加到缓冲区
                self.buffer.add_chunk(chunk)
                
                # 处理原始文本回调
                if self.raw_content_callback:
                    self.raw_content_callback(chunk)
                
                # 处理标签
                complete_contents = self.tag_tracker.process_chunk(self.buffer.get_buffer())
                
                # 处理完整内容段
                for content in complete_contents:
                    self.all_content.append(content)
                    
                    # 调用特定类型的回调
                    if content["type"] in self.callbacks:
                        self.callbacks[content["type"]](content)
                
                # 允许事件循环执行其他任务
                await asyncio.sleep(0)
                
        except Exception as e:
            # 记录错误但允许继续处理已收到的内容
            print(f"处理流时发生错误: {str(e)}")
        
        return self.all_content
    
    def register_callback(self, content_type: str, callback: Callable[[Dict[str, Any]], None]):
        """
        注册内容类型回调函数
        
        Args:
            content_type: 内容类型
            callback: 回调函数，接收内容字典作为参数
        """
        self.callbacks[content_type] = callback
    
    def set_raw_content_callback(self, callback: Callable[[str], None]):
        """
        设置原始内容回调函数
        
        Args:
            callback: 回调函数，接收原始文本块作为参数
        """
        self.raw_content_callback = callback
    
    def get_all_content(self) -> List[Dict[str, Any]]:
        """
        获取所有处理后的内容
        
        Returns:
            所有内容段列表
        """
        return self.all_content
    
    def get_content_by_type(self, content_type: str) -> List[Dict[str, Any]]:
        """
        按类型获取内容
        
        Args:
            content_type: 内容类型
            
        Returns:
            指定类型的内容列表
        """
        return [content for content in self.all_content if content["type"] == content_type]


# 示例用法
async def example_usage():
    """流式处理器示例用法"""
    from config import PROMPT_CONFIG
    from ai_core import AICore, create_messages
    import os
    
    # 模拟一个流式响应
    async def mock_stream():
        """模拟AI流式响应"""
        chunks = [
            "<NARRATIVE>你走进",
            "了一个古老的洞穴，四周黑暗而潮湿。你的火把照亮",
            "了石壁上奇怪的符文。</NARRATIVE>",
            "<SYSTEM>发现了新位置：符文洞穴</SYSTEM>",
            "<ACTION>你举起火把照亮了更多区域</ACTION>",
            "<OPTION id=\"examine_runes\">仔细检查符文</OPTION>",
            "<OPTION id=\"continue\">继续前进</OPTION>",
            "<OPTION id=\"return\">返回入口</OPTION>"
        ]
        
        for chunk in chunks:
            yield chunk
            await asyncio.sleep(0.1)  # 模拟网络延迟
    
    # 创建处理器并注册回调
    processor = StreamProcessor(
        callbacks={
            "narrative": lambda content: print(f"\n[叙述] {content['content']}"),
            "action": lambda content: print(f"\n[动作] {content['content']}"),
            "option": lambda content: print(f"\n[选项 {content.get('id', '')}] {content['content']}"),
            "system": lambda content: print(f"\n[系统] {content['content']}"),
            "error": lambda content: print(f"\n[错误] {content['content']}")
        },
        raw_content_callback=lambda chunk: print(f"接收: {chunk}", end="", flush=True)
    )
    
    print("开始处理流式内容...")
    await processor.process_stream(mock_stream())
    print("\n\n处理完成!")
    
    # 显示所有选项
    options = processor.get_content_by_type("option")
    print(f"\n检测到 {len(options)} 个选项:")
    for option in options:
        print(f"- [{option['id']}] {option['content']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_usage()) 