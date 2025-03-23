/**
 * 文字机遇 - 错误处理系统
 * 负责管理AI生成过程中的错误，提供错误处理和恢复机制
 */

class ErrorHandler {
  /**
   * 构造函数
   */
  constructor() {
    // 错误日志
    this.errorLog = [];
    
    // 错误处理函数映射
    this.errorHandlers = new Map();
    
    // 最大错误日志长度
    this.maxLogLength = 100;
    
    // 注册默认错误处理函数
    this._registerDefaultHandlers();
  }

  /**
   * 注册默认错误处理函数
   * @private
   */
  _registerDefaultHandlers() {
    // API连接错误处理
    this.registerErrorHandler('api_connection_error', (error, context) => {
      console.error('API连接错误:', error);
      return {
        success: false,
        fallbackAction: 'retry',
        maxRetries: 3,
        delay: 1000,
        message: '与AI服务的连接出现问题，尝试重新连接...'
      };
    });
    
    // 超时错误处理
    this.registerErrorHandler('timeout_error', (error, context) => {
      console.error('请求超时:', error);
      return {
        success: false,
        fallbackAction: 'retry',
        maxRetries: 2,
        delay: 2000,
        message: 'AI服务响应超时，正在重试...'
      };
    });
    
    // 内容解析错误处理
    this.registerErrorHandler('content_parsing_error', (error, context) => {
      console.error('内容解析错误:', error);
      return {
        success: false,
        fallbackAction: 'fallback_event',
        message: '无法解析AI生成的内容，使用备用事件...'
      };
    });
    
    // 内容验证错误处理
    this.registerErrorHandler('content_validation_error', (error, context) => {
      console.error('内容验证错误:', error);
      return {
        success: false,
        fallbackAction: 'regenerate',
        maxRetries: 1,
        message: 'AI生成的内容不符合要求，尝试重新生成...'
      };
    });
    
    // API限制错误处理
    this.registerErrorHandler('api_limit_error', (error, context) => {
      console.error('API限制错误:', error);
      return {
        success: false,
        fallbackAction: 'wait_and_retry',
        delay: 5000,
        maxRetries: 1,
        message: 'AI服务达到速率限制，等待后重试...'
      };
    });
    
    // 未知错误处理
    this.registerErrorHandler('unknown_error', (error, context) => {
      console.error('未知错误:', error);
      return {
        success: false,
        fallbackAction: 'fallback_event',
        message: '发生未知错误，使用备用事件...'
      };
    });
  }

  /**
   * 注册错误处理函数
   * @param {string} errorType - 错误类型
   * @param {Function} handler - 处理函数，接收错误对象和上下文，返回处理结果
   */
  registerErrorHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * 处理错误
   * @param {string} errorType - 错误类型
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文
   * @returns {Object} - 错误处理结果
   */
  handleError(errorType, error, context = {}) {
    // 记录错误
    this._logError(errorType, error, context);
    
    // 获取错误处理函数
    const handler = this.errorHandlers.get(errorType) || this.errorHandlers.get('unknown_error');
    
    // 执行错误处理
    const result = handler(error, context);
    
    // 记录处理结果
    if (result) {
      this._logErrorResult(errorType, result);
    }
    
    return result;
  }

  /**
   * 记录错误
   * @private
   * @param {string} errorType - 错误类型
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  _logError(errorType, error, context) {
    // 创建错误日志条目
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message || '无错误消息',
      stack: error.stack,
      context: this._sanitizeContext(context)
    };
    
    // 添加到错误日志
    this.errorLog.unshift(logEntry);
    
    // 如果超过最大长度，删除最旧的记录
    if (this.errorLog.length > this.maxLogLength) {
      this.errorLog.pop();
    }
  }

  /**
   * 记录错误处理结果
   * @private
   * @param {string} errorType - 错误类型
   * @param {Object} result - 处理结果
   */
  _logErrorResult(errorType, result) {
    console.log(`错误处理 [${errorType}]: ${result.message}`);
  }

  /**
   * 清理上下文，移除敏感信息
   * @private
   * @param {Object} context - 错误上下文
   * @returns {Object} - 清理后的上下文
   */
  _sanitizeContext(context) {
    if (!context) return {};
    
    // 创建上下文副本
    const sanitizedContext = {...context};
    
    // 移除敏感信息
    if (sanitizedContext.apiKey) {
      sanitizedContext.apiKey = '***************';
    }
    
    if (sanitizedContext.prompt) {
      sanitizedContext.promptLength = sanitizedContext.prompt.length;
      delete sanitizedContext.prompt;
    }
    
    return sanitizedContext;
  }

  /**
   * 获取错误日志
   * @param {number} limit - 返回的日志条目数量限制
   * @returns {Array} - 错误日志数组
   */
  getErrorLog(limit = 10) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * 清除错误日志
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * 获取错误类型
   * @param {Error} error - 错误对象
   * @returns {string} - 错误类型
   */
  getErrorType(error) {
    if (!error) return 'unknown_error';
    
    // 根据错误属性判断类型
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.message.includes('连接')) {
      return 'api_connection_error';
    }
    
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('超时')) {
      return 'timeout_error';
    }
    
    if (error.message.includes('JSON') || error.message.includes('解析') || error.message.includes('parse')) {
      return 'content_parsing_error';
    }
    
    if (error.message.includes('验证') || error.message.includes('validate') || error.message.includes('schema')) {
      return 'content_validation_error';
    }
    
    if (error.message.includes('rate') || error.message.includes('limit') || error.message.includes('限制')) {
      return 'api_limit_error';
    }
    
    return 'unknown_error';
  }
  
  /**
   * 创建后备事件（在出错时使用）
   * @param {string} previousEventId - 上一个事件ID
   * @param {string} errorMessage - 错误消息
   * @returns {Object} - 后备事件对象
   */
  createFallbackEvent(previousEventId, errorMessage) {
    return {
      event_id: `error_fallback_${Date.now()}`,
      title: "遇到了一些问题",
      description: `${errorMessage || '发生了一些意外的情况'}。你需要决定如何继续。`,
      choices: [
        {
          text: "重试",
          results: [
            {
              type: "next_event",
              event_id: previousEventId || "game_intro"
            }
          ]
        },
        {
          text: "返回安全区域",
          results: [
            {
              type: "next_event",
              event_id: "safe_area"
            }
          ]
        },
        {
          text: "寻求帮助",
          results: [
            {
              type: "next_event",
              event_id: "help_center"
            }
          ]
        }
      ]
    };
  }
  
  /**
   * 检查是否应该重试操作
   * @param {Object} errorResult - 错误处理结果
   * @param {number} currentRetryCount - 当前重试次数
   * @returns {boolean} - 是否应该重试
   */
  shouldRetry(errorResult, currentRetryCount) {
    if (!errorResult) return false;
    
    const retryActions = ['retry', 'wait_and_retry', 'regenerate'];
    
    return retryActions.includes(errorResult.fallbackAction) && 
           currentRetryCount < (errorResult.maxRetries || 0);
  }
  
  /**
   * 获取重试延迟时间
   * @param {Object} errorResult - 错误处理结果
   * @param {number} retryCount - 重试次数
   * @returns {number} - 延迟时间（毫秒）
   */
  getRetryDelay(errorResult, retryCount) {
    if (!errorResult || !errorResult.delay) return 1000;
    
    // 指数退避策略
    return errorResult.delay * Math.pow(1.5, retryCount);
  }
}

export default ErrorHandler; 