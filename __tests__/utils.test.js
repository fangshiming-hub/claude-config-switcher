import { Utils } from '../lib/utils.js';

describe('Utils', () => {
  describe('getWorkingDirectory', () => {
    test('应该返回当前工作目录当没有默认目录时', () => {
      const result = Utils.getWorkingDirectory();
      expect(result).toBe(process.cwd());
    });

    test('应该返回提供的默认目录', () => {
      const defaultDir = '/test/dir';
      const result = Utils.getWorkingDirectory(defaultDir);
      expect(result).toBe(defaultDir);
    });
  });

  describe('parseEnvAlias', () => {
    test('应该正确解析环境别名', () => {
      const result = Utils.parseEnvAlias('work');
      expect(result).toEqual([
        'settings-work.json',
        'settings-work',
        'work.json',
        'work'
      ]);
    });

    test('应该支持自定义模式', () => {
      const result = Utils.parseEnvAlias('dev', 'config-*.json');
      expect(result).toEqual([
        'config-dev.json',
        'config-dev',
        'dev.json',
        'dev'
      ]);
    });
  });

  describe('formatFileSize', () => {
    test('应该正确格式化字节大小', () => {
      expect(Utils.formatFileSize(0)).toBe('0 Bytes');
      expect(Utils.formatFileSize(1024)).toBe('1 KB');
      expect(Utils.formatFileSize(1048576)).toBe('1 MB');
      expect(Utils.formatFileSize(1073741824)).toBe('1 GB');
    });

    test('应该处理小数值', () => {
      expect(Utils.formatFileSize(1500)).toBe('1.46 KB');
    });
  });

  describe('getPackageRoot', () => {
    test('应该返回正确的包根目录', () => {
      const result = Utils.getPackageRoot();
      expect(result).toContain('claude-config-switcher');
    });
  });

  describe('getTemplateDir', () => {
    test('应该返回正确的模板目录', () => {
      const result = Utils.getTemplateDir();
      expect(result).toContain('templates');
    });
  });
});