/**
 * 文本渲染器
 * 负责在UI中显示事件文本
 */
class TextRenderer {
  /**
   * 构造函数
   * @param {HTMLElement} container - 文本容器元素
   * @param {Object} config - 配置参数
   */
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      textSpeed: config.default_text_speed || 'medium',
      font: config.font || 'default',
      textColor: config.text_color || '#ffffff',
      highlightColor: config.highlight_color || '#ff9900',
      ...config
    };
    
    this.isAnimating = false;
    this.animationTimeout = null;
    this.completeCallback = null;
    
    // 创建标题元素
    this.titleElement = document.createElement('h2');
    this.titleElement.className = 'event-title';
    this.container.appendChild(this.titleElement);
    
    // 创建描述元素
    this.descriptionElement = document.createElement('div');
    this.descriptionElement.className = 'event-description';
    this.container.appendChild(this.descriptionElement);
    
    // 绑定事件
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * 设置文本速度
   * @param {string} speed - 速度设置 ('slow', 'medium', 'fast', 'instant')
   */
  setTextSpeed(speed) {
    this.config.textSpeed = speed;
  }

  /**
   * 显示文本
   * @param {string} title - 事件标题
   * @param {string} description - 事件描述
   * @param {Function} callback - 显示完成后的回调函数
   */
  displayText(title, description, callback = null) {
    // 停止当前动画
    this.stopAnimation();
    
    // 设置标题
    this.titleElement.textContent = title;
    
    // 保存回调
    this.completeCallback = callback;
    
    // 根据速度设置显示文本
    switch (this.config.textSpeed) {
      case 'instant':
        this.descriptionElement.innerHTML = this.formatText(description);
        if (callback) callback();
        break;
        
      case 'fast':
      case 'medium':
      case 'slow':
        this.animateText(description);
        break;
        
      default:
        this.animateText(description);
    }
  }

  /**
   * 动画显示文本
   * @param {string} text - 要显示的文本
   */
  animateText(text) {
    const formattedText = this.formatText(text);
    this.isAnimating = true;
    
    // 清空当前文本
    this.descriptionElement.innerHTML = '';
    
    // 创建临时元素解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    
    // 获取纯文本
    const textContent = tempDiv.textContent;
    
    // 动画显示速度
    let delay;
    switch (this.config.textSpeed) {
      case 'slow': delay = 80; break;
      case 'medium': delay = 50; break;
      case 'fast': delay = 20; break;
      default: delay = 50;
    }
    
    // 逐字显示
    let index = 0;
    const animateNextChar = () => {
      if (index < textContent.length && this.isAnimating) {
        // 更新显示的文本
        this.descriptionElement.innerHTML = this.formatText(text.substring(0, index + 1));
        index++;
        
        // 安排下一个字符
        this.animationTimeout = setTimeout(animateNextChar, delay);
      } else {
        // 完成动画
        this.descriptionElement.innerHTML = formattedText;
        this.isAnimating = false;
        
        if (this.completeCallback) {
          this.completeCallback();
        }
      }
    };
    
    // 开始动画
    animateNextChar();
  }

  /**
   * 格式化文本（处理特殊标记等）
   * @param {string} text - 原始文本
   * @returns {string} 格式化后的文本
   */
  formatText(text) {
    if (!text) return '';
    
    // 替换换行符
    let formatted = text.replace(/\n/g, '<br>');
    
    // 处理强调文本 *强调*
    formatted = formatted.replace(/\*([^*]+)\*/g, `<em style="color:${this.config.highlightColor}">$1</em>`);
    
    // 处理重要文本 **重要**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${this.config.highlightColor}">$1</strong>`);
    
    // 处理属性标记 @属性@
    formatted = formatted.replace(/@([^@]+)@/g, `<span class="attribute-highlight">$1</span>`);
    
    return formatted;
  }

  /**
   * 停止当前动画
   */
  stopAnimation() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    
    this.isAnimating = false;
  }

  /**
   * 处理点击事件
   */
  handleClick() {
    if (this.isAnimating) {
      // 如果正在动画中，点击将直接显示完整文本
      this.stopAnimation();
      if (this.descriptionElement.dataset.fullText) {
        this.descriptionElement.innerHTML = this.formatText(this.descriptionElement.dataset.fullText);
      }
      
      if (this.completeCallback) {
        this.completeCallback();
      }
    }
  }

  /**
   * 清空文本
   */
  clear() {
    this.stopAnimation();
    this.titleElement.textContent = '';
    this.descriptionElement.innerHTML = '';
  }

  /**
   * 应用样式设置
   * @param {Object} styleConfig - 样式配置
   */
  applyStyles(styleConfig) {
    const { textColor, backgroundColor, font, fontSize } = styleConfig;
    
    if (textColor) {
      this.container.style.color = textColor;
    }
    
    if (backgroundColor) {
      this.container.style.backgroundColor = backgroundColor;
    }
    
    if (font) {
      this.container.style.fontFamily = font;
    }
    
    if (fontSize) {
      this.container.style.fontSize = fontSize;
    }
  }
}

export default TextRenderer; 