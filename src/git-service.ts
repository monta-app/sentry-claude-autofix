import { execSync } from 'child_process';
import * as path from 'path';

export interface GitConfig {
  repoPath: string;
  baseBranch?: string;
}

export class GitService {
  private repoPath: string;
  private baseBranch: string;

  constructor(config: GitConfig) {
    this.repoPath = config.repoPath;
    this.baseBranch = config.baseBranch || 'main';
  }

  /**
   * Execute git command in the repository
   */
  private exec(command: string): string {
    try {
      return execSync(command, {
        cwd: this.repoPath,
        encoding: 'utf-8',
      }).trim();
    } catch (error: any) {
      throw new Error(`Git command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Check if directory is a git repository
   */
  isGitRepo(): boolean {
    try {
      this.exec('git rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch name
   */
  getCurrentBranch(): string {
    return this.exec('git branch --show-current');
  }

  /**
   * Check if there are uncommitted changes
   */
  hasUncommittedChanges(): boolean {
    const status = this.exec('git status --porcelain');
    return status.length > 0;
  }

  /**
   * Create and checkout a new branch
   */
  createBranch(branchName: string): void {
    // Ensure we're on base branch and up to date
    const currentBranch = this.getCurrentBranch();
    if (currentBranch !== this.baseBranch) {
      this.exec(`git checkout ${this.baseBranch}`);
    }

    // Pull latest changes
    try {
      this.exec(`git pull origin ${this.baseBranch}`);
    } catch (error) {
      console.warn('Warning: Could not pull latest changes from origin');
    }

    // Create and checkout new branch
    this.exec(`git checkout -b ${branchName}`);
  }

  /**
   * Stage specific files
   */
  stageFiles(files: string[]): void {
    for (const file of files) {
      try {
        this.exec(`git add "${file}"`);
      } catch (error) {
        console.warn(`Warning: Could not stage file: ${file}`);
      }
    }
  }

  /**
   * Create a commit with message
   */
  commit(message: string): void {
    // Write message to temp file to handle multiline messages
    const messageFile = path.join(this.repoPath, '.git', 'COMMIT_MSG_TMP');
    const fs = require('fs');
    fs.writeFileSync(messageFile, message);

    try {
      this.exec(`git commit -F "${messageFile}"`);
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(messageFile);
      } catch {}
    }
  }

  /**
   * Push branch to remote
   */
  pushBranch(branchName: string): void {
    this.exec(`git push -u origin ${branchName}`);
  }

  /**
   * Delete local branch
   */
  deleteBranch(branchName: string, force: boolean = false): void {
    const flag = force ? '-D' : '-d';
    this.exec(`git branch ${flag} ${branchName}`);
  }

  /**
   * Switch back to base branch
   */
  returnToBaseBranch(): void {
    this.exec(`git checkout ${this.baseBranch}`);
  }

  /**
   * Get the remote repository URL
   */
  getRemoteUrl(): string {
    return this.exec('git config --get remote.origin.url');
  }

  /**
   * Parse GitHub owner and repo from remote URL
   */
  parseGitHubRepo(): { owner: string; repo: string } | null {
    try {
      const remoteUrl = this.getRemoteUrl();

      // Handle SSH URLs: git@github.com:owner/repo.git
      let match = remoteUrl.match(/git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }

      // Handle HTTPS URLs: https://github.com/owner/repo.git
      match = remoteUrl.match(/https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if branch exists locally
   */
  branchExists(branchName: string): boolean {
    try {
      this.exec(`git rev-parse --verify ${branchName}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get diff for staged changes
   */
  getStagedDiff(): string {
    return this.exec('git diff --cached');
  }
}
