# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Config Switcher (`ccs`) is a CLI tool for switching between different Claude configuration files. It scans for `settings-*.json` files and copies the selected one to `settings.json` for use by Claude applications.

## Development Commands

```bash
# Run the CLI locally
npm start
node bin/cli.js

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Link for local testing
npm link
```

## Architecture

### Module System
- **ES Modules**: The project uses ES modules (`"type": "module"` in package.json)
- Import paths must include `.js` extensions even for `.js` files

### Directory Structure
```
bin/cli.js              # CLI entry point with yargs argument parsing
lib/
  config-manager.js     # Core class for scanning, switching, comparing configs
  utils.js              # Static utility class for file operations
  validator.js          # JSON validation and Claude config schema validation
  history-manager.js    # Tracks config switch history in ~/.claude-config-switch/
templates/              # Config templates (settings-*.json samples)
__tests__/              # Jest test files
```

### Key Classes

**ConfigManager** (`lib/config-manager.js`)
- `scanConfigs()`: Scans directory for files matching the pattern
- `switchConfig(source)`: Copies selected config to target file
- `findConfigByAlias(envAlias)`: Matches alias to possible filenames
- `compareConfigs(file1, file2)`: Deep diff between two config objects
- `getCurrentConfig()`: Returns info about the target config file

**Utils** (`lib/utils.js`)
- Static utility methods for file scanning, path handling, formatting
- `parseEnvAlias()`: Generates possible filenames from alias (e.g., `work` → `settings-work.json`, `settings-work`, `work.json`, `work`)

**Validator** (`lib/validator.js`)
- `validateClaudeConfig()`: Validates config has required `env` object with `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL`
- `validateJsonString/File()`: Basic JSON validity checks

**HistoryManager** (`lib/history-manager.js`)
- Stores switch history in `~/.claude-config-switch/history.json`
- Tracks timestamp, from/to files, environment, working directory

### Configuration File Format

Config files are JSON with this structure:
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "your-key",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_MODEL": "claude-3-sonnet-20240229"
  },
  "temperature": 0.7,
  "maxTokens": 1000,
  "timeout": 30000
}
```

### CLI Arguments

- `-p, --pattern <glob>`: Config file pattern (default: `settings-*.json`)
- `-t, --target <filename>`: Target filename (default: `settings.json`)
- `-c, --current`: Scan current directory instead of default
- `-d, --dir <path>`: Specify scan directory
- `-l, --list`: List configs without switching
- `-i, --info`: Show current config details
- `-D, --diff`: Compare two configs
- `-V, --validate`: Validate config file
- `--template`: Generate config template

### Default Directories

- Config directory: `~/.claude` (unless `-c` or `-d` specified)
- History file: `~/.claude-config-switch/history.json`
- Template directory: `<package_root>/templates/`

## Testing

Tests use Jest with ES modules. Run with:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

Test files: `__tests__/*.test.js`

## Linting

ESLint configuration in `.eslintrc.json`:
- Uses `eslint:recommended`
- 2-space indentation
- Single quotes
- Semicolons required
- Windows line endings (`linebreak-style: windows`)
