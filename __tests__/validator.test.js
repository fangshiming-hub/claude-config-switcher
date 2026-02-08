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
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
        temperature: 0.7
      };
      
      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('应该拒绝缺少必要字段的配置', () => {
      const config = {
        temperature: 0.7
      };
      
      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('缺少认证信息 (apiKey 或 authToken)');
      expect(result.errors).toContain('缺少模型配置 (model)');
    });

    test('应该验证字段类型', () => {
      const config = {
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
        timeout: 'invalid-string'
      };
      
      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('timeout 必须是数字类型');
    });

    test('应该验证模型名称', () => {
      const config = {
        apiKey: 'test-key',
        model: 'invalid-model'
      };
      
      const result = Validator.validateClaudeConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('不支持的模型'));
    });
  });

  describe('checkConfigWarnings', () => {
    test('应该检测温度范围警告', () => {
      const config = {
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
        temperature: 1.5
      };
      
      const warnings = Validator.checkConfigWarnings(config);
      expect(warnings).toContain('temperature 建议在 0-1 范围内');
    });

    test('应该检测大token数警告', () => {
      const config = {
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
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