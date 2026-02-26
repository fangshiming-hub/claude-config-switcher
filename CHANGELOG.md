# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-26

### Changed
- **BREAKING**: Config format changed from multiple `settings-*.json` files to single `claudeEnvConfig.json`
- **BREAKING**: Switching now replaces `env` field in `settings.json` instead of copying entire file
- **BREAKING**: Config path is now `~/.claude-config-switch/claudeEnvConfig.json`
- **BREAKING**: Simplified CLI commands - removed `-p/--pattern`, `-t/--target`, `-c/--current`, `-d/--dir`, `-D/--diff`, `--template` options

### Removed
- HistoryManager module (no longer needed)
- Templates directory (no longer needed)
- `compareConfigs()` method from ConfigManager
- `formatConfigList()` method from ConfigManager
- `scanConfigFiles()` function from Utils
- `parseEnvAlias()` function from Utils
- `getTemplateDir()` function from Utils

### Added
- New config file format with model names as keys
- `validateEnvConfig()` method in Validator
- `getEnvConfig()` method in ConfigManager
- `getConfigFilePath()` method in ConfigManager
- `getConfigDir()` method in ConfigManager

### Migration Guide
Old config format (multiple files):
```
~/.claude/
├── settings-work.json
├── settings-personal.json
└── settings.json
```

New config format (single file):
```json
// ~/.claude-config-switch/claudeEnvConfig.json
{
  "work": { "ANTHROPIC_API_KEY": "...", ... },
  "personal": { "ANTHROPIC_API_KEY": "...", ... }
}
```

## [1.0.0] - 2026-02-08

### Added
- 🎉 Initial release of Claude Config Switch
- Core configuration switching functionality
- Interactive mode with keyboard navigation
- Command-line alias support (work, personal, dev, etc.)
- JSON configuration validation
- Custom pattern and target file support
- Configuration history tracking and rollback
- Configuration difference comparison
- Template generation for new configurations
- Detailed help system and documentation
- Multiple configuration templates (basic, advanced, fast, proxy)
- Integration examples for package.json scripts
- Comprehensive test suite
- ESLint configuration for code quality

### Features
- **Smart Scanning**: Automatically discovers configuration files matching specified patterns
- **Multiple Interfaces**: Both interactive selection and direct command-line usage
- **Safety First**: Automatic backup of existing configurations before switching
- **Validation**: Built-in JSON syntax and structure validation
- **History Management**: Complete audit trail of all configuration changes
- **Comparison Tools**: Visual diff of configuration differences
- **Template System**: Pre-built templates for common use cases
- **Flexible Configuration**: Customizable scanning patterns and target files

### Technical Details
- Built with modern JavaScript (ES Modules)
- Uses yargs for robust command-line parsing
- Leverages prompts for interactive user experience
- Implements comprehensive error handling
- Cross-platform compatibility (Windows, macOS, Linux)
- Zero external runtime dependencies for core functionality

### Documentation
- Complete README with usage examples
- Detailed API documentation
- Troubleshooting guide
- Contribution guidelines
- Integration examples

[1.0.0]: https://github.com/yourusername/claude-config-switch/releases/tag/v1.0.0