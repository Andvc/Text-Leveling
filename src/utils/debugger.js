/**
 * 文字机遇 - 调试器
 * 用于实时追踪游戏状态、记录日志并提供调试界面
 */

class GameDebugger {
  constructor() {
    this.enabled = false;
    this.logs = [];
    this.maxLogs = 100;
    this.trackedState = {};
    this.debugPanel = null;
    this.logPanel = null;
    this.statePanel = null;
    this.isVisible = false;
    this.lastStateSnapshot = null;
  }

  /**
   * 初始化调试器
   * @param {boolean} enabled - 是否启用调试器
   */
  initialize(enabled = false) {
    this.enabled = enabled;
    
    if (this.enabled) {
      console.log('调试器已启用');
      this.createDebugPanel();
      this.monkeyPatchConsole();
      
      // 添加快捷键切换调试面板
      document.addEventListener('keydown', (event) => {
        // 按F12键切换调试面板
        if (event.key === 'F12') {
          event.preventDefault();
          this.toggleDebugPanel();
        }
      });
    }
  }
  
  /**
   * 创建调试面板
   */
  createDebugPanel() {
    // 创建调试面板容器
    this.debugPanel = document.createElement('div');
    this.debugPanel.className = 'debug-panel';
    this.debugPanel.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 500px;
      height: 300px;
      background-color: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      border-top-left-radius: 5px;
      box-shadow: -2px -2px 10px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      transition: transform 0.3s ease;
    `;
    
    // 默认隐藏
    this.isVisible = false;
    this.debugPanel.style.transform = 'translateY(100%)';
    
    // 创建标题栏
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
      background-color: #333;
      border-bottom: 1px solid #555;
    `;
    
    const title = document.createElement('div');
    title.textContent = '文字机遇调试器';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
    `;
    closeButton.addEventListener('click', () => this.toggleDebugPanel());
    
    titleBar.appendChild(title);
    titleBar.appendChild(closeButton);
    this.debugPanel.appendChild(titleBar);
    
    // 创建内容区域
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex: 1;
      overflow: hidden;
    `;
    
    // 创建日志面板
    this.logPanel = document.createElement('div');
    this.logPanel.className = 'debug-log-panel';
    this.logPanel.style.cssText = `
      flex: 1;
      padding: 5px;
      overflow-y: auto;
      border-right: 1px solid #555;
    `;
    
    // 创建状态面板
    this.statePanel = document.createElement('div');
    this.statePanel.className = 'debug-state-panel';
    this.statePanel.style.cssText = `
      flex: 1;
      padding: 5px;
      overflow-y: auto;
    `;
    
    content.appendChild(this.logPanel);
    content.appendChild(this.statePanel);
    this.debugPanel.appendChild(content);
    
    // 将调试面板添加到文档
    document.body.appendChild(this.debugPanel);
    
    this.log('调试面板已创建', 'info');
  }
  
  /**
   * 切换调试面板显示/隐藏
   */
  toggleDebugPanel() {
    if (!this.enabled || !this.debugPanel) return;
    
    this.isVisible = !this.isVisible;
    this.debugPanel.style.transform = this.isVisible ? 'translateY(0)' : 'translateY(100%)';
    
    this.log(`调试面板已${this.isVisible ? '显示' : '隐藏'}`, 'info');
  }
  
  /**
   * 记录日志
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别 (info, warn, error)
   */
  log(message, level = 'info') {
    if (!this.enabled) return;
    
    // 限制日志数量
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }
    
    // 记录日志
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      level
    };
    
    this.logs.push(logEntry);
    
    // 如果日志面板已创建，则显示日志
    if (this.logPanel) {
      const logElement = document.createElement('div');
      logElement.className = `log-entry log-${level}`;
      
      // 根据级别设置样式
      let color = '#aaa';
      if (level === 'warn') color = '#ff9';
      if (level === 'error') color = '#f66';
      
      logElement.style.cssText = `
        margin: 2px 0;
        color: ${color};
      `;
      
      logElement.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
      this.logPanel.appendChild(logElement);
      
      // 滚动到底部
      this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }
  }
  
  /**
   * 猴子补丁控制台方法，将控制台日志同时记录到调试器
   */
  monkeyPatchConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog.apply(console, args);
      this.log(args.map(arg => this.stringifyArg(arg)).join(' '), 'info');
    };
    
    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.log(args.map(arg => this.stringifyArg(arg)).join(' '), 'warn');
    };
    
    console.error = (...args) => {
      originalError.apply(console, args);
      this.log(args.map(arg => this.stringifyArg(arg)).join(' '), 'error');
    };
  }
  
  /**
   * 将参数转换为字符串
   * @param {any} arg - 参数
   * @returns {string} - 字符串表示
   */
  stringifyArg(arg) {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    
    return String(arg);
  }
  
  /**
   * 跟踪游戏状态
   * @param {string} key - 状态键
   * @param {any} value - 状态值
   */
  trackState(key, value) {
    if (!this.enabled) return;
    
    this.trackedState[key] = value;
    this.updateStatePanel();
  }
  
  /**
   * 批量更新状态
   * @param {object} stateObject - 状态对象
   */
  updateState(stateObject) {
    if (!this.enabled || !stateObject) return;
    
    for (const key in stateObject) {
      this.trackedState[key] = stateObject[key];
    }
    
    this.updateStatePanel();
  }
  
  /**
   * 更新状态面板显示
   */
  updateStatePanel() {
    if (!this.enabled || !this.statePanel) return;
    
    // 清空状态面板
    this.statePanel.innerHTML = '';
    
    // 添加标题
    const title = document.createElement('div');
    title.textContent = '游戏状态';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    this.statePanel.appendChild(title);
    
    // 显示状态信息
    for (const key in this.trackedState) {
      const value = this.trackedState[key];
      
      const stateElement = document.createElement('div');
      stateElement.className = 'state-entry';
      stateElement.style.cssText = `
        margin: 2px 0;
        display: flex;
      `;
      
      const keyElement = document.createElement('span');
      keyElement.textContent = key + ': ';
      keyElement.style.color = '#9cf';
      keyElement.style.marginRight = '5px';
      
      const valueElement = document.createElement('span');
      
      // 处理不同类型的值
      if (typeof value === 'object' && value !== null) {
        try {
          valueElement.textContent = JSON.stringify(value, null, 2);
        } catch (e) {
          valueElement.textContent = '[Object]';
        }
      } else {
        valueElement.textContent = String(value);
      }
      
      stateElement.appendChild(keyElement);
      stateElement.appendChild(valueElement);
      this.statePanel.appendChild(stateElement);
    }
  }
  
  /**
   * 截取当前状态快照
   * @returns {object} - 状态快照
   */
  takeStateSnapshot() {
    return JSON.parse(JSON.stringify(this.trackedState));
  }
  
  /**
   * 监测状态变化
   * @returns {object} - 状态变化
   */
  detectStateChanges() {
    const currentSnapshot = this.takeStateSnapshot();
    const changes = {};
    
    if (this.lastStateSnapshot) {
      for (const key in currentSnapshot) {
        if (JSON.stringify(currentSnapshot[key]) !== JSON.stringify(this.lastStateSnapshot[key])) {
          changes[key] = {
            from: this.lastStateSnapshot[key],
            to: currentSnapshot[key]
          };
        }
      }
    }
    
    this.lastStateSnapshot = currentSnapshot;
    return changes;
  }
}

// 创建全局调试器实例
const gameDebugger = new GameDebugger();

export default gameDebugger; 