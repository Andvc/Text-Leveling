/**
 * 文字机遇 - AI服务连接器
 * 负责与AI服务通信，发送提示词并获取生成的内容
 */

class AIServiceConnector {
  /**
   * 构造函数
   * @param {string} apiKey - API密钥
   * @param {Object} options - 配置选项
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.model = options.model || 'free:QwQ-32B';
    this.endpoint = options.apiEndpoint || 'https://api.suanli.cn/v1/chat/completions';
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 30000; // 30秒超时
    this.maxTokens = options.maxTokens || 2000;
    this.systemMessage = options.systemMessage || 'You are a creative storyteller for an interactive text adventure game. Create engaging, descriptive narrative and interesting choices that follow from the player\'s current situation.';
  }

  /**
   * 生成内容
   * @param {string} prompt - 提示词
   * @param {Object} options - 生成选项
   * @returns {Promise<string>} - 生成的内容
   */
  async generateContent(prompt, options = {}) {
    const temperature = options.temperature || 0.7;
    const retries = options.retries || 0;

    try {
      console.log('向AI服务发送请求...');
      
      const response = await this._fetchWithTimeout(
        this.endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: this.systemMessage
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: temperature,
            max_tokens: this.maxTokens,
            top_p: 1,
            frequency_penalty: 0.2,
            presence_penalty: 0.2
          })
        },
        this.timeout
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} ${response.statusText}, ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('API返回了空的响应');
      }
      
      console.log('成功获取AI生成内容');
      return data.choices[0].message.content.trim();
      
    } catch (error) {
      console.error('AI内容生成失败:', error);
      
      // 如果未达到最大重试次数，则重试
      if (retries < this.maxRetries) {
        console.log(`尝试重试 (${retries + 1}/${this.maxRetries})...`);
        
        // 指数退避策略，等待时间随重试次数增加
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        return this.generateContent(prompt, {
          ...options,
          retries: retries + 1
        });
      }
      
      throw new Error(`AI请求失败，已达到最大重试次数: ${error.message}`);
    }
  }

  /**
   * 流式生成内容
   * @param {string} prompt - 提示词
   * @param {Function} callback - 回调函数，接收部分生成的内容
   * @param {Object} options - 生成选项
   */
  async streamContent(prompt, callback, options = {}) {
    try {
      const temperature = options.temperature || 0.7;
      
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: this.systemMessage
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: temperature,
          max_tokens: this.maxTokens,
          top_p: 1,
          frequency_penalty: 0.2,
          presence_penalty: 0.2,
          stream: true // 启用流式响应
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 解码当前块
        const chunk = decoder.decode(value);
        buffer += chunk;
        
        // 处理数据流中的每个完整消息
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices.length > 0 && data.choices[0].delta && data.choices[0].delta.content) {
                callback(data.choices[0].delta.content);
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('流式内容生成失败:', error);
      throw error;
    }
  }

  /**
   * 带超时的fetch
   * @private
   */
  async _fetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }
}

export default AIServiceConnector; 