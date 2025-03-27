"""
AI接口核心模块：负责调用大模型API和处理响应
"""

import os
import json
import time
import httpx
import asyncio
from typing import Dict, List, Any, Optional, Callable, AsyncGenerator, Union
from config import get_api_config

class AICore:
    """
    AI接口核心类，负责与各种大模型API进行通信
    """
    
    def __init__(self, provider: str = None, api_key: str = None):
        """
        初始化AI接口核心
        
        Args:
            provider: AI服务提供商名称，默认从配置文件读取
            api_key: API密钥，如果不提供则从配置或环境变量读取
        """
        # 获取API配置
        self.config = get_api_config(provider)
        
        # 设置API密钥（优先级：参数 > 环境变量 > 配置文件）
        if api_key:
            self.config["api_key"] = api_key
        elif os.environ.get(f"{self.config['provider'].upper()}_API_KEY"):
            self.config["api_key"] = os.environ.get(f"{self.config['provider'].upper()}_API_KEY")
            
        # 验证API密钥是否存在
        if not self.config["api_key"]:
            raise ValueError(f"未提供{self.config['provider']}的API密钥，请在参数中提供或设置环境变量")
            
        # 初始化HTTP客户端
        self.client = httpx.AsyncClient(
            timeout=self.config["timeout"],
            base_url=self.config["api_base"]
        )
    
    async def __aenter__(self):
        """异步上下文管理器入口"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """异步上下文管理器退出"""
        await self.close()
    
    async def close(self):
        """关闭HTTP客户端连接"""
        await self.client.aclose()
    
    async def generate(
        self, 
        messages: List[Dict[str, str]], 
        stream: bool = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Union[Dict[str, Any], AsyncGenerator[str, None]]:
        """
        生成AI响应
        
        Args:
            messages: 对话消息列表，格式为[{"role": "user", "content": "你好"}]
            stream: 是否使用流式响应，默认使用配置文件设置
            temperature: 温度参数，控制随机性
            max_tokens: 最大生成的token数量
            **kwargs: 其他API特定参数
            
        Returns:
            如果stream为False，返回完整响应字典
            如果stream为True，返回异步生成器，逐步生成内容
        """
        # 使用配置中的stream设置（如果未指定）
        if stream is None:
            stream = self.config.get("stream", False)
            
        # 准备请求数据
        request_data = {
            "model": self.config["model"],
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
            **kwargs
        }
        
        # 准备请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.config['api_key']}"
        }
        
        # 根据不同的AI服务提供商调整请求
        provider = self.config.get("provider", "openai")
        if provider == "anthropic":
            # 调整为Anthropic API格式
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.config['api_key'],
                "anthropic-version": "2023-06-01"
            }
            request_data = {
                "model": self.config["model"],
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream
            }
        elif provider == "deepseek":
            # DeepSeek使用与OpenAI兼容的API格式，只需修改headers
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.config['api_key']}"
            }
            # 保持OpenAI格式的请求数据
            
        # 发送请求
        try:
            # 根据提供商确定API端点
            endpoint = "/chat/completions"
            if provider == "anthropic":
                endpoint = "/messages"
                
            response = await self.client.post(
                endpoint,
                json=request_data,
                headers=headers
            )
            response.raise_for_status()
            
            if stream:
                return self._handle_streaming_response(response, provider)
            else:
                return response.json()
                
        except httpx.HTTPStatusError as e:
            error_detail = f"HTTP错误: {e.response.status_code}"
            try:
                error_body = e.response.json()
                error_detail += f" - {error_body.get('error', {}).get('message', json.dumps(error_body))}"
            except json.JSONDecodeError:
                error_detail += f" - {e.response.text}"
                
            raise Exception(f"API调用失败: {error_detail}")
        except Exception as e:
            raise Exception(f"API调用发生异常: {str(e)}")
    
    async def _handle_streaming_response(self, response, provider):
        """处理流式响应"""
        if provider == "openai" or provider == "deepseek":  # DeepSeek 使用与 OpenAI 兼容的流式格式
            async for line in response.aiter_lines():
                if not line.strip() or line.strip() == "data: [DONE]":
                    continue
                    
                if line.startswith("data: "):
                    json_str = line[6:]  # 去掉 "data: " 前缀
                    try:
                        data = json.loads(json_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue
        elif provider == "anthropic":
            # Anthropic的流式响应处理
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                    
                try:
                    if line.startswith("data: "):
                        json_str = line[6:]  # 去掉 "data: " 前缀
                        data = json.loads(json_str)
                        if data.get("type") == "content_block_delta":
                            delta = data.get("delta", {})
                            text = delta.get("text", "")
                            if text:
                                yield text
                except json.JSONDecodeError:
                    continue
    
    async def generate_with_retry(
        self, 
        messages: List[Dict[str, str]], 
        max_retries: int = None,
        retry_delay: float = 1.0,
        **kwargs
    ) -> Union[Dict[str, Any], AsyncGenerator[str, None]]:
        """
        带重试机制的生成方法
        
        Args:
            messages: 对话消息列表
            max_retries: 最大重试次数，默认使用配置中的设置
            retry_delay: 重试延迟（秒）
            **kwargs: 传递给generate方法的其他参数
            
        Returns:
            与generate方法返回值相同
        """
        if max_retries is None:
            max_retries = self.config.get("max_retries", 3)
            
        retries = 0
        last_error = None
        
        while retries <= max_retries:
            try:
                return await self.generate(messages, **kwargs)
            except Exception as e:
                last_error = e
                retries += 1
                
                if retries > max_retries:
                    break
                    
                # 指数退避策略
                wait_time = retry_delay * (2 ** (retries - 1))
                await asyncio.sleep(wait_time)
        
        raise Exception(f"达到最大重试次数({max_retries})后仍然失败: {str(last_error)}")


# 辅助函数，创建一个简单的消息列表
def create_messages(
    system_prompt: str, 
    user_prompt: str, 
    conversation_history: List[Dict[str, str]] = None
) -> List[Dict[str, str]]:
    """
    创建格式化的消息列表
    
    Args:
        system_prompt: 系统提示词
        user_prompt: 用户提示词
        conversation_history: 对话历史记录
        
    Returns:
        格式化的消息列表
    """
    messages = [{"role": "system", "content": system_prompt}]
    
    if conversation_history:
        messages.extend(conversation_history)
        
    messages.append({"role": "user", "content": user_prompt})
    
    return messages


# 示例用法
async def example_usage():
    """示例用法"""
    from config import PROMPT_CONFIG
    
    # 设置环境变量（实际应用中应通过更安全的方式设置）
    os.environ["OPENAI_API_KEY"] = "你的API密钥"
    
    # 创建AI接口实例
    async with AICore() as ai:
        # 准备提示词
        system_prompt = PROMPT_CONFIG["system_prompt"]
        user_prompt = "我是一位冒险家，刚刚进入一个神秘的洞穴。描述我看到了什么，并给我三个可能的行动选择。"
        
        # 创建消息列表
        messages = create_messages(system_prompt, user_prompt)
        
        # 使用流式响应
        print("开始生成内容...")
        async for chunk in await ai.generate_with_retry(messages, stream=True):
            print(chunk, end="", flush=True)
        print("\n\n生成完成!") 