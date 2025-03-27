"""
配置文件：管理API密钥和系统设置
"""

# API配置
API_CONFIG = {
    # 默认使用的AI服务提供商
    "default_provider": "openai",
    
    # 支持的AI服务提供商配置
    "providers": {
        "openai": {
            "api_key": "",  # 在实际使用时填入
            "api_base": "https://api.openai.com/v1",
            "model": "gpt-4-turbo",
            "timeout": 60,
            "max_retries": 3,
            "stream": True,
        },
        "anthropic": {
            "api_key": "",  # 在实际使用时填入
            "api_base": "https://api.anthropic.com/v1",
            "model": "claude-3-opus-20240229",
            "timeout": 60,
            "max_retries": 3,
            "stream": True,
        },
        "deepseek": {
            "api_key": "sk-88a02554bfdb43b49a37d036b5dcfd65",  # 默认API密钥
            "api_base": "https://api.deepseek.com",
            "model": "deepseek-chat",  # 默认使用 DeepSeek-V3
            "timeout": 60,
            "max_retries": 3,
            "stream": True,
        },
        # 可扩展添加其他AI服务提供商
    }
}

# 提示词配置
PROMPT_CONFIG = {
    # 输出格式模板
    "output_format": {
        # 各种输出类型的格式模板
        "narrative": {
            "start_tag": "<NARRATIVE>",
            "end_tag": "</NARRATIVE>",
            "description": "用于输出叙述性的游戏内容"
        },
        "action": {
            "start_tag": "<ACTION>",
            "end_tag": "</ACTION>",
            "description": "用于输出可执行的游戏动作"
        },
        "option": {
            "start_tag": "<OPTION id=\"{id}\">",
            "end_tag": "</OPTION>",
            "description": "用于输出玩家可选择的选项，包含ID标识"
        },
        "system": {
            "start_tag": "<SYSTEM>",
            "end_tag": "</SYSTEM>",
            "description": "用于输出系统信息"
        },
        "error": {
            "start_tag": "<ERROR>",
            "end_tag": "</ERROR>",
            "description": "用于输出错误信息"
        }
    },
    
    # 系统提示词
    "system_prompt": """
    你是一个文本冒险游戏的AI引擎。你需要生成格式化的内容，严格遵循以下格式规范：
    
    1. 叙述性内容使用: <NARRATIVE>内容</NARRATIVE>
    2. 动作内容使用: <ACTION>内容</ACTION>
    3. 选项内容使用: <OPTION id="唯一ID">内容</OPTION>
    4. 系统信息使用: <SYSTEM>内容</SYSTEM>
    5. 错误信息使用: <ERROR>内容</ERROR>
    
    所有输出必须使用上述标签之一。不要使用其他格式或自定义标签。
    """
}

# 流处理配置
STREAM_CONFIG = {
    "buffer_size": 1024,
    "chunk_size": 16,
    "decode_format": "utf-8"
}

# 游戏集成配置
GAME_CONFIG = {
    "save_directory": "./saves",
    "log_directory": "./logs",
    "debug_mode": True
}

# 日志配置
LOG_CONFIG = {
    "level": "INFO",  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "game.log",
    "max_size": 1024 * 1024 * 5,  # 5 MB
    "backup_count": 3
}

def get_api_config(provider=None):
    """获取指定提供商的API配置"""
    if provider is None:
        provider = API_CONFIG["default_provider"]
    
    if provider not in API_CONFIG["providers"]:
        raise ValueError(f"不支持的AI服务提供商: {provider}")
    
    return API_CONFIG["providers"][provider]

def get_prompt_format(format_type):
    """获取指定类型的提示词格式"""
    if format_type not in PROMPT_CONFIG["output_format"]:
        raise ValueError(f"不支持的格式类型: {format_type}")
    
    return PROMPT_CONFIG["output_format"][format_type] 