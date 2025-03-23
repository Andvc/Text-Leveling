/**
 * 标志条件检查器
 * 检查游戏标志是否满足条件
 */
class FlagCondition {
  /**
   * 构造函数
   * @param {Object} params - 条件参数
   */
  constructor(params) {
    this.flag = params.flag;
    this.value = params.value;
    this.operator = params.operator || '==';
    this.description = this.generateDescription();
  }

  /**
   * 检查条件是否满足
   * @param {Object} player - 玩家对象
   * @returns {boolean} 是否满足条件
   */
  check(player) {
    const flagValue = player.getFlag(this.flag);
    
    switch (this.operator) {
      case '==': 
        return flagValue === this.value;
      case '!=': 
        return flagValue !== this.value;
      case '>': 
        return flagValue > this.value;
      case '>=': 
        return flagValue >= this.value;
      case '<': 
        return flagValue < this.value;
      case '<=': 
        return flagValue <= this.value;
      case 'exists':
        return flagValue !== undefined && flagValue !== null;
      case 'not_exists':
        return flagValue === undefined || flagValue === null;
      default:
        console.warn(`未知操作符: ${this.operator}`);
        return false;
    }
  }

  /**
   * 获取条件信息
   * @param {Object} player - 玩家对象
   * @returns {Object} 条件信息，包括是否满足
   */
  getInfo(player) {
    const flagValue = player.getFlag(this.flag);
    const satisfied = this.check(player);
    
    return {
      type: 'flag',
      flag: this.flag,
      currentValue: flagValue,
      requiredValue: this.value,
      operator: this.operator,
      description: this.description,
      satisfied: satisfied,
      failReason: satisfied ? null : this.getFailReason(flagValue)
    };
  }

  /**
   * 生成条件描述
   * @returns {string} 条件描述
   */
  generateDescription() {
    let operatorText;
    
    switch (this.operator) {
      case '==': operatorText = '为'; break;
      case '!=': operatorText = '不为'; break;
      case '>': operatorText = '大于'; break;
      case '>=': operatorText = '大于等于'; break;
      case '<': operatorText = '小于'; break;
      case '<=': operatorText = '小于等于'; break;
      case 'exists': return `已设置标志 ${this.flag}`;
      case 'not_exists': return `未设置标志 ${this.flag}`;
      default: operatorText = this.operator;
    }
    
    return `标志 ${this.flag} ${operatorText} ${this.value}`;
  }

  /**
   * 获取失败原因
   * @param {*} currentValue - 当前标志值
   * @returns {string} 失败原因
   */
  getFailReason(currentValue) {
    switch (this.operator) {
      case '==':
        return `标志 ${this.flag} 不等于 ${this.value} (当前: ${currentValue})`;
      case '!=':
        return `标志 ${this.flag} 等于 ${this.value}`;
      case '>':
        return `标志 ${this.flag} 不大于 ${this.value} (当前: ${currentValue})`;
      case '>=':
        return `标志 ${this.flag} 小于 ${this.value} (当前: ${currentValue})`;
      case '<':
        return `标志 ${this.flag} 不小于 ${this.value} (当前: ${currentValue})`;
      case '<=':
        return `标志 ${this.flag} 大于 ${this.value} (当前: ${currentValue})`;
      case 'exists':
        return `标志 ${this.flag} 未设置`;
      case 'not_exists':
        return `标志 ${this.flag} 已设置`;
      default:
        return `标志 ${this.flag} 不满足条件`;
    }
  }

  /**
   * 静态工厂方法，从条件对象创建条件实例
   * @param {Object} condition - 条件对象
   * @returns {FlagCondition} 条件实例
   */
  static fromCondition(condition) {
    if (condition.type !== 'flag') {
      throw new Error(`无效的条件类型: ${condition.type}`);
    }
    
    return new FlagCondition({
      flag: condition.flag,
      value: condition.value,
      operator: condition.operator
    });
  }
}

export default FlagCondition; 