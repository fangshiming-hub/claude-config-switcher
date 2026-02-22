 # Claude 配置切换器（claude-config-switch）

Claude 配置切换器是一个功能强大的命令行工具，用于在本地快速切换不同的 Claude 配置文件（例如工作 / 个人账号、不同代理、不同模型等）。  
它通过扫描当前目录下或者指定目下的配置文件（如 `settings-*.json`），将选中的配置复制为统一的目标文件（如 `settings.json`），方便前端 / Node 项目统一读取。

---

## 🌟 主要特性

- ✅ **智能配置扫描**：自动扫描当前目录中符合模式的配置文件
- ✅ **多种使用方式**：支持交互式选择或命令行参数快速切换
- ✅ **配置显示**：切换时显示前后配置内容，方便确认
- ✅ **模板生成**：一键生成标准配置模板
- ✅ **灵活定制**：支持自定义扫描模式和目标文件名

---

## 🚀 典型使用场景

例如，你有三个 Claude 配置文件：

- `settings-work.json`：工作账号配置  
- `settings-personal.json`：个人账号配置  
- `settings-dev.json`：开发测试配置

希望通过一个命令快速切换当前使用的配置到统一的 `settings.json`，供前端项目或 Node 脚本读取。

### 实际应用场景

1. **团队协作**：不同开发者使用不同的API密钥和配置
2. **环境隔离**：开发、测试、生产环境使用不同配置
3. **代理设置**：国内外网络环境下使用不同代理配置
4. **模型切换**：根据不同任务需求切换Claude模型
5. **快速调试**：临时切换到调试配置进行问题排查

---

## 📦 安装与使用

### 全局安装

```bash
npm install -g claude-config-switch
```

安装完成后，可以直接在任意目录使用：

```bash
# 交互模式
ccs

# 指定环境别名
ccs work
ccs personal
ccs dev
```

### 使用 npx（无需全局安装）

```bash
# 交互模式
npx ccs

# 指定环境别名
npx ccs work
npx ccs personal
npx ccs dev
```

### 项目本地安装

```bash
npm install claude-config-switch --save-dev

# 在 package.json scripts 中使用
"scripts": {
  "config:work": "ccs work",
  "config:personal": "ccs personal",
  "config:dev": "ccs dev"
}
```

---

## 配置文件约定

### 默认约定

- 源配置文件模式：`settings-*.json`
  - 常见示例：
    - `settings-work.json`
    - `settings-personal.json`
    - `settings-dev.json`
- 目标配置文件：`settings.json`
  - 即项目代码中只需要读取 `settings.json`，不关心具体环境名称

### 自定义模式与目标文件

可以通过命令行参数自定义：

- `--pattern` 或 `-p`：自定义扫描模式  
- `--target` 或 `-t`：自定义目标文件名 
- `--default` 或 `-d`：扫描默认目录 

示例：

```bash
# 从 config-*.json 中选择一个，复制为 config.json
claude-config-switcher work --pattern config-*.json --target config.json
```

---

## 命令行用法

```bash
claude-config-switcher [envAlias] [options]
```

- `envAlias`（可选）：环境别名，例如 `work`、`personal`、`dev` 等  
  - 当提供别名时，工具会尝试匹配以下文件名：
    - `settings-envAlias.json`（例如 `settings-work.json`）
    - `settings-envAlias`
    - `envAlias.json`
    - `envAlias`
  - 找不到时会给出错误提示和可用列表
- 若不提供 `envAlias`：
  - 工具将进入交互模式，列出所有匹配到的配置文件，让你用方向键选择

### 可选参数

- `-p, --pattern <glob>`：配置文件的匹配模式，默认 `settings-*.json`
- `-t, --target <filename>`：目标文件名，默认 `settings.json`
- `-l, --list`：只列出匹配的配置文件，不执行复制
- `-c, --current`：扫描当前目录
- `-d, --dir <path>`：指定扫描目录
- `--template`：生成配置模板
- `-v, --verbose`：详细输出
- `-h, --help`：显示帮助信息
- `--version`：显示版本号

---

## 实现原理概览

- 使用 `process.cwd()` 获取当前目录或者配置的默认目录
- 通过 `fs.readdir` 扫描目录下所有文件
- 按给定模式（默认 `settings-*.json`）过滤出候选配置文件
- 根据命令行参数决定是：
  - 直接按别名匹配文件名，还是
  - 使用 `prompts` 提供交互式选择
- 对选中的配置文件：
  - 将源配置文件复制到目标文件（默认 `settings.json`）
  - 显示切换前后的配置内容
- 输出切换结果和简单提示

---

## 在项目中的集成示例

在你自己的工程里（例如一个前端项目），可以在 `package.json` 中添加脚本来一键切换配置：

```json
"scripts": {
  "ccs:work": "cccs work",
  "ccs:personal": "ccs personal"
}
```

然后使用：

```bash
npm run ccs:work
npm run ccs:personal
```

这样你只需要记住 `npm run ccs:xxx`，就可以在不同 Claude 配置之间快速切换。

## 🛠 增强功能详解

### 配置比较
```bash
# 比较两个配置文件的差异
ccs --diff
```

### 模板生成
```bash
# 生成标准配置模板
ccs --template
```

### 详细信息显示
```bash
# 显示详细配置信息
ccs --list --verbose
```

---

## ⚙️ 高级配置选项

### 自定义扫描模式
```bash
# 使用自定义模式扫描配置文件
ccs work --pattern config-*.json --target config.json
```

### 默认目录设置
```bash
# 指定默认扫描目录
ccs work --default /path/to/configs
```

### 完整命令行选项
```bash
ccs [envAlias] [options]

选项：
  -p, --pattern        配置文件匹配模式 [默认: "settings-*.json"]
  -t, --target         目标文件名 [默认: "settings.json"]
  -c, --current        扫描当前目录
  -d, --dir            指定扫描目录
  -l, --list           仅列出匹配的配置文件
  -D, --diff           显示配置差异
      --template       生成配置模板
  -v, --verbose        详细输出
  -h, --help           显示帮助信息
  --version            显示版本号
```

---

## 📁 配置文件模板

项目提供了多种预设配置模板：

- `settings-template.json` - 基础配置模板
- `settings-advanced.json` - 高级功能配置
- `settings-fast.json` - 快速响应配置
- `settings-proxy.json` - 代理服务器配置

使用 `ccs --template` 命令生成基础模板，然后根据需要进行修改。

---

## 🔧 在项目中的集成示例

在你的工程中（例如一个前端项目），可以在 `package.json` 中添加脚本来一键切换配置：

```json
{
  "scripts": {
    "config:work": "ccs work",
    "config:personal": "ccs personal",
    "config:dev": "ccs dev",
    "config:list": "ccs --list"
  }
}
```

然后使用：
```bash
npm run config:work
npm run config:personal
npm run config:dev
```

这样你只需要记住 `npm run config:xxx`，就可以在不同 Claude 配置之间快速切换。

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个工具！

### 开发环境设置
```bash
git clone https://github.com/yourusername/claude-config-switch.git
cd claude-config-switch
npm install
npm link  # 链接到全局以便测试
```

### 运行测试
```bash
npm test
npm run test:coverage
npm run lint
```

---

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

## 🆘 故障排除

### 常见问题

**Q: 找不到配置文件？**
A: 确保配置文件在当前目录下，且文件名符合 `settings-*.json` 模式

**Q: 切换失败？**
A: 检查源配置文件是否为有效JSON格式

**Q: 权限错误？**
A: 确保对目标目录有写入权限

### 获取帮助
```bash
ccs --help
```

