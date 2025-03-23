/**
 * 选择面板
 * 负责显示和处理玩家选择
 */
class ChoicePanel {
  /**
   * 构造函数
   * @param {HTMLElement} container - 选择面板容器元素
   * @param {Object} game - 游戏管理器实例
   */
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.choices = [];
    this.choiceButtons = [];
    this.timeoutId = null;
    this.timeLimit = 0;
    this.timeRemaining = 0;
    this.timerElement = null;
    this.onChoiceSelected = null;
    
    // 创建提示元素
    this.promptElement = document.createElement('div');
    this.promptElement.className = 'choice-prompt';
    this.container.appendChild(this.promptElement);
    
    // 创建选择按钮容器
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'choice-buttons';
    this.container.appendChild(this.buttonContainer);
    
    // 创建计时器元素
    this.timerElement = document.createElement('div');
    this.timerElement.className = 'choice-timer';
    this.timerElement.style.display = 'none';
    this.container.appendChild(this.timerElement);
  }

  /**
   * 显示选择选项
   * @param {Array} choices - 选择选项数组
   * @param {string} prompt - 选择提示文本
   * @param {number} timeLimit - 时间限制（毫秒）
   * @param {Function} callback - 选择回调函数
   */
  displayChoices(choices, prompt = '请做出选择:', timeLimit = 0, callback = null) {
    // 清除当前选择
    this.clearChoices();
    
    // 没有选择，隐藏面板
    if (!choices || choices.length === 0) {
      this.hide();
      return;
    }
    
    // 保存选择和回调
    this.choices = choices;
    this.onChoiceSelected = callback;
    
    // 设置提示文本
    this.promptElement.textContent = prompt;
    
    // 创建选择按钮
    choices.forEach((choice, index) => {
      const button = this.createChoiceButton(choice, index);
      this.buttonContainer.appendChild(button);
      this.choiceButtons.push(button);
    });
    
    // 显示面板
    this.show();
    
    // 如果有时间限制，启动计时器
    if (timeLimit > 0) {
      this.startTimer(timeLimit);
    }
  }

  /**
   * 创建选择按钮
   * @param {Object} choice - 选择选项
   * @param {number} index - 选择索引
   * @returns {HTMLElement} 按钮元素
   */
  createChoiceButton(choice, index) {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.textContent = choice.text;
    
    // 如果有条件不满足，添加禁用状态
    if (choice.unavailable) {
      button.classList.add('unavailable');
      button.disabled = true;
      
      // 如果有提供失败原因，添加工具提示
      if (choice.failReason) {
        button.title = choice.failReason;
      }
    } else {
      // 添加点击事件
      button.addEventListener('click', () => this.handleChoice(index));
    }
    
    return button;
  }

  /**
   * 处理选择
   * @param {number} index - 选择索引
   */
  handleChoice(index) {
    // 停止计时器
    this.stopTimer();
    
    // 高亮选中的选项
    this.highlightChoice(index);
    
    // 触发回调
    if (this.onChoiceSelected) {
      this.onChoiceSelected(index);
    }
    
    // 通知游戏管理器
    this.game.makeChoice(index);
    
    // 清除选择
    setTimeout(() => {
      this.clearChoices();
    }, 500);
  }

  /**
   * 高亮选中的选项
   * @param {number} index - 选择索引
   */
  highlightChoice(index) {
    this.choiceButtons.forEach((button, i) => {
      if (i === index) {
        button.classList.add('selected');
      } else {
        button.classList.add('not-selected');
      }
    });
  }

  /**
   * 启动计时器
   * @param {number} timeLimit - 时间限制（毫秒）
   */
  startTimer(timeLimit) {
    this.timeLimit = timeLimit;
    this.timeRemaining = timeLimit;
    
    // 显示计时器
    this.timerElement.style.display = 'block';
    this.updateTimerDisplay();
    
    // 每100毫秒更新一次
    this.timeoutId = setInterval(() => {
      this.timeRemaining -= 100;
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleTimeout();
      } else {
        this.updateTimerDisplay();
      }
    }, 100);
  }

  /**
   * 更新计时器显示
   */
  updateTimerDisplay() {
    const seconds = Math.ceil(this.timeRemaining / 1000);
    this.timerElement.textContent = `剩余时间: ${seconds}秒`;
    
    // 更新进度条样式
    const percentage = (this.timeRemaining / this.timeLimit) * 100;
    this.timerElement.style.background = `linear-gradient(to right, #ff9900 ${percentage}%, #333333 ${percentage}%)`;
  }

  /**
   * 停止计时器
   */
  stopTimer() {
    if (this.timeoutId) {
      clearInterval(this.timeoutId);
      this.timeoutId = null;
    }
    
    this.timerElement.style.display = 'none';
  }

  /**
   * 处理超时
   */
  handleTimeout() {
    this.stopTimer();
    
    // 触发默认选择
    const defaultChoice = this.choices.find(choice => choice.isDefault) || this.choices[0];
    const defaultIndex = this.choices.indexOf(defaultChoice);
    
    if (defaultIndex >= 0) {
      this.handleChoice(defaultIndex);
    } else {
      // 如果没有默认选择，选择第一个
      this.handleChoice(0);
    }
  }

  /**
   * 清除选择
   */
  clearChoices() {
    this.stopTimer();
    this.choices = [];
    
    // 移除所有选择按钮
    while (this.buttonContainer.firstChild) {
      this.buttonContainer.removeChild(this.buttonContainer.firstChild);
    }
    
    this.choiceButtons = [];
    this.promptElement.textContent = '';
  }

  /**
   * 显示面板
   */
  show() {
    this.container.style.display = 'block';
  }

  /**
   * 隐藏面板
   */
  hide() {
    this.container.style.display = 'none';
  }

  /**
   * 禁用选择
   */
  disable() {
    this.choiceButtons.forEach(button => {
      button.disabled = true;
    });
  }

  /**
   * 启用选择
   */
  enable() {
    this.choiceButtons.forEach((button, index) => {
      // 只启用原本可用的选择
      if (!this.choices[index].unavailable) {
        button.disabled = false;
      }
    });
  }
}

export default ChoicePanel; 