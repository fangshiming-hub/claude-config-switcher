#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error(chalk.red('❌ 错误: 版本类型必须是 patch、minor 或 major'));
  process.exit(1);
}

async function run() {
  try {
    console.log(chalk.blue('🚀 开始发布流程...'));
    console.log(chalk.gray(`版本类型: ${versionType}`));
    console.log();

    // 1. 检查git状态
    console.log(chalk.blue('📋 检查git状态...'));
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.error(chalk.red('❌ 错误: 有未提交的更改，请先提交或暂存'));
      console.log(chalk.gray(status));
      process.exit(1);
    }
    console.log(chalk.green('✅ 工作区干净'));
    console.log();

    // 2. 运行测试
    console.log(chalk.blue('🧪 运行测试...'));
    execSync('npm test', { stdio: 'inherit' });
    console.log(chalk.green('✅ 测试通过'));
    console.log();

    // 3. 运行lint
    console.log(chalk.blue('🔍 运行代码检查...'));
    execSync('npm run lint', { stdio: 'inherit' });
    console.log(chalk.green('✅ 代码检查通过'));
    console.log();

    // 4. 获取当前版本
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = await fs.readJson(packagePath);
    const currentVersion = pkg.version;
    console.log(chalk.blue(`📦 当前版本: ${currentVersion}`));

    // 5. 更新版本号
    console.log(chalk.blue(`🔢 更新${versionType}版本号...`));
    execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });

    // 读取新版本
    const newPkg = await fs.readJson(packagePath);
    const newVersion = newPkg.version;
    console.log(chalk.green(`✅ 版本已更新: ${currentVersion} → ${newVersion}`));
    console.log();

    // 6. 提交更改
    console.log(chalk.blue('💾 提交版本更新...'));
    execSync('git add package.json package-lock.json', { stdio: 'ignore' });
    execSync(`git commit -m "chore(release): v${newVersion}"`, { stdio: 'inherit' });
    console.log(chalk.green('✅ 已提交'));
    console.log();

    // 7. 打标签
    console.log(chalk.blue('🏷️  创建git标签...'));
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });
    console.log(chalk.green(`✅ 标签 v${newVersion} 已创建`));
    console.log();

    // 8. 推送到远程
    console.log(chalk.blue('📤 推送到远程仓库...'));
    execSync('git push', { stdio: 'inherit' });
    execSync('git push --tags', { stdio: 'inherit' });
    console.log(chalk.green('✅ 已推送'));
    console.log();

    // 9. 发布到npm
    console.log(chalk.blue('🌐 发布到npm...'));
    execSync('npm publish', { stdio: 'inherit' });
    console.log(chalk.green('✅ 发布成功'));
    console.log();

    // 完成
    console.log(chalk.green('🎉 发布完成!'));
    console.log(chalk.cyan(`版本: v${newVersion}`));
    console.log(chalk.gray(`npm包: ${pkg.name}@${newVersion}`));

  } catch (error) {
    console.error(chalk.red('❌ 发布失败:'), error.message);
    process.exit(1);
  }
}

run();
