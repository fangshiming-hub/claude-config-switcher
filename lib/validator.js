import fs from 'fs-extra';

/**
 * JSON配置验证器
 */
export class Validator {
  /**
   * 验证JSON字符串是否有效
   * @param {string} jsonString - JSON字符串
   * @returns {Object} 验证结果 {isValid: boolean, error: string|null, data: any}
   */
  static validateJsonString(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return {
        isValid: true,
        error: null,
        data: data
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * 验证JSON文件是否有效
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 验证结果
   */
  static async validateJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return this.validateJsonString(content);
    } catch (error) {
      return {
        isValid: false,
        error: `无法读取文件 ${filePath}: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * 验证 Claude 配置文件格式 (claudeEnvConfig.json)
   * @param {Object} config - 配置对象
   * @returns {Object} 验证结果
   */
  static validateClaudeConfig(config) {
    const errors = [];

    // 配置必须是对象
    if (typeof config !== 'object' || config === null) {
      errors.push('配置必须是有效的 JSON 对象');
      return {
        isValid: false,
        errors: errors,
        warnings: []
      };
    }

    // 检查每个模型配置
    const modelNames = Object.keys(config);

    if (modelNames.length === 0) {
      return {
        isValid: true,
        errors: [],
        warnings: ['配置文件为空，没有定义任何模型']
      };
    }

    for (const modelName of modelNames) {
      const envConfig = config[modelName];

      // 每个模型的配置必须是对象
      if (typeof envConfig !== 'object' || envConfig === null) {
        errors.push(`模型 "${modelName}" 的配置必须是对象`);
        continue;
      }

      // 检查环境变量是否为字符串（如果存在）
      for (const [key, value] of Object.entries(envConfig)) {
        if (typeof value !== 'string') {
          errors.push(`模型 "${modelName}" 的环境变量 "${key}" 必须是字符串`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: []
    };
  }

  /**
   * 验证 settings.json 的 env 字段
   * @param {Object} envConfig - env 配置对象
   * @returns {Object} 验证结果
   */
  static validateEnvConfig(envConfig) {
    const errors = [];

    if (envConfig === undefined || envConfig === null) {
      return {
        isValid: true,
        errors: [],
        warnings: ['当前没有设置 env 配置']
      };
    }

    if (typeof envConfig !== 'object') {
      errors.push('env 必须是对象类型');
      return {
        isValid: false,
        errors: errors,
        warnings: []
      };
    }

    // 检查环境变量是否为字符串
    for (const [key, value] of Object.entries(envConfig)) {
      if (typeof value !== 'string') {
        errors.push(`环境变量 "${key}" 必须是字符串`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: []
    };
  }

  /**
   * 综合验证配置文件
   * @param {string} filePath - 配置文件路径
   * @returns {Promise<Object>} 完整验证结果
   */
  static async validateConfigFile(filePath) {
    // 首先验证JSON格式
    const jsonResult = await this.validateJsonFile(filePath);

    if (!jsonResult.isValid) {
      return {
        isValid: false,
        errors: [jsonResult.error],
        warnings: [],
        data: null
      };
    }

    // 然后验证配置结构
    const configResult = this.validateClaudeConfig(jsonResult.data);

    return {
      isValid: configResult.isValid,
      errors: [...configResult.errors],
      warnings: [...configResult.warnings],
      data: jsonResult.data
    };
  }

  /**
   * 生成配置验证报告
   * @param {Object} validationResult - 验证结果
   * @returns {string} 格式化的验证报告
   */
  static generateValidationReport(validationResult) {
    let report = '';

    if (validationResult.isValid) {
      report += '✅ 配置验证通过\n';
    } else {
      report += '❌ 配置验证失败\n';
      validationResult.errors.forEach(error => {
        report += `  - 错误: ${error}\n`;
      });
    }

    if (validationResult.warnings.length > 0) {
      report += '\n⚠️  配置警告\n';
      validationResult.warnings.forEach(warning => {
        report += `  - 警告: ${warning}\n`;
      });
    }

    return report;
  }
}

export default Validator;