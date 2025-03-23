/**
 * 文字机遇 - 事件管理器
 * 负责加载和管理游戏事件
 */
class EventManager {
  constructor() {
    this.events = null;
    this.items = null;
    this.attributes = null;
  }

  /**
   * 初始化事件管理器
   */
  async initialize() {
    try {
      // 加载事件数据
      await this.loadEvents();
      
      // 加载物品数据
      await this.loadItems();
      
      // 加载属性数据
      await this.loadAttributes();
      
      return true;
      
    } catch (error) {
      console.error('事件管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载事件数据
   */
  async loadEvents() {
    try {
      const response = await fetch('/src/data/events/events.json');
      this.events = await response.json();
      console.log('事件数据加载完成:', Object.keys(this.events).length, '个事件');
    } catch (error) {
      console.error('加载事件数据失败:', error);
      this.events = {};
      throw error;
    }
  }

  /**
   * 加载物品数据
   */
  async loadItems() {
    try {
      const response = await fetch('/src/data/items/items.json');
      this.items = await response.json();
      console.log('物品数据加载完成:', Object.keys(this.items).length, '个物品');
    } catch (error) {
      console.error('加载物品数据失败:', error);
      this.items = {};
      throw error;
    }
  }

  /**
   * 加载属性数据
   */
  async loadAttributes() {
    try {
      const response = await fetch('/src/data/attributes/attributes.json');
      this.attributes = await response.json();
      console.log('属性数据加载完成:', Object.keys(this.attributes).length, '个属性');
    } catch (error) {
      console.error('加载属性数据失败:', error);
      this.attributes = {};
      throw error;
    }
  }

  /**
   * 获取事件数据
   * @param {string} eventId - 事件ID
   * @returns {object|null} - 事件数据
   */
  async getEvent(eventId) {
    // 如果事件数据尚未加载，则加载
    if (!this.events) {
      await this.loadEvents();
    }
    
    return this.events[eventId] || null;
  }

  /**
   * 获取物品数据
   * @param {string} itemId - 物品ID
   * @returns {object|null} - 物品数据
   */
  async getItem(itemId) {
    // 如果物品数据尚未加载，则加载
    if (!this.items) {
      await this.loadItems();
    }
    
    return this.items[itemId] || null;
  }

  /**
   * 获取属性数据
   * @param {string} attributeId - 属性ID
   * @returns {object|null} - 属性数据
   */
  async getAttribute(attributeId) {
    // 如果属性数据尚未加载，则加载
    if (!this.attributes) {
      await this.loadAttributes();
    }
    
    return this.attributes[attributeId] || null;
  }

  /**
   * 获取所有事件ID
   * @returns {string[]} - 事件ID数组
   */
  getAllEventIds() {
    return this.events ? Object.keys(this.events) : [];
  }

  /**
   * 获取所有物品ID
   * @returns {string[]} - 物品ID数组
   */
  getAllItemIds() {
    return this.items ? Object.keys(this.items) : [];
  }

  /**
   * 获取所有属性ID
   * @returns {string[]} - 属性ID数组
   */
  getAllAttributeIds() {
    return this.attributes ? Object.keys(this.attributes) : [];
  }
}

export default EventManager; 