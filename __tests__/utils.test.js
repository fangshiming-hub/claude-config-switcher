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

  describe('ensureDirectory', () => {
    test('应该能创建目录', async () => {
      const testDir = '/tmp/test-utils-dir-' + Date.now();
      await Utils.ensureDirectory(testDir);
      // 验证目录存在
      const fs = await import('fs-extra');
      const exists = await fs.pathExists(testDir);
      expect(exists).toBe(true);
      // 清理
      await fs.remove(testDir);
    });
  });

  describe('delay', () => {
    test('应该延迟指定时间', async () => {
      const start = Date.now();
      await Utils.delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // 允许一些误差
    });
  });
});