#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import prompts from 'prompts';
import { ConfigManager } from '../lib/config-manager.js';
import { Validator } from '../lib/validator.js';
import { Utils } from '../lib/utils.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// 设置CLI应用
const argv = yargs(hideBin(process.argv))
  .usage('用法: ccs [环境别名] [选项]')
  .command('$0 [env]', '切换Claude配置文件', (yargs) => {
    yargs.positional('env', {
      describe: '环境别名 (如: work, personal, dev)',
      type: 'string'
    });
  })
  .option('pattern', {
    alias: 'p',
    describe: '配置文件匹配模式',
    default: 'settings-*.json',
    type: 'string'
  })
  .option('target', {
    alias: 't',
    describe: '目标文件名',
    default: 'settings.json',
    type: 'string'
  })
  .option('current', {
    alias: 'c',
    describe: '扫描当前目录',
    type: 'boolean'
  })
  .option('dir', {
    alias: 'd',
    describe: '指定扫描目录',
    type: 'string'
  })
  .option('list', {
    alias: 'l',
    describe: '仅列出匹配的配置文件',
    type: 'boolean'
  })
  .option('diff', {
    alias: 'D',
    describe: '显示配置差异',
    type: 'boolean'
  })
  .option('validate', {
    alias: 'V',
    describe: '验证配置文件',
    type: 'boolean'
  })
  .option('template', {
    describe: '生成配置模板',
    type: 'boolean'
  })
  .option('verbose', {
    describe: '详细输出',
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .wrap(100)
  .argv;

async function main() {
  try {
    // 确定扫描目录
    let configDir;
    if (argv.current) {
      // 使用当前目录
      configDir = process.cwd();
    } else if (argv.dir) {
      // 使用指定目录
      configDir = argv.dir;
    } else {
      // 使用默认的.claude目录
      configDir = path.join(os.homedir(), '.claude');
    }
    
    const configManager = new ConfigManager({
      pattern: argv.pattern,
      target: argv.target,
      defaultDir: configDir
    });

    // 处理不同命令
    if (argv.template) {
      await handleTemplateGeneration();
    } else if (argv.list) {
      await handleListConfigs(configManager);
    } else if (argv.diff) {
      await handleShowDiff(configManager);
    } else if (argv.validate) {
      await handleValidateConfig(configManager, argv.env);
    } else if (argv.env) {
      await handleSwitchByAlias(configManager, argv.env);
    } else {
      await handleInteractiveMode(configManager);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 错误:'), error.message);
    process.exit(1);
  }
}

/**
 * 交互式模式
 */
async function handleInteractiveMode(configManager) {
  console.log(chalk.blue('🤖 Claude 配置切换器'));
  console.log(chalk.gray('=====================\n'));
  
  const configs = await configManager.scanConfigs();
  
  if (configs.length === 0) {
    console.log(chalk.yellow('未找到配置文件'));
    console.log(chalk.gray(`搜索模式: ${argv.pattern}`));
    console.log(chalk.gray(`工作目录: ${configManager.workingDir}`));
    return;
  }
  
  console.log(configManager.formatConfigList(configs));
  console.log();
  
  // 显示当前配置
  const currentConfig = await configManager.getCurrentConfig();
  if (currentConfig) {
    console.log(chalk.cyan('当前配置:'), chalk.green(currentConfig.name));
    console.log();
  }
  
  // 选择配置
  const choices = configs.map((config, index) => ({
    title: `${index + 1}. ${config.name}`,
    value: config
  }));
  
  const response = await prompts({
    type: 'select',
    name: 'selectedConfig',
    message: '请选择要切换到的配置:',
    choices: choices,
    initial: 0
  });
  
  if (!response.selectedConfig) {
    console.log(chalk.yellow('取消操作'));
    return;
  }
  
  await switchConfig(configManager, response.selectedConfig);
}

/**
 * 通过别名切换配置
 */
async function handleSwitchByAlias(configManager, envAlias) {
  const config = await configManager.findConfigByAlias(envAlias);
  
  if (!config) {
    console.log(chalk.red(`❌ 找不到配置 "${envAlias}"`));
    
    const allConfigs = await configManager.scanConfigs();
    if (allConfigs.length > 0) {
      console.log(chalk.yellow('\n可用的配置:'));
      allConfigs.forEach(cfg => {
        console.log(chalk.gray(`  - ${path.basename(cfg.name, '.json')}`));
      });
    }
    return;
  }
  
  await switchConfig(configManager, config, envAlias);
}

/**
 * 列出配置文件
 */
async function handleListConfigs(configManager) {
  const configs = await configManager.scanConfigs();
  
  if (configs.length === 0) {
    console.log(chalk.yellow('未找到配置文件'));
    console.log(chalk.gray(`搜索模式: ${argv.pattern}`));
    console.log(chalk.gray(`扫描目录: ${configManager.workingDir}`));
    return;
  }
  
  console.log(chalk.blue(`📁 扫描目录: ${configManager.workingDir}`));
  console.log(chalk.blue(`📄 匹配模式: ${argv.pattern}`));
  console.log(chalk.blue(`📊 找到 ${configs.length} 个配置文件:`));
  console.log();
  
  configs.forEach((config, index) => {
    const size = Utils.formatFileSize(config.size);
    const date = config.modified.toLocaleDateString('zh-CN');
    console.log(`${index + 1}. ${chalk.green(config.name)} `);
    console.log(chalk.gray(`   大小: ${size} | 修改时间: ${date}`));
    
    // 如果启用详细模式，显示更多配置信息
    if (argv.verbose) {
      try {
        const configData = fs.readJsonSync(config.path);
        if (configData.model) {
          console.log(chalk.gray(`   模型: ${configData.model}`));
        }
        if (configData.organization) {
          console.log(chalk.gray(`   组织: ${configData.organization}`));
        }
        console.log();
      } catch (err) {
        console.log(chalk.gray('   无法读取配置详情'));
        console.log();
      }
    }
  });
  
  // 显示当前激活的配置
  const currentConfig = await configManager.getCurrentConfig();
  if (currentConfig) {
    console.log(chalk.cyan('\n⚡ 当前激活配置:'), chalk.green(currentConfig.name));
  }
}

/**
 * 显示配置差异
 */
async function handleShowDiff(configManager) {
  const configs = await configManager.scanConfigs();
  
  if (configs.length < 2) {
    console.log(chalk.yellow('需要至少两个配置文件才能比较'));
    return;
  }
  
  // 选择两个配置进行比较
  const choices = configs.map((config, index) => ({
    title: `${index + 1}. ${config.name}`,
    value: config
  }));
  
  const [response1, response2] = await Promise.all([
    prompts({
      type: 'select',
      name: 'config',
      message: '选择第一个配置:',
      choices: choices
    }),
    prompts({
      type: 'select',
      name: 'config',
      message: '选择第二个配置:',
      choices: choices
    })
  ]);
  
  if (!response1.config || !response2.config) {
    console.log(chalk.yellow('取消操作'));
    return;
  }
  
  const diff = await configManager.compareConfigs(
    response1.config.path,
    response2.config.path
  );
  
  displayConfigDiff(diff);
}

/**
 * 验证配置文件
 */
async function handleValidateConfig(configManager, envAlias) {
  let configPath;
  
  if (envAlias) {
    const config = await configManager.findConfigByAlias(envAlias);
    if (!config) {
      console.log(chalk.red(`❌ 找不到配置 "${envAlias}"`));
      return;
    }
    configPath = config.path;
  } else {
    // 验证当前激活的配置
    const currentConfig = await configManager.getCurrentConfig();
    if (!currentConfig) {
      console.log(chalk.red('❌ 未找到当前配置文件'));
      return;
    }
    configPath = currentConfig.path;
  }
  
  const validation = await Validator.validateConfigFile(configPath);
  console.log(Validator.generateValidationReport(validation));
}

/**
 * 生成配置模板
 */
async function handleTemplateGeneration() {
  const templateDir = Utils.getTemplateDir();
  await Utils.ensureDirectory(templateDir);
  
  const templatePath = path.join(templateDir, 'settings-template.json');
  
  const template = {
    apiKey: 'your-api-key-here',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'You are a helpful AI assistant.',
    timeout: 30000,
    proxy: {
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http'
    }
  };
  
  await fs.writeJson(templatePath, template, { spaces: 2 });
  console.log(chalk.green('✅ 配置模板已生成:'), templatePath);
  console.log(chalk.gray('请根据需要修改模板内容'));
}

/**
 * 执行配置切换
 */
async function switchConfig(configManager, config) {
  try {
    console.log(chalk.blue('🔄 正在切换配置...'));
    
    const result = await configManager.switchConfig(config);
    
    console.log(chalk.green('✅ 配置切换成功!'));
    if (result.validation.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  配置警告:'));
      result.validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`  - ${warning}`));
      });
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 配置切换失败:'), error.message);
    throw error;
  }
}

/**
 * 显示配置差异
 */
function displayConfigDiff(diff) {
  console.log(chalk.blue('🔍 配置差异比较'));
  console.log(chalk.gray('=================='));
  console.log(chalk.cyan(`文件1: ${path.basename(diff.file1)}`));
  console.log(chalk.cyan(`文件2: ${path.basename(diff.file2)}`));
  console.log();
  
  if (!diff.hasDiff) {
    console.log(chalk.green('两个配置文件完全相同'));
    return;
  }
  
  const summary = diff.summary;
  console.log(chalk.yellow(`总计: ${summary.added} 项新增, ${summary.removed} 项删除, ${summary.changed} 项修改`));
  console.log();
  
  if (diff.differences.added) {
    console.log(chalk.green('➕ 新增项:'));
    Object.entries(diff.differences.added).forEach(([key, value]) => {
      console.log(chalk.green(`  ${key}: ${JSON.stringify(value)}`));
    });
    console.log();
  }
  
  if (diff.differences.removed) {
    console.log(chalk.red('➖ 删除项:'));
    Object.entries(diff.differences.removed).forEach(([key, value]) => {
      console.log(chalk.red(`  ${key}: ${JSON.stringify(value)}`));
    });
    console.log();
  }
  
  if (diff.differences.changed) {
    console.log(chalk.blue('🔄 修改项:'));
    Object.entries(diff.differences.changed).forEach(([key, change]) => {
      console.log(chalk.blue(`  ${key}:`));
      console.log(chalk.red(`    从: ${JSON.stringify(change.from)}`));
      console.log(chalk.green(`    到: ${JSON.stringify(change.to)}`));
    });
  }
}

// 启动程序
main();