# Claude 配置切换器（claude-config-switcher）

Claude 配置切换器是一个简洁的命令行工具，用于在本地快速切换不同的 Claude 环境配置。它管理一个统一的配置文件 `claudeEnvConfig.json`，切换时直接替换 `~/.claude/settings.json` 中的 `env` 字段。

---

## 🌟 主要特性

- ✅ **单一配置文件**：所有环境配置集中在一个文件中管理
- ✅ **简单切换**：一键切换环境，直接替换 settings.json 的 env 字段
- ✅ **交互式选择**：支持交互式列表选择或命令行参数快速切换
- ✅ **配置验证**：验证配置文件格式，确保配置正确

---

## 🚀 典型使用场景

- **多账号管理**：工作/个人账号快速切换
- **环境隔离**：开发、测试、生产环境使用不同配置
- **代理设置**：国内外网络环境下使用不同代理配置
- **模型切换**：根据不同任务需求切换 Claude 模型

---

## 📦 安装与使用

### 全局安装

```bash
npm install -g @weishiren/claude-config-switcher
```

安装完成后，可以直接在任意目录使用：

```bash
# 交互模式
ccs

# 直接切换到指定模型
ccs work
ccs personal
```

### 使用 npx（无需全局安装）

```bash
npx @weishiren/claude-config-switcher
npx @weishiren/claude-config-switcher work
```

---

## 配置文件格式

### 配置文件路径

`~/.claude-config-switch/claudeEnvConfig.json`

### 配置文件示例

```json
{
  "work": {
    "ANTHROPIC_API_KEY": "sk-work-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_MODEL": "claude-3-sonnet-20240229"
  },
  "personal": {
    "ANTHROPIC_API_KEY": "sk-personal-yyy",
    "ANTHROPIC_BASE_URL": "https://custom-api.example.com"
  },
  "dev": {
    "ANTHROPIC_API_KEY": "sk-dev-zzz",
    "ANTHROPIC_BASE_URL": "http://localhost:8080"
  }
}
```

### 目标文件

切换后，`~/.claude/settings.json` 的 `env` 字段会被替换：

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-work-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_MODEL": "claude-3-sonnet-20240229"
  }
}
```

**注意**：settings.json 中的其他顶层字段在切换时会保留。

---

## 命令行用法

```bash
ccs [model] [options]
```

### 命令

| 命令 | 说明 |
|------|------|
| `ccs` | 交互式选择模型 |
| `ccs <model>` | 直接切换到指定模型（如 `ccs work`） |
| `ccs -l, --list` | 列出所有可用模型 |
| `ccs -i, --info` | 显示当前 env 配置 |
| `ccs -V, --validate` | 验证配置文件格式 |
| `ccs -h, --help` | 显示帮助信息 |
| `ccs --version` | 显示版本号 |

### 示例

```bash
# 交互式选择
ccs

# 切换到 work 环境
ccs work

# 切换到 personal 环境
ccs personal

# 列出所有模型
ccs -l

# 查看当前配置
ccs -i

# 验证配置文件
ccs -V
ccs -V --verbose  # 显示详细配置内容
```

---

## 工作原理

1. 读取 `~/.claude-config-switch/claudeEnvConfig.json` 配置文件
2. 根据模型名称获取对应的环境变量配置
3. 读取 `~/.claude/settings.json` 文件
4. 用新的环境变量替换 `env` 字段（保留其他字段）
5. 写回 `~/.claude/settings.json`

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个工具！

### 开发环境设置

```bash
git clone https://github.com/weishiren/claude-config-switcher.git
cd claude-config-switcher
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

**Q: 配置文件在哪里？**

A: 配置文件位于 `~/.claude-config-switch/claudeEnvConfig.json`，首次运行会自动创建空配置。

**Q: 切换后 settings.json 的其他配置会丢失吗？**

A: 不会。切换只会替换 `env` 字段，其他顶层字段会保留。

**Q: 如何验证配置是否正确？**

A: 使用 `ccs -V` 命令验证配置文件格式。

### 获取帮助

```bash
ccs --help
```