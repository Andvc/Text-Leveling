/**
 * 文字机遇 - 游戏核心
 * 负责协调各个系统的运行
 */
import EventManager from './event_manager.js';
import Player from './player.js';
import SaveSystem from './save_system.js';

class Game {
  constructor(config) {
    this.config = config;
    this.player = null;
    this.eventManager = null;
    this.saveSystem = null;
    this.isInitialized = false;
    this.currentEventId = null;
  }

  /**
   * 初始化游戏
   */
  async initialize() {
    console.log('初始化游戏...');
    
    try {
      // 初始化事件管理器
      this.eventManager = new EventManager();
      await this.eventManager.initialize();
      
      // 初始化存档系统
      this.saveSystem = new SaveSystem();
      
      // 初始化玩家
      this.player = new Player(this.config.defaultAttributes);
      
      this.isInitialized = true;
      console.log('游戏初始化完成');
      
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
      return true;
      
    } catch (error) {
      console.error('加载存档失败:', error);
      this.showErrorMessage(`存档加载失败: ${error.message}`);
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
      return true;
      
    } catch (error) {
      console.error('保存游戏失败:', error);
      this.showErrorMessage(`保存失败: ${error.message}`);
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
      
      // 渲染事件
      this.renderEvent(eventData);
      
      return true;
      
    } catch (error) {
      console.error('启动事件失败:', error);
      this.showErrorMessage(`启动事件失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 处理玩家选择
   * @param {object} choice - 选择对象
   */
  async handleChoice(choice) {
    console.log('玩家选择:', choice);
    
    // 检查选择是否有条件限制
    if (choice.conditions && choice.conditions.length > 0) {
      const canChoose = this.checkConditions(choice.conditions);
      if (!canChoose) {
        this.showMessage('你不满足选择该选项的条件');
        return;
      }
    }
    
    // 应用选择的结果
    if (choice.results && choice.results.length > 0) {
      for (const result of choice.results) {
        await this.applyResult(result);
      }
    }
  }

  /**
   * 检查条件
   * @param {array} conditions - 条件数组
   * @returns {boolean} - 是否满足所有条件
   */
  checkConditions(conditions) {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'attribute':
          const attributeValue = this.player.getAttribute(condition.attribute);
          switch (condition.operator) {
            case '>': return attributeValue > condition.value;
            case '>=': return attributeValue >= condition.value;
            case '<': return attributeValue < condition.value;
            case '<=': return attributeValue <= condition.value;
            case '==': return attributeValue === condition.value;
            default: return false;
          }
        
        case 'has_item':
          return this.player.hasItem(condition.item_id, condition.amount || 1);
        
        case 'flag':
          return this.player.hasFlag(condition.flag);
        
        default:
          console.warn(`未知条件类型: ${condition.type}`);
          return false;
      }
    });
  }

  /**
   * 应用结果
   * @param {object} result - 结果对象
   */
  async applyResult(result) {
    switch (result.type) {
      case 'next_event':
        await this.startEvent(result.event_id);
        break;
      
      case 'attribute_change':
        this.player.changeAttribute(result.attribute, result.value);
        this.updatePlayerDisplay();
        
        if (result.value > 0) {
          this.showMessage(`${result.attribute} 增加了 ${result.value}`);
        } else if (result.value < 0) {
          this.showMessage(`${result.attribute} 减少了 ${Math.abs(result.value)}`);
        }
        break;
      
      case 'item_gain':
        this.player.addItem(result.item_id, result.amount || 1);
        this.updatePlayerDisplay();
        
        const item = await this.eventManager.getItem(result.item_id);
        if (item) {
          this.showMessage(`获得了 ${item.name} x${result.amount || 1}`);
        }
        break;
      
      case 'item_lose':
        const removed = this.player.removeItem(result.item_id, result.amount || 1);
        if (removed) {
          this.updatePlayerDisplay();
          
          const item = await this.eventManager.getItem(result.item_id);
          if (item) {
            this.showMessage(`失去了 ${item.name} x${result.amount || 1}`);
          }
        }
        break;
      
      case 'flag_set':
        this.player.setFlag(result.flag, result.value !== false);
        break;
      
      default:
        console.warn(`未知结果类型: ${result.type}`);
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
    } else {
      // 没有选择选项，隐藏选择容器
      choiceContainer.style.display = 'none';
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
      return;
    }
    
    // 检查物品是否可以使用
    if (item.type !== 'consumable') {
      this.showMessage(`${item.name} 不能被使用`);
      return;
    }
    
    // 从背包中移除物品
    const removed = this.player.removeItem(itemId, 1);
    
    if (!removed) {
      console.error(`无法从背包移除物品 ${itemId}`);
      return;
    }
    
    // 应用物品效果
    if (item.effects && item.effects.length > 0) {
      for (const effect of item.effects) {
        if (effect.type === 'attribute_change') {
          this.player.changeAttribute(effect.attribute, effect.value);
          
          if (effect.value > 0) {
            this.showMessage(`使用了 ${item.name}，${effect.attribute} 增加了 ${effect.value}`);
          } else if (effect.value < 0) {
            this.showMessage(`使用了 ${item.name}，${effect.attribute} 减少了 ${Math.abs(effect.value)}`);
          }
        }
      }
    } else {
      this.showMessage(`使用了 ${item.name}`);
    }
    
    // 更新显示
    this.updatePlayerDisplay();
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   */
  showMessage(message) {
    // 简单实现，未来可改进为弹出提示或消息区域
    console.log('游戏消息:', message);
    alert(message);
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息内容
   */
  showErrorMessage(message) {
    console.error('游戏错误:', message);
    alert(`错误: ${message}`);
  }
}

export default Game; 