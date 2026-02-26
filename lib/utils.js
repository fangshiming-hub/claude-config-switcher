import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 工具函数集合
 */
export class Utils {
  /**
   * 获取当前工作目录或默认目录
   * @param {string} defaultDir - 可选的默认目录
   * @returns {string} 目录路径
   */
  static getWorkingDirectory(defaultDir) {
    return defaultDir || process.cwd();
  }

  /**
   * 验证JSON文件是否存在且可读
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否有效
   */
  static async isValidJsonFile(filePath) {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      const content = await fs.readFile(filePath, 'utf8');
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取相对路径显示
   * @param {string} fullPath - 完整路径
   * @param {string} baseDir - 基准目录
   * @returns {string} 相对路径
   */
  static getRelativePath(fullPath, baseDir) {
    return path.relative(baseDir, fullPath);
  }

  /**
   * 创建目录（如果不存在）
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  static async ensureDirectory(dirPath) {
    await fs.ensureDir(dirPath);
  }

  /**
   * 获取包的根目录
   * @returns {string} 包根目录路径
   */
  static getPackageRoot() {
    return path.resolve(__dirname, '..');
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化的大小字符串
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Utils;