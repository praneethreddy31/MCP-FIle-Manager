#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

// **Security**: Define allowed operations and base directory
const ALLOWED_BASE_PATH = process.env.MCP_FILE_BASE_PATH || process.cwd();

class FileManagerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "file-manager",
        version: "0.1.0", // Consider updating version if making significant changes
      },
      {
        capabilities: {
          tools: {}, // Assuming tools are dynamically listed or this is a placeholder
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Server Error]", error); // Differentiated server errors
    };

    process.on("SIGINT", async () => {
      console.log("SIGINT received, shutting down server...");
      await this.server.close();
      process.exit(0);
    });

    // Optional: Handle unhandled promise rejections and uncaught exceptions
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Application specific logging, throwing an error, or other logic here
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.server.close().finally(() => process.exit(1));
    });
  }

  private setupToolHandlers(): void {
    // **List available tools**
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "list_directory",
          description: "List contents of a directory",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Directory path to list (relative to allowed base path)",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "read_file",
          description: "Read contents of a file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path to read (relative to allowed base path)",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "write_file",
          description: "Write content to a file",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "File path to write to (relative to allowed base path)",
              },
              content: {
                type: "string",
                description: "Content to write",
              },
            },
            required: ["path", "content"],
          },
        },
        {
          name: "create_directory",
          description: "Create a new directory",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Directory path to create (relative to allowed base path)",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "delete_item",
          description: "Delete a file or directory",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to delete (file or directory, relative to allowed base path)",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "get_file_info",
          description: "Get information about a file or directory",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description: "Path to get info for (relative to allowed base path)",
              },
            },
            required: ["path"],
          },
        },
      ],
    })); // Make sure this parenthesis closes the setRequestHandler call

    // **Handle tool calls**
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // It's good practice to validate the tool name first
        if (typeof name !== 'string' || !name) {
            throw new Error("Tool name is missing or invalid.");
        }

        switch (name) {
          case "list_directory":
            if (!args || typeof args.path !== 'string') {
              throw new Error("Missing or invalid 'path' argument for list_directory");
            }
            return await this.listDirectory(args.path);
          case "read_file":
            if (!args || typeof args.path !== 'string') {
              throw new Error("Missing or invalid 'path' argument for read_file");
            }
            return await this.readFile(args.path);
          case "write_file":
            if (!args || typeof args.path !== 'string' || typeof args.content !== 'string') {
              throw new Error("Missing or invalid 'path' or 'content' argument for write_file");
            }
            return await this.writeFile(args.path, args.content);
          case "create_directory":
            if (!args || typeof args.path !== 'string') {
              throw new Error("Missing or invalid 'path' argument for create_directory");
            }
            return await this.createDirectory(args.path);
          case "delete_item":
            if (!args || typeof args.path !== 'string') {
              throw new Error("Missing or invalid 'path' argument for delete_item");
            }
            return await this.deleteItem(args.path);
          case "get_file_info":
            if (!args || typeof args.path !== 'string') {
              throw new Error("Missing or invalid 'path' argument for get_file_info");
            }
            return await this.getFileInfo(args.path);
          default:
            // Ensure `name` is a string before using it in the error message
            throw new Error(`Unknown tool: ${String(name)}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Log the error server-side for debugging
        console.error(`[Tool Call Error - ${String(name || 'unknown tool')}]: ${message}`);
        return {
          content: [
            {
              type: "text",
              // Provide a user-friendly error message
              text: `Error processing tool '${String(name || 'unknown tool')}': ${message}`,
            },
          ],
        };
      }
    });
  } 

  // **Security helper**: Validate and resolve paths
  private validatePath(inputPath: string): string {
    if (inputPath.includes("..")) {
    }

    const resolvedPath = path.resolve(ALLOWED_BASE_PATH, inputPath);

    const normalizedAllowedBasePath = path.normalize(ALLOWED_BASE_PATH + path.sep); // Ensure trailing slash for directory comparison
    const normalizedResolvedPath = path.normalize(resolvedPath);

    if (!normalizedResolvedPath.startsWith(normalizedAllowedBasePath) && normalizedResolvedPath !== path.normalize(ALLOWED_BASE_PATH)) {
      throw new Error(`Access denied: Path '${inputPath}' resolves outside the allowed directory.`);
    }

    return resolvedPath;
  }

  // **Tool implementations**
  private async listDirectory(dirPath: string) {
    const safePath = this.validatePath(dirPath);
    const items = await fs.readdir(safePath, { withFileTypes: true });

    const contents = await Promise.all(
      items.map(async (item) => {
        // Construct full path for stat, but be careful not to re-validate here unnecessarily
        // or expose parts of safePath if item.name could somehow be malicious (e.g. "..\..\secret")
        // However, fs.readdir with withFileTypes should give safe names.
        const itemFullPath = path.join(safePath, item.name);
        let stats;
        try {
            stats = await fs.stat(itemFullPath);
        } catch (statError) {
            // Handle cases where a file might be deleted between readdir and stat (race condition)
            console.warn(`Could not stat ${itemFullPath}: ${statError}`);
            return {
                name: item.name,
                type: item.isDirectory() ? "directory" : "file",
                error: "Could not retrieve stats for this item.",
            };
        }
        
        return {
          name: item.name,
          type: item.isDirectory() ? "directory" : "file",
          size: stats.size,
          modified: stats.mtime.toISOString(),
          // Add created time if available and desired
          // created: stats.birthtime.toISOString(), 
        };
      })
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            path: dirPath, // Return the original requested path for context
            contents,
          }, null, 2),
        },
      ],
    };
  }

  private async readFile(filePath: string) {
    const safePath = this.validatePath(filePath);
    // Could add a check here to ensure it's not a directory
    const stats = await fs.stat(safePath);
    if (stats.isDirectory()) {
        throw new Error(`Path '${filePath}' is a directory, not a file.`);
    }
    const content = await fs.readFile(safePath, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }

  private async writeFile(filePath: string, content: string) {
    const safePath = this.validatePath(filePath);
    // Could add a check here to ensure the parent directory exists, or that it's not trying to write to a directory path
    const parentDir = path.dirname(safePath);
    try {
        await fs.access(parentDir); // Check if parent directory exists
    } catch (error) {
        throw new Error(`Parent directory for '${filePath}' does not exist or is not accessible.`);
    }
    // Ensure we're not trying to write a file path that is actually a directory
    try {
        const stats = await fs.stat(safePath);
        if (stats.isDirectory()) {
            throw new Error(`Path '${filePath}' is an existing directory. Cannot overwrite a directory with a file.`);
        }
    } catch (error) {
        // If stat fails, it means the file doesn't exist, which is fine for writing.
        // We only care if it *is* a directory.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error; // Re-throw other stat errors
        }
    }

    await fs.writeFile(safePath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `File written successfully: ${filePath}`,
        },
      ],
    };
  }

  private async createDirectory(dirPath: string) {
    const safePath = this.validatePath(dirPath);
    await fs.mkdir(safePath, { recursive: true }); // recursive: true is convenient but be aware of implications

    return {
      content: [
        {
          type: "text",
          text: `Directory created: ${dirPath}`,
        },
      ],
    };
  }

  private async deleteItem(itemPath: string) {
    const safePath = this.validatePath(itemPath);
    const stats = await fs.stat(safePath); // Check if it exists first

    if (stats.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: false }); // force: false is safer. rm is newer than rmdir.
    } else {
      await fs.unlink(safePath);
    }

    return {
      content: [
        {
          type: "text",
          text: `Deleted: ${itemPath}`,
        },
      ],
    };
  }

  private async getFileInfo(itemPath: string) {
    const safePath = this.validatePath(itemPath);
    const stats = await fs.stat(safePath);

    const info = {
      path: itemPath, // Return the original requested path
      type: stats.isDirectory() ? "directory" : "file",
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
      // Permissions formatting can be platform-specific. (stats.mode & 0o777) is common.
      permissions: (stats.mode & parseInt("777", 8)).toString(8), // POSIX-like permissions
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Use console.info or a dedicated logger for status messages
    console.info("File Manager MCP server running on stdio. Listening for requests...");
  }
}

(async () => {
  try {
    const fileManager = new FileManagerServer(); // Renamed for clarity
    await fileManager.run();
  } catch (error) {
    console.error("Failed to start the File Manager server:", error);
    process.exit(1); // Exit if server fails to start
  }
})();