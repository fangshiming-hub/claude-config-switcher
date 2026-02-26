#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import prompts from 'prompts';
import { ConfigManager } from '../lib/config-manager.js';
import { Validator } from '../lib/validator.js';
import { Utils } from '../lib/utils.js';
import fs from 'fs-extra';

// 设置CLI应用
const argv = yargs(hideBin(process.argv))
  .usage('用法: ccs [模型名称] [选项]')
  .command('$0 [model]', '切换Claude环境配置', (yargs) => {
    yargs.positional('model', {
      describe: '模型名称 (如: work, personal)',
      type: 'string'
    });
  })
  .option('list', {
    alias: 'l',
    describe: '列出所有可用模型',
    type: 'boolean'
  })
  .option('info', {
    alias: 'i',
    describe: '显示当前 env 配置',
    type: 'boolean'
  })
  .option('validate', {
    alias: 'V',
    describe: '验证配置文件格式',
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
    const configManager = new ConfigManager();

    // 处理不同命令
    if (argv.list) {
      await handleListModels(configManager);
    } else if (argv.validate) {
      await handleValidateConfig(configManager);
    } else if (argv.info) {
      await handleShowCurrentConfigInfo(configManager);
    } else if (argv.model) {
      await handleSwitchByModel(configManager, argv.model);
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

  const models = await configManager.scanConfigs();

  if (models.length === 0) {
    console.log(chalk.yellow('未找到模型配置'));
    console.log(chalk.gray(`配置文件: ${configManager.getConfigFilePath()}`));
    console.log(chalk.gray('\n请创建配置文件，格式如下:'));
    console.log(chalk.green(JSON.stringify({
      work: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
      },
      personal: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://custom-api.example.com'
      }
    }, null, 2)));
    return;
  }

  console.log(chalk.blue(`📁 配置文件: ${configManager.getConfigFilePath()}`));
  console.log(chalk.blue(`📊 找到 ${models.length} 个模型配置:\n`));

  // 显示当前配置
  const currentConfig = await configManager.getCurrentConfig();
  if (currentConfig && currentConfig.env) {
    console.log(chalk.cyan('⚡ 当前 env 配置:'));
    console.log(chalk.gray(JSON.stringify(currentConfig.env, null, 2)));
    console.log();
  }

  // 选择模型
  const choices = models.map((model, index) => ({
    title: `${index + 1}. ${model.name}`,
    value: model.name
  }));

  const response = await prompts({
    type: 'select',
    name: 'selectedModel',
    message: '请选择要切换的模型:',
    choices: choices,
    initial: 0
  });

  if (!response.selectedModel) {
    console.log(chalk.yellow('取消操作'));
    return;
  }

  await configManager.switchConfig(response.selectedModel);
}

/**
 * 列出所有模型
 */
async function handleListModels(configManager) {
  const models = await configManager.scanConfigs();

  console.log(chalk.blue(`📁 配置文件: ${configManager.getConfigFilePath()}`));

  if (models.length === 0) {
    console.log(chalk.yellow('\n未找到模型配置'));
    console.log(chalk.gray('\n请创建配置文件，格式如下:'));
    console.log(chalk.green(JSON.stringify({
      work: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
      },
      personal: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://custom-api.example.com'
      }
    }, null, 2)));
    return;
  }

  console.log(chalk.blue(`\n📊 找到 ${models.length} 个模型配置:\n`));

  models.forEach((model, index) => {
    console.log(`${index + 1}. ${chalk.green(model.name)}`);
  });

  // 显示当前激活的配置
  const currentConfig = await configManager.getCurrentConfig();
  if (currentConfig && currentConfig.env) {
    console.log(chalk.cyan('\n⚡ 当前 env 配置:'));
    console.log(chalk.gray(JSON.stringify(currentConfig.env, null, 2)));
  }
}

/**
 * 通过模型名称切换配置
 */
async function handleSwitchByModel(configManager, modelName) {
  await configManager.switchConfig(modelName);
}

/**
 * 验证配置文件
 */
async function handleValidateConfig(configManager) {
  const configPath = configManager.getConfigFilePath();

  console.log(chalk.blue(`📁 验证配置文件: ${configPath}\n`));

  if (!(await fs.pathExists(configPath))) {
    console.log(chalk.yellow('⚠️  配置文件不存在'));
    console.log(chalk.gray('\n请创建配置文件，格式如下:'));
    console.log(chalk.green(JSON.stringify({
      work: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://api.anthropic.com'
      },
      personal: {
        ANTHROPIC_API_KEY: 'your-key',
        ANTHROPIC_BASE_URL: 'https://custom-api.example.com'
      }
    }, null, 2)));
    return;
  }

  const validation = await Validator.validateConfigFile(configPath);
  console.log(Validator.generateValidationReport(validation));

  if (argv.verbose && validation.data) {
    console.log(chalk.blue('📋 配置内容:'));
    console.log(chalk.green(JSON.stringify(validation.data, null, 2)));
  }
}

/**
 * 查看当前配置详情
 */
async function handleShowCurrentConfigInfo(configManager) {
  const currentConfig = await configManager.getCurrentConfig();

  if (!currentConfig) {
    console.log(chalk.yellow('⚠️  未找到当前配置文件'));
    console.log(chalk.gray(`目标文件: ${configManager.targetFile}`));
    return;
  }

  console.log(chalk.blue('\n📄 当前配置详情'));
  console.log(chalk.gray('=================='));
  console.log(chalk.green(`文件: ${currentConfig.name}`));
  console.log(chalk.gray(`路径: ${currentConfig.path}`));
  console.log(chalk.gray(`大小: ${Utils.formatFileSize(currentConfig.size)}`));
  console.log(chalk.gray(`修改时间: ${currentConfig.modified.toLocaleString('zh-CN')}`));

  if (currentConfig.env) {
    console.log(chalk.blue('\n📋 env 配置:'));
    console.log(chalk.green(JSON.stringify(currentConfig.env, null, 2)));

    // 验证 env 配置
    const validation = Validator.validateEnvConfig(currentConfig.env);
    console.log(chalk.blue('\n🔍 配置验证:'));
    if (validation.isValid) {
      console.log(chalk.green('✅ env 配置有效'));
    } else {
      console.log(chalk.red('❌ env 配置存在以下问题:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  警告:'));
      validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`  - ${warning}`));
      });
    }
  } else {
    console.log(chalk.yellow('\n⚠️  当前配置文件中没有 env 字段'));
  }

  console.log(); // 空行
}

// 启动程序
main();