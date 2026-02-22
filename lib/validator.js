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
   * 验证Claude配置的基本结构
   * @param {Object} config - 配置对象
   * @returns {Object} 验证结果
   */
  static validateClaudeConfig(config) {
    const errors = [];

    // 检查 env 配置项必须存在
    if (!config.env) {
      errors.push('缺少 env 配置项');
      return {
        isValid: false,
        errors: errors,
        warnings: this.checkConfigWarnings(config)
      };
    }

    if (typeof config.env !== 'object') {
      errors.push('env 必须是对象类型');
      return {
        isValid: false,
        errors: errors,
        warnings: this.checkConfigWarnings(config)
      };
    }

    const env = config.env;

    // 检查必需字段 ANTHROPIC_API_KEY
    if (!env.ANTHROPIC_API_KEY) {
      errors.push('env 中缺少 ANTHROPIC_API_KEY 配置');
    } else if (typeof env.ANTHROPIC_API_KEY !== 'string') {
      errors.push('ANTHROPIC_API_KEY 必须是字符串类型');
    }

    // 检查必需字段 ANTHROPIC_BASE_URL
    if (!env.ANTHROPIC_BASE_URL) {
      errors.push('env 中缺少 ANTHROPIC_BASE_URL 配置');
    } else if (typeof env.ANTHROPIC_BASE_URL !== 'string') {
      errors.push('ANTHROPIC_BASE_URL 必须是字符串类型');
    }

    // 检查可选字段 ANTHROPIC_MODEL 的类型
    if (env.ANTHROPIC_MODEL !== undefined && typeof env.ANTHROPIC_MODEL !== 'string') {
      errors.push('ANTHROPIC_MODEL 必须是字符串类型');
    }

    // 检查其他可选字段的类型
    if (config.timeout !== undefined && typeof config.timeout !== 'number') {
      errors.push('timeout 必须是数字类型');
    }

    if (config.proxy !== undefined && typeof config.proxy !== 'object') {
      errors.push('proxy 必须是对象类型');
    }

    if (config.maxTokens !== undefined && typeof config.maxTokens !== 'number') {
      errors.push('maxTokens 必须是数字类型');
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: this.checkConfigWarnings(config)
    };
  }

  /**
   * 检查配置警告
   * @param {Object} config - 配置对象
   * @returns {string[]} 警告信息列表
   */
  static checkConfigWarnings(config) {
    const warnings = [];
    
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 1) {
        warnings.push('temperature 建议在 0-1 范围内');
      }
    }
    
    if (config.maxTokens !== undefined && config.maxTokens > 100000) {
      warnings.push('maxTokens 设置较大，可能产生高额费用');
    }
    
    if (!config.systemPrompt && config.model?.includes('claude-3')) {
      warnings.push('Claude-3 模型建议设置 systemPrompt 以获得更好的效果');
    }
    
    return warnings;
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
      errors: [...jsonResult.error ? [jsonResult.error] : [], ...configResult.errors],
      warnings: configResult.warnings,
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