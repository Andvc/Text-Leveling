/**
 * 文字机遇 - 存档系统
 * 负责游戏存档的保存和加载
 */
class SaveSystem {
  constructor() {
    this.saveKey = 'wenzi_adventure_save';
  }

  /**
   * 保存游戏
   * @param {number} slot - 存档槽位
   * @param {object} data - 存档数据
   */
  async saveGame(slot, data) {
    try {
      // 获取所有存档
      const saves = this.getAllSaves();
      
      // 更新特定槽位的存档
      saves[slot] = {
        ...data,
        saveTime: new Date().toISOString(),
        saveSlot: slot
      };
      
      // 保存到本地存储
      localStorage.setItem(this.saveKey, JSON.stringify(saves));
      
      console.log(`游戏已保存到槽位 ${slot}`);
      return true;
      
    } catch (error) {
      console.error('保存游戏失败:', error);
      throw error;
    }
  }

  /**
   * 加载游戏
   * @param {number} slot - 存档槽位
   * @returns {object|null} - 存档数据
   */
  async loadGame(slot) {
    try {
      // 获取所有存档
      const saves = this.getAllSaves();
      
      // 获取特定槽位的存档
      const saveData = saves[slot];
      
      if (!saveData) {
        console.warn(`槽位 ${slot} 没有存档`);
        return null;
      }
      
      console.log(`从槽位 ${slot} 加载游戏`);
      return saveData;
      
    } catch (error) {
      console.error('加载游戏失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有存档
   * @returns {object} - 所有存档数据
   */
  getAllSaves() {
    try {
      const savesStr = localStorage.getItem(this.saveKey);
      return savesStr ? JSON.parse(savesStr) : {};
    } catch (error) {
      console.error('获取存档失败:', error);
      return {};
    }
  }

  /**
   * 删除存档
   * @param {number} slot - 存档槽位
   * @returns {boolean} - 是否成功删除
   */
  deleteGame(slot) {
    try {
      // 获取所有存档
      const saves = this.getAllSaves();
      
      // 如果指定槽位不存在存档，返回false
      if (!saves[slot]) {
        return false;
      }
      
      // 删除指定槽位的存档
      delete saves[slot];
      
      // 保存到本地存储
      localStorage.setItem(this.saveKey, JSON.stringify(saves));
      
      console.log(`槽位 ${slot} 的存档已删除`);
      return true;
      
    } catch (error) {
      console.error('删除存档失败:', error);
      return false;
    }
  }

  /**
   * 清除所有存档
   * @returns {boolean} - 是否成功清除
   */
  clearAllSaves() {
    try {
      localStorage.removeItem(this.saveKey);
      console.log('所有存档已清除');
      return true;
    } catch (error) {
      console.error('清除存档失败:', error);
      return false;
    }
  }

  /**
   * 获取存档信息
   * @param {number} slot - 存档槽位
   * @returns {object|null} - 存档信息
   */
  getSaveInfo(slot) {
    try {
      const saves = this.getAllSaves();
      const saveData = saves[slot];
      
      if (!saveData) {
        return null;
      }
      
      // 返回存档的基本信息
      return {
        slot,
        saveTime: saveData.saveTime,
        currentEventId: saveData.currentEventId,
        player: {
          attributes: saveData.player.attributes
        }
      };
      
    } catch (error) {
      console.error('获取存档信息失败:', error);
      return null;
    }
  }

  /**
   * 获取所有存档信息
   * @returns {object[]} - 所有存档信息数组
   */
  getAllSaveInfos() {
    try {
      const saves = this.getAllSaves();
      return Object.keys(saves).map(slot => this.getSaveInfo(Number(slot)));
    } catch (error) {
      console.error('获取所有存档信息失败:', error);
      return [];
    }
  }
}

export default SaveSystem; 