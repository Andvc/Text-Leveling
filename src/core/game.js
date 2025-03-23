/**
 * 文字机遇 - 游戏核心
 * 负责协调各个系统的运行
 */
import EventManager from './event_manager.js';
import Player from './player.js';
import SaveSystem from './save_system.js';
import gameDebugger from '../utils/debugger.js';

class Game {
  constructor(config) {
    this.config = config;
    this.player = null;
    this.eventManager = null;
    this.saveSystem = null;
    this.isInitialized = false;
    this.currentEventId = null;
    this.debugMode = config.debugMode || false;
  }

  /**
   * 初始化游戏
   */
  async initialize() {
    console.log('初始化游戏...');
    
    try {
      // 初始化调试器
      gameDebugger.initialize(this.debugMode);
      
      // 初始化事件管理器
      this.eventManager = new EventManager();
      await this.eventManager.initialize();
      
      // 初始化存档系统
      this.saveSystem = new SaveSystem();
      
      // 初始化玩家
      this.player = new Player(this.config.defaultAttributes);
      
      this.isInitialized = true;
      console.log('游戏初始化完成');
      
      // 追踪游戏状态
      if (this.debugMode) {
        this.trackGameState();
      }
      
    } catch (error) {
      console.error('游戏初始化失败:', error);
      throw error;
    }
  }

  /**
   * 开始新游戏
   */
  async startNewGame() {
    if (!this.isInitialized) {
      throw new Error('游戏尚未初始化');
    }
    
    console.log('开始新游戏...');
    
    // 重置玩家状态
    this.player.reset();
    
    // 添加初始物品
    if (this.config.startingItems && this.config.startingItems.length > 0) {
      for (const itemId of this.config.startingItems) {
        this.player.addItem(itemId);
      }
    }
    
    // 开始第一个事件
    await this.startEvent(this.config.startEvent);
    
    console.log('新游戏开始完成');
    gameDebugger.log('新游戏开始完成', 'info');
  }

  /**
   * 加载游戏存档
   * @param {number} saveSlot - 存档槽位
   */
  async loadGame(saveSlot) {
    if (!this.isInitialized) {
      throw new Error('游戏尚未初始化');
    }
    
    console.log(`加载存档 #${saveSlot}...`);
    
    try {
      // 从存档系统加载游戏数据
      const gameData = await this.saveSystem.loadGame(saveSlot);
      
      if (!gameData) {
        throw new Error(`存档 #${saveSlot} 不存在`);
      }
      
      // 恢复玩家状态
      this.player.loadFromData(gameData.player);
      
      // 恢复当前事件
      await this.startEvent(gameData.currentEventId);
      
      console.log('存档加载完成');
      
      // 更新调试状态
      if (this.debugMode) {
        this.trackGameState();
        gameDebugger.log(`从槽位 #${saveSlot} 加载游戏完成`, 'info');
      }
      
      return true;
      
    } catch (error) {
      console.error('加载存档失败:', error);
      this.showErrorMessage(`存档加载失败: ${error.message}`);
      gameDebugger.log(`加载存档 #${saveSlot} 失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 保存游戏
   * @param {number} saveSlot - 存档槽位
   */
  async saveGame(saveSlot) {
    if (!this.isInitialized || !this.currentEventId) {
      throw new Error('游戏尚未开始，无法保存');
    }
    
    console.log(`保存游戏到存档 #${saveSlot}...`);
    
    try {
      // 准备保存数据
      const gameData = {
        player: this.player.saveToData(),
        currentEventId: this.currentEventId,
        timestamp: Date.now()
      };
      
      // 保存到存档系统
      await this.saveSystem.saveGame(saveSlot, gameData);
      
      console.log('游戏保存完成');
      this.showMessage('游戏已保存');
      
      // 调试日志
      if (this.debugMode) {
        gameDebugger.log(`保存游戏到槽位 #${saveSlot} 完成`, 'info');
        gameDebugger.trackState('lastSaveTime', new Date().toLocaleString());
      }
      
      return true;
      
    } catch (error) {
      console.error('保存游戏失败:', error);
      this.showErrorMessage(`保存失败: ${error.message}`);
      
      if (this.debugMode) {
        gameDebugger.log(`保存游戏到槽位 #${saveSlot} 失败: ${error.message}`, 'error');
      }
      
      return false;
    }
  }

  /**
   * 开始特定事件
   * @param {string} eventId - 事件ID
   */
  async startEvent(eventId) {
    console.log(`开始事件: ${eventId}`);
    
    try {
      // 获取事件数据
      const eventData = await this.eventManager.getEvent(eventId);
      
      if (!eventData) {
        throw new Error(`事件 ${eventId} 不存在`);
      }
      
      // 更新当前事件ID
      this.currentEventId = eventId;
      
      // 调试日志
      if (this.debugMode) {
        gameDebugger.log(`开始事件: ${eventId}`, 'info');
        gameDebugger.trackState('currentEvent', {
          id: eventId,
          title: eventData.title,
          choices: eventData.choices ? eventData.choices.length : 0
        });
      }
      
      // 渲染事件
      this.renderEvent(eventData);
      
      return true;
      
    } catch (error) {
      console.error('启动事件失败:', error);
      this.showErrorMessage(`启动事件失败: ${error.message}`);
      
      if (this.debugMode) {
        gameDebugger.log(`启动事件 ${eventId} 失败: ${error.message}`, 'error');
      }
      
      return false;
    }
  }

  /**
   * 处理玩家选择
   * @param {object} choice - 选择对象
   */
  async handleChoice(choice) {
    console.log('玩家选择:', choice);
    
    if (this.debugMode) {
      gameDebugger.log(`玩家选择: ${choice.text}`, 'info');
      gameDebugger.trackState('lastChoice', {
        text: choice.text,
        results: choice.results ? choice.results.length : 0
      });
    }
    
    // 检查选择是否有条件限制
    if (choice.conditions && choice.conditions.length > 0) {
      const canChoose = this.checkConditions(choice.conditions);
      if (!canChoose) {
        this.showMessage('你不满足选择该选项的条件');
        
        if (this.debugMode) {
          gameDebugger.log(`选择 "${choice.text}" 失败: 不满足条件`, 'warn');
        }
        
        return;
      }
    }
    
    // 应用选择的结果
    if (choice.results && choice.results.length > 0) {
      for (const result of choice.results) {
        await this.applyResult(result);
      }
    }
    
    // 更新调试状态
    if (this.debugMode) {
      this.trackGameState();
    }
  }

  /**
   * 检查条件
   * @param {array} conditions - 条件数组
   * @returns {boolean} - 是否满足所有条件
   */
  checkConditions(conditions) {
    const results = conditions.map(condition => {
      let result = false;
      
      switch (condition.type) {
        case 'attribute':
          const attributeValue = this.player.getAttribute(condition.attribute);
          switch (condition.operator) {
            case '>': result = attributeValue > condition.value; break;
            case '>=': result = attributeValue >= condition.value; break;
            case '<': result = attributeValue < condition.value; break;
            case '<=': result = attributeValue <= condition.value; break;
            case '==': result = attributeValue === condition.value; break;
            default: result = false;
          }
          
          if (this.debugMode) {
            gameDebugger.log(`条件检查 - 属性 ${condition.attribute} ${condition.operator} ${condition.value}: ${result ? '通过' : '失败'} (当前值: ${attributeValue})`, result ? 'info' : 'warn');
          }
          break;
        
        case 'has_item':
          result = this.player.hasItem(condition.item_id, condition.amount || 1);
          
          if (this.debugMode) {
            gameDebugger.log(`条件检查 - 物品 ${condition.item_id} x${condition.amount || 1}: ${result ? '通过' : '失败'}`, result ? 'info' : 'warn');
          }
          break;
        
        case 'flag':
          result = this.player.hasFlag(condition.flag);
          
          if (this.debugMode) {
            gameDebugger.log(`条件检查 - 标志 ${condition.flag}: ${result ? '通过' : '失败'}`, result ? 'info' : 'warn');
          }
          break;
        
        default:
          console.warn(`未知条件类型: ${condition.type}`);
          
          if (this.debugMode) {
            gameDebugger.log(`条件检查 - 未知条件类型: ${condition.type}`, 'error');
          }
          
          result = false;
      }
      
      return result;
    });
    
    return results.every(r => r === true);
  }

  /**
   * 应用结果
   * @param {object} result - 结果对象
   */
  async applyResult(result) {
    if (this.debugMode) {
      gameDebugger.log(`应用结果: ${result.type}`, 'info');
    }
    
    switch (result.type) {
      case 'next_event':
        await this.startEvent(result.event_id);
        break;
      
      case 'attribute_change':
        const oldValue = this.player.getAttribute(result.attribute);
        this.player.changeAttribute(result.attribute, result.value);
        const newValue = this.player.getAttribute(result.attribute);
        this.updatePlayerDisplay();
        
        if (result.value > 0) {
          this.showMessage(`${result.attribute} 增加了 ${result.value}`);
        } else if (result.value < 0) {
          this.showMessage(`${result.attribute} 减少了 ${Math.abs(result.value)}`);
        }
        
        if (this.debugMode) {
          gameDebugger.log(`属性变化: ${result.attribute} ${oldValue} -> ${newValue} (${result.value > 0 ? '+' : ''}${result.value})`, 'info');
        }
        break;
      
      case 'item_gain':
        this.player.addItem(result.item_id, result.amount || 1);
        this.updatePlayerDisplay();
        
        const item = await this.eventManager.getItem(result.item_id);
        if (item) {
          this.showMessage(`获得了 ${item.name} x${result.amount || 1}`);
          
          if (this.debugMode) {
            gameDebugger.log(`获得物品: ${item.name} (${result.item_id}) x${result.amount || 1}`, 'info');
          }
        }
        break;
      
      case 'item_lose':
        const lostItem = await this.eventManager.getItem(result.item_id);
        const removed = this.player.removeItem(result.item_id, result.amount || 1);
        
        if (removed) {
          this.updatePlayerDisplay();
          
          if (lostItem) {
            this.showMessage(`失去了 ${lostItem.name} x${result.amount || 1}`);
            
            if (this.debugMode) {
              gameDebugger.log(`失去物品: ${lostItem.name} (${result.item_id}) x${result.amount || 1}`, 'info');
            }
          }
        } else if (this.debugMode) {
          gameDebugger.log(`尝试移除不存在的物品: ${result.item_id} x${result.amount || 1}`, 'warn');
        }
        break;
      
      case 'flag_set':
        const oldFlag = this.player.hasFlag(result.flag);
        this.player.setFlag(result.flag, result.value !== false);
        
        if (this.debugMode) {
          gameDebugger.log(`标志设置: ${result.flag} ${oldFlag} -> ${result.value !== false}`, 'info');
        }
        break;
      
      default:
        console.warn(`未知结果类型: ${result.type}`);
        
        if (this.debugMode) {
          gameDebugger.log(`未知结果类型: ${result.type}`, 'error');
        }
    }
    
    // 更新调试状态
    if (this.debugMode) {
      this.trackGameState();
    }
  }

  /**
   * 渲染事件到界面
   * @param {object} eventData - 事件数据
   */
  renderEvent(eventData) {
    console.log('渲染事件:', eventData);
    
    // 获取DOM元素
    const titleElement = document.querySelector('#text-content .event-title');
    const descriptionElement = document.querySelector('#text-content .event-description');
    const choiceContainer = document.querySelector('#choice-container');
    const choicePrompt = document.querySelector('#choice-container .choice-prompt');
    const choiceButtons = document.querySelector('#choice-container .choice-buttons');
    
    // 设置事件标题和描述
    titleElement.textContent = eventData.title || '未命名事件';
    descriptionElement.textContent = eventData.description || '';
    
    // 清空选择按钮
    choiceButtons.innerHTML = '';
    
    // 如果有选择选项，显示选择容器
    if (eventData.choices && eventData.choices.length > 0) {
      choiceContainer.style.display = 'block';
      choicePrompt.textContent = '你的选择:';
      
      // 为每个选择创建按钮
      eventData.choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = choice.text;
        
        // 检查是否满足条件
        let canChoose = true;
        if (choice.conditions && choice.conditions.length > 0) {
          canChoose = this.checkConditions(choice.conditions);
        }
        
        // 如果不满足条件，禁用按钮
        if (!canChoose) {
          button.classList.add('unavailable');
          button.title = '不满足选择条件';
          button.disabled = true;
        } else {
          // 添加点击事件
          button.addEventListener('click', () => this.handleChoice(choice));
        }
        
        choiceButtons.appendChild(button);
      });
      
      if (this.debugMode) {
        gameDebugger.log(`渲染了 ${eventData.choices.length} 个选择按钮`, 'info');
      }
    } else {
      // 没有选择选项，隐藏选择容器
      choiceContainer.style.display = 'none';
      
      if (this.debugMode) {
        gameDebugger.log('当前事件没有选择选项', 'warn');
      }
    }
    
    // 更新玩家状态显示
    this.updatePlayerDisplay();
  }

  /**
   * 更新玩家状态显示
   */
  updatePlayerDisplay() {
    // 更新属性显示
    const attributes = document.querySelectorAll('#player-status .attribute');
    attributes.forEach(attributeElement => {
      const nameElement = attributeElement.querySelector('.attribute-name');
      const valueElement = attributeElement.querySelector('.attribute-value');
      
      if (nameElement && valueElement) {
        const attributeName = nameElement.textContent.replace(':', '');
        const attributeValue = this.player.getAttribute(attributeName.toLowerCase());
        
        if (attributeValue !== undefined) {
          valueElement.textContent = attributeValue;
        }
      }
    });
    
    // 更新背包显示
    const inventoryPanel = document.querySelector('#inventory-panel');
    const itemsContainer = document.createElement('div');
    
    // 添加标题
    const titleElement = document.createElement('div');
    titleElement.className = 'status-title';
    titleElement.textContent = '背包';
    itemsContainer.appendChild(titleElement);
    
    // 如果背包为空，显示提示
    if (this.player.inventory.length === 0) {
      const emptyElement = document.createElement('div');
      emptyElement.textContent = '背包是空的';
      emptyElement.style.padding = '5px';
      emptyElement.style.fontStyle = 'italic';
      emptyElement.style.color = '#888';
      itemsContainer.appendChild(emptyElement);
    } else {
      // 显示物品列表
      this.player.inventory.forEach(async inventoryItem => {
        const item = await this.eventManager.getItem(inventoryItem.id);
        
        if (item) {
          const itemElement = document.createElement('div');
          itemElement.className = 'inventory-item';
          itemElement.textContent = `${item.name} x${inventoryItem.amount}`;
          itemElement.title = item.description || '';
          
          // 添加使用物品的功能
          if (item.type === 'consumable' && item.effects && item.effects.length > 0) {
            itemElement.style.cursor = 'pointer';
            itemElement.addEventListener('click', () => this.useItem(inventoryItem.id));
          }
          
          itemsContainer.appendChild(itemElement);
        }
      });
    }
    
    // 替换背包内容
    inventoryPanel.innerHTML = '';
    inventoryPanel.appendChild(itemsContainer);
    
    // 更新调试状态
    if (this.debugMode) {
      this.trackGameState();
    }
  }

  /**
   * 使用物品
   * @param {string} itemId - 物品ID
   */
  async useItem(itemId) {
    console.log(`使用物品: ${itemId}`);
    
    // 获取物品数据
    const item = await this.eventManager.getItem(itemId);
    
    if (!item) {
      console.error(`物品 ${itemId} 不存在`);
      
      if (this.debugMode) {
        gameDebugger.log(`尝试使用不存在的物品: ${itemId}`, 'error');
      }
      
      return;
    }
    
    // 检查物品是否可以使用
    if (item.type !== 'consumable') {
      this.showMessage(`${item.name} 不能被使用`);
      
      if (this.debugMode) {
        gameDebugger.log(`尝试使用不可消耗的物品: ${item.name} (${itemId})`, 'warn');
      }
      
      return;
    }
    
    // 从背包中移除物品
    const removed = this.player.removeItem(itemId, 1);
    
    if (!removed) {
      console.error(`无法从背包移除物品 ${itemId}`);
      
      if (this.debugMode) {
        gameDebugger.log(`无法从背包移除物品: ${itemId}`, 'error');
      }
      
      return;
    }
    
    // 应用物品效果
    if (item.effects && item.effects.length > 0) {
      for (const effect of item.effects) {
        if (effect.type === 'attribute_change') {
          const oldValue = this.player.getAttribute(effect.attribute);
          this.player.changeAttribute(effect.attribute, effect.value);
          const newValue = this.player.getAttribute(effect.attribute);
          
          if (effect.value > 0) {
            this.showMessage(`使用了 ${item.name}，${effect.attribute} 增加了 ${effect.value}`);
          } else if (effect.value < 0) {
            this.showMessage(`使用了 ${item.name}，${effect.attribute} 减少了 ${Math.abs(effect.value)}`);
          }
          
          if (this.debugMode) {
            gameDebugger.log(`使用物品 ${item.name} (${itemId}) 效果: ${effect.attribute} ${oldValue} -> ${newValue} (${effect.value > 0 ? '+' : ''}${effect.value})`, 'info');
          }
        }
      }
    } else {
      this.showMessage(`使用了 ${item.name}`);
      
      if (this.debugMode) {
        gameDebugger.log(`使用物品 ${item.name} (${itemId}), 无效果`, 'info');
      }
    }
    
    // 更新显示
    this.updatePlayerDisplay();
  }

  /**
   * 追踪游戏状态
   */
  trackGameState() {
    if (!this.debugMode) return;
    
    // 准备玩家状态数据
    const playerState = {
      attributes: this.player ? {...this.player.attributes} : {},
      inventory: this.player ? this.player.inventory.length : 0,
      flags: this.player ? Object.keys(this.player.flags).filter(key => this.player.flags[key]) : []
    };
    
    // 准备游戏状态数据
    const gameState = {
      currentEventId: this.currentEventId,
      isInitialized: this.isInitialized,
      startEvent: this.config.startEvent
    };
    
    // 更新到调试器
    gameDebugger.updateState({
      player: playerState,
      game: gameState,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // 检测变化
    const changes = gameDebugger.detectStateChanges();
    if (Object.keys(changes).length > 0) {
      console.log('游戏状态变化:', changes);
    }
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   */
  showMessage(message) {
    // 简单实现，未来可改进为弹出提示或消息区域
    console.log('游戏消息:', message);
    
    // 显示消息
    if (this.debugMode) {
      gameDebugger.log(`游戏消息: ${message}`, 'info');
    }
    
    alert(message);
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息内容
   */
  showErrorMessage(message) {
    console.error('游戏错误:', message);
    
    if (this.debugMode) {
      gameDebugger.log(`游戏错误: ${message}`, 'error');
    }
    
    alert(`错误: ${message}`);
  }
}

export default Game; 