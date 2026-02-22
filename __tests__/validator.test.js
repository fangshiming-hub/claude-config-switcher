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
    test('应该接受有效的Claude配置', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        },
        temperature: 0.7
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该接受包含可选ANTHROPIC_MODEL的配置', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
          ANTHROPIC_MODEL: 'claude-3-sonnet-20240229'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝缺少env的配置', () => {
      const config = {
        temperature: 0.7
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('缺少 env 配置项');
    });

    test('应该拒绝env为非对象的配置', () => {
      const config = {
        env: 'invalid-string'
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('env 必须是对象类型');
    });

    test('应该拒绝缺少ANTHROPIC_API_KEY的配置', () => {
      const config = {
        env: {
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('env 中缺少 ANTHROPIC_API_KEY 配置');
    });

    test('应该拒绝缺少ANTHROPIC_BASE_URL的配置', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('env 中缺少 ANTHROPIC_BASE_URL 配置');
    });

    test('应该验证ANTHROPIC_API_KEY为字符串类型', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 12345,
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ANTHROPIC_API_KEY 必须是字符串类型');
    });

    test('应该验证ANTHROPIC_BASE_URL为字符串类型', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 12345
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ANTHROPIC_BASE_URL 必须是字符串类型');
    });

    test('应该验证ANTHROPIC_MODEL为字符串类型', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
          ANTHROPIC_MODEL: 12345
        }
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ANTHROPIC_MODEL 必须是字符串类型');
    });

    test('应该验证timeout字段类型', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        },
        timeout: 'invalid-string'
      };

      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timeout 必须是数字类型');
    });
  });

  describe('checkConfigWarnings', () => {
    test('应该检测温度范围警告', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        },
        temperature: 1.5
      };

      const warnings = Validator.checkConfigWarnings(config);
      expect(warnings).toContain('temperature 建议在 0-1 范围内');
    });

    test('应该检测大token数警告', () => {
      const config = {
        env: {
          ANTHROPIC_API_KEY: 'test-key',
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
        },
        maxTokens: 150000
      };

      const warnings = Validator.checkConfigWarnings(config);
      expect(warnings).toContain('maxTokens 设置较大，可能产生高额费用');
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