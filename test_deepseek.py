"""
测试DeepSeek API集成
"""

import asyncio
import os
from ai_core import AICore, create_messages
from config import PROMPT_CONFIG

async def test_deepseek_api():
    """测试DeepSeek API调用"""
    print("测试DeepSeek API集成...")
    
    # 创建AI核心实例，使用DeepSeek提供商
    async with AICore(provider="deepseek") as ai:
        # 准备提示词
        system_prompt = PROMPT_CONFIG["system_prompt"]
        user_prompt = "我是一位冒险家，刚刚进入一个神秘的洞穴。描述我看到了什么，并给我三个可能的行动选择。"
        
        # 创建消息列表
        messages = create_messages(system_prompt, user_prompt)
        
        # 使用流式响应
        print("\n开始生成内容...\n")
        try:
            async for chunk in await ai.generate_with_retry(messages, stream=True):
                print(chunk, end="", flush=True)
            print("\n\n生成完成!")
        except Exception as e:
            print(f"\n错误: {str(e)}")
            raise
            
    print("\nDeepSeek API测试完成！")

if __name__ == "__main__":
    asyncio.run(test_deepseek_api()) 