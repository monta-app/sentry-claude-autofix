import * as fs from 'fs/promises';
import * as path from 'path';
import { FixProposal } from './types.js';

export interface PatchResult {
  file: string;
  success: boolean;
  action: 'created' | 'modified' | 'failed';
  error?: string;
}

export class FilePatcher {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Apply all proposed changes to files
   */
  async applyFixes(proposal: FixProposal): Promise<PatchResult[]> {
    const results: PatchResult[] = [];

    for (const change of proposal.proposedChanges) {
      const result = await this.applyChange(change.file, change.code, change.description);
      results.push(result);
    }

    return results;
  }

  /**
   * Apply a single change to a file
   */
  private async applyChange(
    filePath: string,
    code: string | undefined,
    description: string
  ): Promise<PatchResult> {
    try {
      // Resolve full path
      const fullPath = this.resolveFilePath(filePath);

      // Check if we have actual code to apply
      if (!code || code.trim().length === 0) {
        return {
          file: filePath,
          success: false,
          action: 'failed',
          error: 'No code provided in proposal',
        };
      }

      // Check if file exists
      const fileExists = await this.fileExists(fullPath);

      if (!fileExists) {
        // Create new file
        await this.ensureDirectoryExists(path.dirname(fullPath));
        await fs.writeFile(fullPath, code, 'utf-8');

        return {
          file: filePath,
          success: true,
          action: 'created',
        };
      } else {
        // Read existing file
        const existingContent = await fs.readFile(fullPath, 'utf-8');

        // Apply the change
        const newContent = await this.mergeCode(existingContent, code, description);

        // Write updated file
        await fs.writeFile(fullPath, newContent, 'utf-8');

        return {
          file: filePath,
          success: true,
          action: 'modified',
        };
      }
    } catch (error: any) {
      return {
        file: filePath,
        success: false,
        action: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Merge proposed code with existing file content
   * This is a simple implementation - Claude's code should be complete
   */
  private async mergeCode(
    existing: string,
    proposed: string,
    description: string
  ): Promise<string> {
    // For now, we'll use a simple strategy:
    // If the proposed code looks complete (has imports, exports, etc.), replace entirely
    // Otherwise, try to be smart about it

    // Check if proposed code looks like a complete file
    const looksComplete =
      proposed.includes('import ') ||
      proposed.includes('export ') ||
      proposed.includes('class ') ||
      proposed.includes('function ') ||
      proposed.length > 100;

    if (looksComplete) {
      // Proposed code looks complete, use it as-is
      return proposed;
    }

    // Otherwise, try to find and replace relevant sections
    // This is basic - in a production system, you'd want more sophisticated merging
    return proposed; // For now, just use proposed code
  }

  /**
   * Resolve file path relative to base path
   */
  private resolveFilePath(filePath: string): string {
    // Remove leading slashes
    const cleanPath = filePath.replace(/^\/+/, '');

    // Try different path resolutions
    const possiblePaths = [
      path.join(this.basePath, cleanPath),
      path.join(this.basePath, 'src', cleanPath),
      path.join(this.basePath, cleanPath.replace(/^src\//, '')),
    ];

    // Return first path that exists, or the direct join
    for (const p of possiblePaths) {
      try {
        if (require('fs').existsSync(p)) {
          return p;
        }
      } catch {}
    }

    // Default to direct join
    return path.join(this.basePath, cleanPath);
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Create a backup of a file before modifying
   */
  async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup`;
    await fs.copyFile(filePath, backupPath);
    return backupPath;
  }

  /**
   * Restore a file from backup
   */
  async restoreFromBackup(filePath: string, backupPath: string): Promise<void> {
    await fs.copyFile(backupPath, filePath);
    await fs.unlink(backupPath);
  }
}
