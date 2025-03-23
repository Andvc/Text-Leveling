/**
 * 文字机遇 - 缓存管理器
 * 负责缓存AI生成的内容，减少API调用并提高响应速度
 */

class CacheManager {
  /**
   * 构造函数
   * @param {number} maxCacheSize - 最大缓存大小
   * @param {number} expirationTime - 缓存项过期时间（毫秒）
   */
  constructor(maxCacheSize = 100, expirationTime = 3600000) { // 默认1小时过期
    // 缓存存储
    this.cache = new Map();
    
    // 最大缓存大小
    this.maxCacheSize = maxCacheSize;
    
    // 缓存过期时间（毫秒）
    this.expirationTime = expirationTime;
    
    // 缓存命中统计
    this.stats = {
      hits: 0,
      misses: 0,
      totalAccesses: 0
    };
    
    // 访问时间记录（用于LRU淘汰）
    this.accessTimes = new Map();
  }

  /**
   * 缓存键生成
   * @param {string} prompt - 提示词
   * @returns {string} - 缓存键
   */
  _generateKey(prompt) {
    // 简单的哈希函数，用于生成缓存键
    // 注意：在生产环境中，可能需要更复杂的哈希函数
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 获取缓存项
   * @param {string} prompt - 提示词
   * @returns {Object|null} - 缓存项，如果不存在或已过期则返回null
   */
  get(prompt) {
    this.stats.totalAccesses++;
    
    // 生成缓存键
    const key = this._generateKey(prompt);
    
    // 检查缓存项是否存在
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }
    
    // 获取缓存项
    const cacheItem = this.cache.get(key);
    
    // 检查是否过期
    if (Date.now() - cacheItem.timestamp > this.expirationTime) {
      // 移除过期项
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // 更新访问时间
    this._updateAccessTime(key);
    
    this.stats.hits++;
    return cacheItem.data;
  }

  /**
   * 设置缓存项
   * @param {string} prompt - 提示词
   * @param {Object} data - 缓存数据
   */
  set(prompt, data) {
    // 生成缓存键
    const key = this._generateKey(prompt);
    
    // 如果缓存已满，执行LRU淘汰策略
    if (this.cache.size >= this.maxCacheSize) {
      this._evictLRU();
    }
    
    // 添加新缓存项
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 更新访问时间
    this._updateAccessTime(key);
  }

  /**
   * 更新缓存项访问时间
   * @private
   * @param {string} key - 缓存键
   */
  _updateAccessTime(key) {
    this.accessTimes.set(key, Date.now());
  }

  /**
   * 执行LRU（最近最少使用）淘汰策略
   * @private
   */
  _evictLRU() {
    if (this.cache.size === 0) return;
    
    // 找到最早访问的项
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    // 移除最早访问的项
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  /**
   * 清除过期缓存
   */
  clearExpired() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.expirationTime) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} - 缓存统计信息
   */
  getStats() {
    const hitRate = this.stats.totalAccesses > 0 
      ? (this.stats.hits / this.stats.totalAccesses) * 100 
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      totalAccesses: this.stats.totalAccesses,
      hitRate: `${hitRate.toFixed(2)}%`
    };
  }
  
  /**
   * 根据标签获取缓存项
   * @param {string} tag - 标签
   * @returns {Array} - 符合标签的缓存项数组
   */
  getByTag(tag) {
    const result = [];
    
    for (const [_, item] of this.cache.entries()) {
      if (item.data && item.data.tags && item.data.tags.includes(tag)) {
        result.push(item.data);
      }
    }
    
    return result;
  }
  
  /**
   * 为缓存项添加标签
   * @param {string} prompt - 提示词
   * @param {string|Array} tags - 标签或标签数组
   */
  tagItem(prompt, tags) {
    const key = this._generateKey(prompt);
    
    if (!this.cache.has(key)) return;
    
    const cacheItem = this.cache.get(key);
    
    if (!cacheItem.data.tags) {
      cacheItem.data.tags = [];
    }
    
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    
    // 添加新标签
    for (const tag of tagsArray) {
      if (!cacheItem.data.tags.includes(tag)) {
        cacheItem.data.tags.push(tag);
      }
    }
    
    // 更新缓存项
    this.cache.set(key, cacheItem);
  }
  
  /**
   * 将缓存保存到本地存储
   */
  saveToLocalStorage() {
    try {
      const serializedCache = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem('ai_cache', serializedCache);
      
      const serializedAccessTimes = JSON.stringify(Array.from(this.accessTimes.entries()));
      localStorage.setItem('ai_cache_access_times', serializedAccessTimes);
      
      localStorage.setItem('ai_cache_stats', JSON.stringify(this.stats));
      
      console.log('缓存已保存到本地存储');
    } catch (error) {
      console.error('保存缓存到本地存储时出错:', error);
    }
  }
  
  /**
   * 从本地存储加载缓存
   */
  loadFromLocalStorage() {
    try {
      const serializedCache = localStorage.getItem('ai_cache');
      if (serializedCache) {
        this.cache = new Map(JSON.parse(serializedCache));
      }
      
      const serializedAccessTimes = localStorage.getItem('ai_cache_access_times');
      if (serializedAccessTimes) {
        this.accessTimes = new Map(JSON.parse(serializedAccessTimes));
      }
      
      const statsStr = localStorage.getItem('ai_cache_stats');
      if (statsStr) {
        this.stats = JSON.parse(statsStr);
      }
      
      console.log('缓存已从本地存储加载');
    } catch (error) {
      console.error('从本地存储加载缓存时出错:', error);
      this.clear();
    }
  }
}

export default CacheManager; 