/**
 * 文字机遇 - 玩家类
 * 管理玩家的属性、状态和背包
 */
class Player {
  /**
   * 创建玩家实例
   * @param {object} defaultAttributes - 默认属性值
   */
  constructor(defaultAttributes = {}) {
    this.attributes = { ...defaultAttributes };
    this.inventory = [];
    this.flags = {};
  }

  /**
   * 重置玩家状态
   * @param {object} defaultAttributes - 默认属性值（可选）
   */
  reset(defaultAttributes) {
    this.attributes = { ...(defaultAttributes || this.attributes) };
    this.inventory = [];
    this.flags = {};
  }

  /**
   * 获取属性值
   * @param {string} attributeName - 属性名称
   * @returns {number|undefined} - 属性值
   */
  getAttribute(attributeName) {
    return this.attributes[attributeName.toLowerCase()];
  }

  /**
   * 设置属性值
   * @param {string} attributeName - 属性名称
   * @param {number} value - 属性值
   */
  setAttribute(attributeName, value) {
    this.attributes[attributeName.toLowerCase()] = value;
  }

  /**
   * 改变属性值
   * @param {string} attributeName - 属性名称
   * @param {number} amount - 改变量
   */
  changeAttribute(attributeName, amount) {
    const attrName = attributeName.toLowerCase();
    if (this.attributes[attrName] === undefined) {
      this.attributes[attrName] = 0;
    }
    this.attributes[attrName] += amount;
  }

  /**
   * 添加物品到背包
   * @param {string} itemId - 物品ID
   * @param {number} amount - 数量
   */
  addItem(itemId, amount = 1) {
    // 检查物品是否已在背包中
    const existingItem = this.inventory.find(item => item.id === itemId);
    
    if (existingItem) {
      existingItem.amount += amount;
    } else {
      this.inventory.push({ id: itemId, amount });
    }
  }

  /**
   * 从背包移除物品
   * @param {string} itemId - 物品ID
   * @param {number} amount - 数量
   * @returns {boolean} - 是否成功移除
   */
  removeItem(itemId, amount = 1) {
    const itemIndex = this.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return false;
    }
    
    const item = this.inventory[itemIndex];
    
    if (item.amount < amount) {
      return false;
    }
    
    item.amount -= amount;
    
    // 如果物品数量为0，从背包中移除
    if (item.amount <= 0) {
      this.inventory.splice(itemIndex, 1);
    }
    
    return true;
  }

  /**
   * 检查是否拥有物品
   * @param {string} itemId - 物品ID
   * @param {number} amount - 数量
   * @returns {boolean} - 是否拥有足够数量的物品
   */
  hasItem(itemId, amount = 1) {
    const item = this.inventory.find(item => item.id === itemId);
    return item && item.amount >= amount;
  }

  /**
   * 设置标志
   * @param {string} flag - 标志名称
   * @param {boolean} value - 标志值
   */
  setFlag(flag, value = true) {
    this.flags[flag] = value;
  }

  /**
   * 检查标志
   * @param {string} flag - 标志名称
   * @returns {boolean} - 标志值
   */
  hasFlag(flag) {
    return this.flags[flag] === true;
  }

  /**
   * 保存玩家数据
   * @returns {object} - 玩家数据对象
   */
  saveToData() {
    return {
      attributes: { ...this.attributes },
      inventory: [...this.inventory],
      flags: { ...this.flags }
    };
  }

  /**
   * 从数据中加载玩家状态
   * @param {object} data - 玩家数据对象
   */
  loadFromData(data) {
    if (data.attributes) {
      this.attributes = { ...data.attributes };
    }
    
    if (data.inventory) {
      this.inventory = [...data.inventory];
    }
    
    if (data.flags) {
      this.flags = { ...data.flags };
    }
  }
}

export default Player; 