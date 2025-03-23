/**
 * 物品条件检查器
 * 检查玩家是否拥有特定物品
 */
class ItemCondition {
  /**
   * 构造函数
   * @param {Object} params - 条件参数
   */
  constructor(params) {
    this.itemId = params.item_id;
    this.amount = params.amount || 1;
    this.description = this.generateDescription();
  }

  /**
   * 检查条件是否满足
   * @param {Object} player - 玩家对象
   * @returns {boolean} 是否满足条件
   */
  check(player) {
    return player.hasItem(this.itemId, this.amount);
  }

  /**
   * 获取条件信息
   * @param {Object} player - 玩家对象
   * @returns {Object} 条件信息，包括是否满足
   */
  getInfo(player) {
    const currentAmount = player.getItemAmount(this.itemId);
    const satisfied = this.check(player);
    const itemData = this.getItemData(player);
    
    return {
      type: 'item',
      itemId: this.itemId,
      itemName: itemData ? itemData.name : this.itemId,
      currentAmount: currentAmount,
      requiredAmount: this.amount,
      description: this.description,
      satisfied: satisfied,
      failReason: satisfied ? null : this.getFailReason(currentAmount, itemData)
    };
  }

  /**
   * 生成条件描述
   * @returns {string} 条件描述
   */
  generateDescription() {
    return `需要${this.amount}个${this.itemId}`;
  }

  /**
   * 获取失败原因
   * @param {number} currentAmount - 当前物品数量
   * @param {Object} itemData - 物品数据
   * @returns {string} 失败原因
   */
  getFailReason(currentAmount, itemData) {
    const itemName = itemData ? itemData.name : this.itemId;
    
    if (currentAmount === 0) {
      return `没有${itemName}`;
    } else {
      return `${itemName}数量不足 (当前: ${currentAmount}, 需要: ${this.amount})`;
    }
  }

  /**
   * 获取物品数据
   * @param {Object} player - 玩家对象
   * @returns {Object|null} 物品数据
   */
  getItemData(player) {
    // 这里简化处理，实际应该从游戏的物品管理器获取
    // 假设player有一个getItemDetails方法
    if (player.getItemDetails) {
      return player.getItemDetails(this.itemId);
    }
    
    return null;
  }

  /**
   * 静态工厂方法，从条件对象创建条件实例
   * @param {Object} condition - 条件对象
   * @returns {ItemCondition} 条件实例
   */
  static fromCondition(condition) {
    if (condition.type !== 'item') {
      throw new Error(`无效的条件类型: ${condition.type}`);
    }
    
    return new ItemCondition({
      item_id: condition.item_id,
      amount: condition.amount
    });
  }
}

export default ItemCondition; 