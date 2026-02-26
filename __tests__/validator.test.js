import { Validator } from '../lib/validator.js';

describe('Validator', () => {
  describe('validateJsonString', () => {
    test('应该验证有效的JSON字符串', () => {
      const result = Validator.validateJsonString('{"test": "value"}');
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ test: 'value' });
      expect(result.error).toBeNull();
    });

    test('应该拒绝无效的JSON字符串', () => {
      const result = Validator.validateJsonString('{"test": invalid}');
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toContain('Unexpected token');
    });
  });

  describe('validateClaudeConfig', () => {
    test('应该接受有效的配置文件格式', () => {
      const config = {
        work: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        },
        personal: {
          ANTHROPIC_API_KEY: 'another-key',
          ANTHROPIC_BASE_URL: 'https://custom-api.example.com'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该接受空的配置文件', () => {
      const config = {};

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('配置文件为空，没有定义任何模型');
    });

    test('应该拒绝非对象类型的配置', () => {
      const result = Validator.validateClaudeConfig('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('配置必须是有效的 JSON 对象');
    });

    test('应该拒绝null类型的配置', () => {
      const result = Validator.validateClaudeConfig(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('配置必须是有效的 JSON 对象');
    });

    test('应该拒绝模型配置为非对象的情况', () => {
      const config = {
        work: 'invalid-string'
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('模型 "work" 的配置必须是对象');
    });

    test('应该拒绝环境变量为非字符串的情况', () => {
      const config = {
        work: {
          ANTHROPIC_API_KEY: 12345
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('模型 "work" 的环境变量 "ANTHROPIC_API_KEY" 必须是字符串');
    });

    test('应该接受多个有效模型配置', () => {
      const config = {
        work: {
          ANTHROPIC_API_KEY: 'key1',
          ANTHROPIC_BASE_URL: 'url1',
          ANTHROPIC_MODEL: 'model1'
        },
        personal: {
          API_KEY: 'key2'
        },
        dev: {
          ANTHROPIC_API_KEY: 'key3'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateEnvConfig', () => {
    test('应该接受有效的env配置', () => {
      const envConfig = {
        ANTHROPIC_API_KEY: 'test-key',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
      };

      const result = Validator.validateEnvConfig(envConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该接受null/undefined的env配置', () => {
      let result = Validator.validateEnvConfig(null);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('当前没有设置 env 配置');

      result = Validator.validateEnvConfig(undefined);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('当前没有设置 env 配置');
    });

    test('应该拒绝非对象类型的env配置', () => {
      const result = Validator.validateEnvConfig('invalid-string');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('env 必须是对象类型');
    });

    test('应该拒绝非字符串类型的环境变量', () => {
      const envConfig = {
        ANTHROPIC_API_KEY: 12345
      };

      const result = Validator.validateEnvConfig(envConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('环境变量 "ANTHROPIC_API_KEY" 必须是字符串');
    });
  });

  describe('generateValidationReport', () => {
    test('应该生成通过的验证报告', () => {
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const report = Validator.generateValidationReport(validationResult);
      expect(report).toContain('✅ 配置验证通过');
    });

    test('应该生成失败的验证报告', () => {
      const validationResult = {
        isValid: false,
        errors: ['缺少必要字段'],
        warnings: []
      };

      const report = Validator.generateValidationReport(validationResult);
      expect(report).toContain('❌ 配置验证失败');
      expect(report).toContain('缺少必要字段');
    });

    test('应该包含警告信息', () => {
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: ['这是一个警告']
      };

      const report = Validator.generateValidationReport(validationResult);
      expect(report).toContain('⚠️  配置警告');
      expect(report).toContain('这是一个警告');
    });
  });
});