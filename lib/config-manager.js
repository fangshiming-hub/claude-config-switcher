import fs from 'fs-extra';
import path from 'path';
import { Utils } from './utils.js';
import { Validator } from './validator.js';
import chalk from 'chalk';

/**
 * 配置文件管理器
 */
export class ConfigManager {
  constructor(options = {}) {
    this.pattern = options.pattern || 'settings-*.json';
    this.target = options.target || 'settings.json';
    this.workingDir = Utils.getWorkingDirectory(options.defaultDir);
  }

  /**
   * 扫描配置文件
   * @returns {Promise<Array>} 配置文件列表
   */
  async scanConfigs() {
    try {
      const files = await Utils.scanConfigFiles(this.workingDir, this.pattern);
      const validConfigs = [];
      
      for (const file of files) {
        const fullPath = path.join(this.workingDir, file);
        const isValid = await Utils.isValidJsonFile(fullPath);
        
        if (isValid) {
          const stats = await fs.stat(fullPath);
          validConfigs.push({
            name: file,
            path: fullPath,
            size: stats.size,
            modified: stats.mtime
          });
        }
      }
      
      return validConfigs.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`扫描配置文件失败: ${error.message}`);
    }
  }

  /**
   * 根据环境别名查找配置文件
   * @param {string} envAlias - 环境别名
   * @returns {Promise<Object|null>} 找到的配置文件信息
   */
  async findConfigByAlias(envAlias) {
    const possibleNames = Utils.parseEnvAlias(envAlias, this.pattern);
    const configs = await this.scanConfigs();
    
    for (const name of possibleNames) {
      const found = configs.find(config => config.name === name);
      if (found) {
        return found;
      }
    }
    
    return null;
  }

  /**
   * 切换配置文件
   * @param {string|Object} source - 源配置（文件名或配置对象）
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 切换结果
   */
  async switchConfig(source) {
    try {
      console.log('🔍 开始切换配置...');
      console.log('📁 工作目录:', this.workingDir);
      console.log('📄 模式:', this.pattern);
      console.log('🎯 目标文件:', this.target);
      
      let sourceConfig;
      
      // 确定源配置
      if (typeof source === 'string') {
        console.log('🔎 通过别名查找配置:', source);
        // 通过别名查找
        sourceConfig = await this.findConfigByAlias(source);
        console.log('📊 找到的配置:', sourceConfig ? sourceConfig.name : '未找到');
        if (!sourceConfig) {
          const configs = await this.scanConfigs();
          console.log('📋 可用配置:', configs.map(c => c.name));
          throw new Error(
            `找不到配置 "${source}"。\n` +
            `可用的配置: ${configs.map(c => path.basename(c.name, '.json')).join(', ')}`
          );
        }
      } else {
        console.log('📄 直接使用配置对象');
        // 直接使用配置对象
        sourceConfig = source;
      }
      
      // 验证源配置
      const validation = await Validator.validateConfigFile(sourceConfig.path);
      if (!validation.isValid) {
        throw new Error(
          `配置文件验证失败:\n${Validator.generateValidationReport(validation)}`
        );
      }
      
      // 准备目标文件路径
      const targetPath = path.join(this.workingDir, this.target);
      
      // 如果目标文件已存在，备份它
      let backupCreated = false;
      let backupPath = '';
      
      if (await fs.pathExists(targetPath)) {
        backupPath = `${targetPath}.backup-${Date.now()}`;
        await fs.copy(targetPath, backupPath);
        backupCreated = true;
      }
      
      try {
        // 复制配置文件
        await fs.copy(sourceConfig.path, targetPath);
        
        // 验证目标文件
        const targetValidation = await Validator.validateConfigFile(targetPath);
        if (!targetValidation.isValid) {
          // 如果目标文件无效，恢复备份
          if (backupCreated) {
            await fs.move(backupPath, targetPath, { overwrite: true });
          }
          throw new Error(
            `配置切换后验证失败:\n${Validator.generateValidationReport(targetValidation)}`
          );
        }
        
        const result = {
          success: true,
          source: sourceConfig,
          target: {
            path: targetPath,
            name: this.target
          },
          backup: backupCreated ? backupPath : null,
          validation: targetValidation,
          timestamp: new Date().toISOString()
        };
        
        // 清理旧备份（保留最新的3个）
        if (backupCreated) {
          await this._cleanupOldBackups(targetPath);
        }
        
        return result;
        
      } catch (error) {
        // 如果复制失败，清理备份文件
        if (backupCreated && await fs.pathExists(backupPath)) {
          await fs.remove(backupPath);
        }
        throw error;
      }
      
    } catch (error) {
      throw new Error(`配置切换失败: ${error.message}`);
    }
  }

  /**
   * 清理旧的备份文件
   * @private
   * @param {string} targetPath - 目标文件路径
   */
  async _cleanupOldBackups(targetPath) {
    try {
      const files = await fs.readdir(path.dirname(targetPath));
      const backupFiles = files
        .filter(file => file.startsWith(`${path.basename(targetPath)}.backup-`))
        .map(file => path.join(path.dirname(targetPath), file))
        .sort((a, b) => {
          const timeA = parseInt(path.basename(a).split('-').pop());
          const timeB = parseInt(path.basename(b).split('-').pop());
          return timeB - timeA; // 降序排列
        });
      
      // 保留最新的3个备份
      const filesToRemove = backupFiles.slice(3);
      for (const file of filesToRemove) {
        await fs.remove(file);
      }
    } catch (error) {
      // 静默处理备份清理错误
      console.warn('清理旧备份文件时出错:', error.message);
    }
  }

  /**
   * 获取当前激活的配置
   * @returns {Promise<Object|null>} 当前配置信息
   */
  async getCurrentConfig() {
    const targetPath = path.join(this.workingDir, this.target);
    
    if (!(await fs.pathExists(targetPath))) {
      return null;
    }
    
    try {
      const stats = await fs.stat(targetPath);
      const validation = await Validator.validateConfigFile(targetPath);
      
      return {
        name: this.target,
        path: targetPath,
        size: stats.size,
        modified: stats.mtime,
        isValid: validation.isValid,
        validation: validation
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 比较两个配置文件的差异
   * @param {string} configFile1 - 第一个配置文件路径
   * @param {string} configFile2 - 第二个配置文件路径
   * @returns {Promise<Object>} 差异信息
   */
  async compareConfigs(configFile1, configFile2) {
    try {
      const [content1, content2] = await Promise.all([
        fs.readJson(configFile1),
        fs.readJson(configFile2)
      ]);
      
      // 使用简单的对象比较
      const diff = this._getObjectDiff(content1, content2);
      
      return {
        file1: configFile1,
        file2: configFile2,
        hasDiff: Object.keys(diff).length > 0,
        differences: diff,
        summary: {
          added: Object.keys(diff.added || {}).length,
          removed: Object.keys(diff.removed || {}).length,
          changed: Object.keys(diff.changed || {}).length
        }
      };
    } catch (error) {
      throw new Error(`比较配置文件失败: ${error.message}`);
    }
  }

  /**
   * 获取对象差异
   * @private
   * @param {Object} obj1 - 对象1
   * @param {Object} obj2 - 对象2
   * @param {string} prefix - 路径前缀
   * @returns {Object} 差异对象
   */
  _getObjectDiff(obj1, obj2, prefix = '') {
    const diff = {};
    
    // 找出新增的键
    const keys1 = new Set(Object.keys(obj1));
    const keys2 = new Set(Object.keys(obj2));
    
    const addedKeys = [...keys2].filter(key => !keys1.has(key));
    const removedKeys = [...keys1].filter(key => !keys2.has(key));
    const commonKeys = [...keys1].filter(key => keys2.has(key));
    
    if (addedKeys.length > 0) {
      diff.added = {};
      addedKeys.forEach(key => {
        diff.added[`${prefix}${key}`] = obj2[key];
      });
    }
    
    if (removedKeys.length > 0) {
      diff.removed = {};
      removedKeys.forEach(key => {
        diff.removed[`${prefix}${key}`] = obj1[key];
      });
    }
    
    // 比较共同键的值
    commonKeys.forEach(key => {
      const val1 = obj1[key];
      const val2 = obj2[key];
      
      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        const nestedDiff = this._getObjectDiff(val1, val2, `${prefix}${key}.`);
        Object.assign(diff, nestedDiff);
      } else if (val1 !== val2) {
        if (!diff.changed) diff.changed = {};
        diff.changed[`${prefix}${key}`] = { from: val1, to: val2 };
      }
    });
    
    return diff;
  }

  /**
   * 格式化显示配置列表
   * @param {Array} configs - 配置列表
   * @returns {string} 格式化的字符串
   */
  formatConfigList(configs) {
    if (configs.length === 0) {
      return chalk.yellow('未找到匹配的配置文件');
    }
    
    let output = chalk.blue(`找到 ${configs.length} 个配置文件:\n\n`);
    
    configs.forEach((config, index) => {
      const size = Utils.formatFileSize(config.size);
      const date = config.modified.toLocaleDateString('zh-CN');
      output += `${index + 1}. ${chalk.green(config.name)} `;
      output += chalk.gray(`(${size}, ${date})\n`);
    });
    
    return output;
  }

  /**
   * 格式化显示配置详情
   * @param {Object} config - 配置信息
   * @returns {string} 格式化的字符串
   */
  formatConfigDetails(config) {
    let output = chalk.blue('配置文件详情:\n\n');
    output += chalk.green(`文件名: ${config.name}\n`);
    output += chalk.gray(`路径: ${Utils.getRelativePath(config.path, this.workingDir)}\n`);
    output += chalk.gray(`大小: ${Utils.formatFileSize(config.size)}\n`);
    output += chalk.gray(`修改时间: ${config.modified.toLocaleString('zh-CN')}\n`);
    
    if (config.validation) {
      const status = config.validation.isValid ? 
        chalk.green('✅ 有效') : chalk.red('❌ 无效');
      output += `验证状态: ${status}\n`;
      
      if (!config.validation.isValid) {
        config.validation.errors.forEach(error => {
          output += chalk.red(`  - ${error}\n`);
        });
      }
      
      if (config.validation.warnings.length > 0) {
        output += chalk.yellow('\n警告:\n');
        config.validation.warnings.forEach(warning => {
          output += chalk.yellow(`  - ${warning}\n`);
        });
      }
    }
    
    return output;
  }
}

export default ConfigManager;