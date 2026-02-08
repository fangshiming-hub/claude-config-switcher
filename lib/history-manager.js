import fs from 'fs-extra';
import path from 'path';
import os from 'os';

/**
 * 历史记录管理器
 */
export class HistoryManager {
  constructor() {
    this.historyFile = path.join(os.homedir(), '.claude-config-switch', 'history.json');
    this.maxHistoryItems = 50;
  }

  /**
   * 确保历史文件存在
   * @private
   */
  async _ensureHistoryFile() {
    const dir = path.dirname(this.historyFile);
    await fs.ensureDir(dir);
    
    if (!(await fs.pathExists(this.historyFile))) {
      await fs.writeJson(this.historyFile, {
        records: [],
        createdAt: new Date().toISOString()
      }, { spaces: 2 });
    }
  }

  /**
   * 读取历史记录
   * @returns {Promise<Array>} 历史记录数组
   */
  async readHistory() {
    await this._ensureHistoryFile();
    
    try {
      const data = await fs.readJson(this.historyFile);
      return data.records || [];
    } catch (error) {
      console.warn('读取历史记录失败:', error.message);
      return [];
    }
  }

  /**
   * 写入历史记录
   * @param {Array} records - 历史记录数组
   * @returns {Promise<void>}
   */
  async writeHistory(records) {
    await this._ensureHistoryFile();
    
    // 限制历史记录数量
    const limitedRecords = records.slice(-this.maxHistoryItems);
    
    try {
      await fs.writeJson(this.historyFile, {
        records: limitedRecords,
        updatedAt: new Date().toISOString(),
        totalRecords: records.length
      }, { spaces: 2 });
    } catch (error) {
      console.warn('写入历史记录失败:', error.message);
    }
  }

  /**
   * 添加新的切换记录
   * @param {Object} record - 记录对象
   * @param {string} record.timestamp - 时间戳
   * @param {string} record.fromFile - 源文件
   * @param {string} record.toFile - 目标文件
   * @param {string} record.environment - 环境名称
   * @param {string} record.workingDir - 工作目录
   * @returns {Promise<void>}
   */
  async addRecord(record) {
    const history = await this.readHistory();
    
    const newRecord = {
      ...record,
      timestamp: new Date().toISOString(),
      id: this._generateId()
    };
    
    history.push(newRecord);
    await this.writeHistory(history);
  }

  /**
   * 生成唯一ID
   * @private
   * @returns {string} 唯一ID
   */
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 获取最近的切换记录
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 最近的记录
   */
  async getRecentRecords(limit = 10) {
    const history = await this.readHistory();
    return history.slice(-limit).reverse();
  }

  /**
   * 根据环境获取历史记录
   * @param {string} environment - 环境名称
   * @returns {Promise<Array>} 相关记录
   */
  async getEnvironmentHistory(environment, limit = 5) {
    const history = await this.readHistory();
    const filtered = history
      .filter(record => record.environment === environment)
      .slice(-limit)
      .reverse();
    return filtered;
  }

  /**
   * 清除历史记录
   * @param {number|undefined} days - 可选，只清除多少天前的记录
   * @returns {Promise<number>} 清除的记录数量
   */
  async clearHistory(days) {
    if (days === undefined) {
      // 清除所有历史
      await this.writeHistory([]);
      return 0;
    } else {
      // 清除指定天数前的记录
      const history = await this.readHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const remaining = history.filter(record => 
        new Date(record.timestamp) > cutoffDate
      );
      
      await this.writeHistory(remaining);
      return history.length - remaining.length;
    }
  }

  /**
   * 获取上一个配置
   * @returns {Promise<Object|null>} 上一个配置记录
   */
  async getPreviousConfig() {
    const history = await this.readHistory();
    if (history.length < 2) {
      return null;
    }
    
    // 返回倒数第二个记录（因为最后一个是最新的）
    return history[history.length - 2];
  }

  /**
   * 格式化显示历史记录
   * @param {Array} records - 记录数组
   * @returns {string} 格式化的字符串
   */
  formatHistory(records) {
    if (records.length === 0) {
      return '暂无历史记录';
    }

    let output = '📋 配置切换历史记录:\n\n';
    
    records.forEach((record, index) => {
      const date = new Date(record.timestamp);
      const formattedDate = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      output += `${index + 1}. ${formattedDate}\n`;
      output += `   环境: ${record.environment}\n`;
      output += `   从: ${record.fromFile}\n`;
      output += `   到: ${record.toFile}\n`;
      output += `   目录: ${record.workingDir}\n`;
      output += '\n';
    });
    
    return output;
  }

  /**
   * 导出历史记录
   * @param {string} filePath - 导出文件路径
   * @returns {Promise<void>}
   */
  async exportHistory(filePath) {
    const history = await this.readHistory();
    const exportData = {
      exportedAt: new Date().toISOString(),
      records: history,
      totalCount: history.length
    };
    
    await fs.writeJson(filePath, exportData, { spaces: 2 });
  }

  /**
   * 导入历史记录
   * @param {string} filePath - 导入文件路径
   * @returns {Promise<number>} 导入的记录数量
   */
  async importHistory(filePath) {
    const importData = await fs.readJson(filePath);
    const importedRecords = importData.records || [];
    
    if (importedRecords.length === 0) {
      throw new Error('导入文件中没有找到历史记录');
    }
    
    const existingHistory = await this.readHistory();
    const combinedHistory = [...existingHistory, ...importedRecords];
    
    await this.writeHistory(combinedHistory);
    return importedRecords.length;
  }
}

export default HistoryManager;