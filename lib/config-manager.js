import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

/**
 * 配置文件管理器
 * 管理单一配置文件 claudeEnvConfig.json，切换时替换 settings.json 的 env 字段
 */
export class ConfigManager {
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(os.homedir(), '.claude-config-switch');
    this.configFile = path.join(this.configDir, 'claudeEnvConfig.json');
    this.targetFile = options.targetFile || path.join(os.homedir(), '.claude', 'settings.json');
  }

  /**
   * 确保配置文件存在
   * @returns {Promise<void>}
   */
  async ensureConfigFile() {
    await fs.ensureDir(this.configDir);
    if (!(await fs.pathExists(this.configFile))) {
      await fs.writeJson(this.configFile, {}, { spaces: 2 });
    }
  }

  /**
   * 扫描配置，返回模型名称列表
   * @returns {Promise<Array>} 模型配置列表 [{name, ...}]
   */
  async scanConfigs() {
    try {
      await this.ensureConfigFile();
      const config = await fs.readJson(this.configFile);

      if (typeof config !== 'object' || config === null) {
        throw new Error('配置文件格式错误：应为对象');
      }

      return Object.keys(config).map(name => ({
        name,
        path: this.configFile
      }));
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error(`配置文件 JSON 格式错误: ${error.message}`);
      }
      throw new Error(`扫描配置失败: ${error.message}`);
    }
  }

  /**
   * 获取指定模型的 env 配置
   * @param {string} modelName - 模型名称
   * @returns {Promise<Object>} env 配置对象
   */
  async getEnvConfig(modelName) {
    await this.ensureConfigFile();
    const config = await fs.readJson(this.configFile);

    if (!config[modelName]) {
      const availableModels = Object.keys(config);
      throw new Error(
        `找不到模型 "${modelName}"。\n` +
        `可用的模型: ${availableModels.length > 0 ? availableModels.join(', ') : '无'}`
      );
    }

    return config[modelName];
  }

  /**
   * 根据模型名称查找配置
   * @param {string} modelName - 模型名称
   * @returns {Promise<Object|null>} 找到的配置信息
   */
  async findConfigByAlias(modelName) {
    const configs = await this.scanConfigs();
    return configs.find(config => config.name === modelName) || null;
  }

  /**
   * 读取 settings.json 文件
   * @returns {Promise<Object>} settings 对象
   */
  async readSettings() {
    if (!(await fs.pathExists(this.targetFile))) {
      return {};
    }
    try {
      return await fs.readJson(this.targetFile);
    } catch {
      return {};
    }
  }

  /**
   * 切换配置 - 替换 settings.json 的 env 字段
   * @param {string} modelName - 模型名称
   * @returns {Promise<Object>} 切换结果
   */
  async switchConfig(modelName) {
    try {
      console.log(chalk.blue('🔄 正在切换配置...'));
      console.log(chalk.gray(`模型: ${modelName}`));

      // 获取模型的 env 配置
      const envConfig = await this.getEnvConfig(modelName);

      // 读取当前 settings.json
      const settings = await this.readSettings();
      const previousEnv = settings.env || null;

      // 替换 env 字段
      settings.env = envConfig;

      // 写入 settings.json
      await fs.ensureDir(path.dirname(this.targetFile));
      await fs.writeJson(this.targetFile, settings, { spaces: 2 });

      console.log(chalk.green(`✅ 已切换到模型 "${modelName}"`));
      console.log(chalk.gray(`配置文件: ${this.targetFile}`));

      return {
        success: true,
        modelName,
        targetFile: this.targetFile,
        previousEnv,
        currentEnv: envConfig,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`配置切换失败: ${error.message}`);
    }
  }

  /**
   * 获取当前激活的配置信息
   * @returns {Promise<Object|null>} 当前配置信息
   */
  async getCurrentConfig() {
    if (!(await fs.pathExists(this.targetFile))) {
      return null;
    }

    try {
      const stats = await fs.stat(this.targetFile);
      const settings = await fs.readJson(this.targetFile);

      return {
        name: 'settings.json',
        path: this.targetFile,
        size: stats.size,
        modified: stats.mtime,
        env: settings.env || null
      };
    } catch {
      return null;
    }
  }

  /**
   * 获取配置文件路径
   * @returns {string} 配置文件路径
   */
  getConfigFilePath() {
    return this.configFile;
  }

  /**
   * 获取配置目录路径
   * @returns {string} 配置目录路径
   */
  getConfigDir() {
    return this.configDir;
  }
}

export default ConfigManager;