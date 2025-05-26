# MCP File Manager

A Model Context Protocol (MCP) server that provides AI assistants with secure file system access and management capabilities.

## Features

- 📁 Directory Operations: List directory contents with file details
- 📄 File Reading: Read text file contents
- ✍️ File Writing: Create and write files with specified content  
- 📂 Directory Creation: Create new directories (with recursive support)
- 🗑️ File/Directory Deletion: Remove files and directories
- ℹ️ File Information: Get detailed metadata about files and directories
- 🔒 Security: Path validation to prevent directory traversal attacks

## Prerequisites

- Node.js (version 16 or higher)
- NPM (comes with Node.js)
- Claude Desktop (version 0.7.0 or higher) or other MCP-compatible AI client

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mcp-file-manager.git
cd mcp-file-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Project
```bash
npm run build
```

### 4. Verify Installation
```bash
npm start
```
You should see: `File Manager MCP server running on stdio`

## Configuration

### Claude Desktop Setup

1. Locate Claude Desktop config directory:
   - Windows: `%APPDATA%\Claude\`
   - macOS: `~/Library/Application Support/Claude/`
   - Linux: `~/.config/claude/`

2. Create or edit `claude_desktop_config.json`:

#### Windows:
```json
{
  "mcpServers": {
    "file-manager": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-file-manager\\dist\\index.js"],
      "env": {
        "MCP_FILE_BASE_PATH": "C:\\Users\\YourUsername\\Documents"
      }
    }
  }
}
```

#### macOS/Linux:
```json
{
  "mcpServers": {
    "file-manager": {
      "command": "node", 
      "args": ["/path/to/mcp-file-manager/dist/index.js"],
      "env": {
        "MCP_FILE_BASE_PATH": "/Users/yourusername/Documents"
      }
    }
  }
}
```

3. Restart Claude Desktop completely

## Usage Examples

Once configured, you can interact with your file system through Claude:

### Basic File Operations

List files:
```
Can you list the files in my Documents folder?
```

Read a file:
```
Read the contents of my notes.txt file
```

Create a file:
```
Create a file called "todo.md" with a sample to-do list
```

Get file information:
```
What's the size and modification date of my README.md file?
```

### Advanced Operations

Organize files:
```
Can you help me organize my Downloads folder by creating subdirectories for different file types and moving files accordingly?
```

Content analysis:
```
Read all the .txt files in my project folder and summarize their contents
```

Batch operations:
```
Create a backup directory and copy all my important documents there
```

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_directory` | List contents of a directory | `path`: Directory path to list |
| `read_file` | Read contents of a text file | `path`: File path to read |
| `write_file` | Write content to a file | `path`: File path, `content`: Content to write |
| `create_directory` | Create a new directory | `path`: Directory path to create |
| `delete_item` | Delete a file or directory | `path`: Path to delete |
| `get_file_info` | Get file/directory metadata | `path`: Path to analyze |

## Security Features

- Path Validation: All file operations are restricted to the configured base directory
- Directory Traversal Protection: Prevents access to files outside allowed directories  
- Type Checking: Input validation on all parameters
- Error Handling: Graceful error handling for file system operations

## Development

### Project Structure
```
mcp-file-manager/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the MCP server
- `npm run dev` - Run with ts-node for development

### Testing with MCP Inspector
```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test your server
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

### Common Issues

❌ "Module not found" error
- Run `npm run build` to compile TypeScript
- Check that `dist/index.js` exists

❌ "Command not found: node"  
- Install Node.js from [nodejs.org](https://nodejs.org)
- Ensure Node.js is in your system PATH

❌ Claude says "I don't have access to file system"
- Check Claude Desktop version (requires 0.7.0+)
- Verify config file location and syntax
- Restart Claude Desktop completely
- Check config file is named `.json` not `.json.txt`

❌ "Access denied" or "Path outside allowed directory"
- Check `MCP_FILE_BASE_PATH` is set correctly
- Ensure the target directory exists and is writable
- Use absolute paths in configuration

❌ "Permission denied" errors
- Run command prompt as Administrator (Windows)
- Check file/directory permissions
- Ensure antivirus isn't blocking file operations

### Debugging Steps

1. Test server independently:
   ```bash
   node dist/index.js
   ```

2. Check configuration:
   ```bash
   # Windows
   type "%APPDATA%\Claude\claude_desktop_config.json"
   
   # macOS/Linux  
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. Verify paths:
   - Ensure all paths in config are absolute
   - Check that files/directories exist
   - Use forward slashes `/` or double backslashes `\\` on Windows

4. Check Claude Desktop logs:
   - Look for MCP-related error messages
   - Check server startup logs

## Step-by-Step Windows Setup Guide

### 1. Prerequisites Setup
```cmd
# Check Node.js installation
node --version
npm --version

# If not installed, download from nodejs.org
```

### 2. Project Creation
```cmd
# Create project directory
mkdir C:\mcp-projects\mcp-file-manager
cd C:\mcp-projects\mcp-file-manager

# Initialize project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/node ts-node
```

### 3. TypeScript Configuration
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src//*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Package.json Configuration
```json
{
  "name": "mcp-file-manager",
  "version": "1.0.0",
  "description": "MCP server for file management operations",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node --esm src/index.ts"
  },
  "bin": {
    "mcp-file-manager": "./dist/index.js"
  },
  "keywords": ["mcp", "file-manager", "ai"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### 5. Build and Test
```cmd
# Build the project
npm run build

# Test the server
npm start
```

### 6. Claude Desktop Configuration (Windows)
```cmd
# Create Claude configuration directory
mkdir "%APPDATA%\Claude"

# Create configuration file
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

Add configuration content:
```json
{
  "mcpServers": {
    "file-manager": {
      "command": "node",
      "args": ["C:\\mcp-projects\\mcp-file-manager\\dist\\index.js"],
      "env": {
        "MCP_FILE_BASE_PATH": "C:\\Users\\YourUsername\\Documents"
      }
    }
  }
}
```

### 7. Testing Commands
Once configured, test with these Claude commands:
- "Can you list the files in my Documents folder?"
- "Create a file called 'test.txt' with content 'Hello MCP!'"
- "Read the contents of test.txt"
- "What's the file information for test.txt?"

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable  
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a Pull Request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0
- Initial release
- Basic file operations (read, write, list, delete)
- Directory management
- Security features
- Claude Desktop integration

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with:
   - Operating system and version
   - Node.js version (`node --version`)
   - Claude Desktop version
   - Exact error messages
   - Steps to reproduce

## Roadmap

- [ ] File search functionality
- [ ] File watching/monitoring
- [ ] Binary file support
- [ ] File metadata extraction
- [ ] Batch operations
- [ ] Integration with cloud storage services
- [ ] File encryption/decryption
- [ ] Version control integration

## Author

Created as a beginner-friendly MCP project tutorial. Perfect for learning Model Context Protocol development and AI-assisted file management.
```
