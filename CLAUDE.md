# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Config Switcher (`ccs`) is a CLI tool for switching between different Claude environment configurations. It manages a single config file `claudeEnvConfig.json` and switches by replacing the `env` field in `~/.claude/settings.json`.

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

# Release commands
npm run release          # Release patch version (1.0.0 -> 1.0.1)
npm run release:patch    # Same as above
npm run release:minor    # Release minor version (1.0.0 -> 1.1.0)
npm run release:major    # Release major version (1.0.0 -> 2.0.0)
```

### Release Process

The release script (`scripts/release.js`) performs:
1. Checks for uncommitted git changes
2. Runs tests (`npm test`)
3. Runs linting (`npm run lint`)
4. Bumps version in package.json
5. Commits the version change
6. Creates git tag (e.g., `v1.0.1`)
7. Pushes commit and tags to remote
8. Publishes to npm

## Architecture

### Module System
- **ES Modules**: The project uses ES modules (`"type": "module"` in package.json)
- Import paths must include `.js` extensions even for `.js` files

### Directory Structure
```
bin/cli.js              # CLI entry point with yargs argument parsing
lib/
  config-manager.js     # Core class for managing claudeEnvConfig.json and switching env
  utils.js              # Static utility class for file operations
  validator.js           # JSON validation and config format validation
__tests__/              # Jest test files
```

### Key Classes

**ConfigManager** (`lib/config-manager.js`)
- `scanConfigs()`: Reads claudeEnvConfig.json, returns model name list
- `switchConfig(modelName)`: Reads config, replaces settings.json's env field
- `findConfigByAlias(modelName)`: Finds model by name
- `getCurrentConfig()`: Returns info about the target config file including current env
- `getEnvConfig(modelName)`: Gets env config for a specific model

**Utils** (`lib/utils.js`)
- Static utility methods for file operations, path handling, formatting

**Validator** (`lib/validator.js`)
- `validateClaudeConfig()`: Validates claudeEnvConfig.json format (object with model names as keys)
- `validateEnvConfig()`: Validates env field structure in settings.json
- `validateJsonString/File()`: Basic JSON validity checks

### Configuration File Format

#### claudeEnvConfig.json
Path: `~/.claude-config-switch/claudeEnvConfig.json`

```json
{
  "work": {
    "ANTHROPIC_API_KEY": "sk-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_MODEL": "claude-3-sonnet-20240229"
  },
  "personal": {
    "ANTHROPIC_API_KEY": "sk-yyy",
    "ANTHROPIC_BASE_URL": "https://custom-api.example.com"
  }
}
```

#### settings.json (target file)
Path: `~/.claude/settings.json`

After switching, the `env` field is replaced:
```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-xxx",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_MODEL": "claude-3-sonnet-20240229"
  }
}
```

Other top-level fields in settings.json are preserved during switching.

### CLI Commands

```bash
# Interactive mode - select from list
ccs

# Switch directly to a model
ccs work

# List all available models
ccs -l
ccs --list

# Show current env configuration
ccs -i
ccs --info

# Validate config file format
ccs -V
ccs --validate
```

### Default Directories

- Config file: `~/.claude-config-switch/claudeEnvConfig.json`
- Target file: `~/.claude/settings.json`

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