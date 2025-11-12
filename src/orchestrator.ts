import { SentryClient } from './sentry-client.js';
import { IssueAnalyzer } from './issue-analyzer.js';
import { ClaudeAgent } from './claude-agent.js';
import { IssueContext, FixProposal } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface OrchestratorConfig {
  sentryAuthToken: string;
  sentryOrgSlug: string;
  sentryProjectSlug: string;
  anthropicApiKey: string;
  codebasePath: string;
  maxIssuesPerRun?: number;
  autoComment?: boolean;
  outputDir?: string;
}

export class Orchestrator {
  private sentryClient: SentryClient;
  private issueAnalyzer: IssueAnalyzer;
  private claudeAgent: ClaudeAgent;
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = {
      maxIssuesPerRun: 5,
      autoComment: true,
      outputDir: './output',
      ...config,
    };

    this.sentryClient = new SentryClient(
      config.sentryAuthToken,
      config.sentryOrgSlug
    );
    this.issueAnalyzer = new IssueAnalyzer(this.sentryClient);
    this.claudeAgent = new ClaudeAgent(config.anthropicApiKey);
  }

  /**
   * Main workflow: fetch issues, analyze, and propose fixes
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Sentry-Claude Autofix');
    console.log(`📊 Fetching issues from ${this.config.sentryOrgSlug}/${this.config.sentryProjectSlug}`);

    try {
      // Fetch unresolved issues
      const issues = await this.sentryClient.listProjectIssues(
        this.config.sentryProjectSlug,
        {
          limit: this.config.maxIssuesPerRun,
          query: 'is:unresolved',
        }
      );

      if (issues.length === 0) {
        console.log('✅ No unresolved issues found!');
        return;
      }

      console.log(`📋 Found ${issues.length} unresolved issue(s)`);

      // Process each issue
      for (const issue of issues) {
        await this.processIssue(issue.id);
      }

      console.log('\n✨ Completed processing all issues');
    } catch (error) {
      console.error('❌ Error during orchestration:', error);
      throw error;
    }
  }

  /**
   * Process a single issue: analyze, investigate, and propose fix
   */
  async processIssue(issueId: string): Promise<FixProposal | null> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Processing issue: ${issueId}`);

    try {
      // Step 1: Analyze the issue
      console.log('📊 Analyzing issue...');
      const context = await this.issueAnalyzer.analyzeIssue(issueId);

      console.log(`  - Title: ${context.issue.title}`);
      console.log(`  - Error: ${context.errorType}: ${context.errorMessage}`);
      console.log(`  - Occurrences: ${context.issue.count}`);
      console.log(`  - Affected files: ${context.affectedFiles.length}`);

      // Step 2: Check if we should auto-fix
      if (!this.issueAnalyzer.shouldAutoFix(context)) {
        console.log('⏭️  Skipping - does not meet auto-fix criteria');
        return null;
      }

      // Step 3: Gather codebase context
      console.log('📁 Gathering codebase context...');
      const codebaseContext = await this.gatherCodebaseContext(context);

      // Step 4: Investigate with Claude
      console.log('🤖 Investigating with Claude...');
      const proposal = await this.claudeAgent.investigateAndFix(
        context,
        codebaseContext
      );

      console.log(`  - Confidence: ${proposal.confidence}`);
      console.log(`  - Proposed changes: ${proposal.proposedChanges.length} file(s)`);

      // Step 5: Save the proposal
      await this.saveProposal(context, proposal);

      // Step 6: Add comment to Sentry (if enabled)
      if (this.config.autoComment) {
        try {
          console.log('💬 Adding comment to Sentry...');
          const comment = this.claudeAgent.generateSentryComment(proposal);
          await this.sentryClient.addComment(issueId, comment);
        } catch (error: any) {
          if (error.response?.status === 403) {
            console.log('⚠️  Cannot add comment - insufficient permissions');
            console.log('   To enable comments, add "project:write" scope to your Sentry token');
            console.log('   Or set AUTO_COMMENT=false in your .env file');
          } else {
            console.error('⚠️  Failed to add comment:', error.message);
          }
        }
      }

      console.log('✅ Successfully processed issue');
      return proposal;
    } catch (error) {
      console.error(`❌ Error processing issue ${issueId}:`, error);
      return null;
    }
  }

  /**
   * Gather relevant code context from the codebase
   */
  private async gatherCodebaseContext(context: IssueContext): Promise<string> {
    let codeContext = '## Codebase Context\n\n';

    // Try to read the affected files from the local codebase
    for (const filePath of context.affectedFiles.slice(0, 5)) {
      // Limit to 5 files
      try {
        // Try different path resolutions
        const possiblePaths = [
          path.join(this.config.codebasePath, filePath),
          path.join(this.config.codebasePath, 'src', filePath),
          path.join(this.config.codebasePath, path.basename(filePath)),
        ];

        let fileContent: string | null = null;
        let resolvedPath: string | null = null;

        for (const possiblePath of possiblePaths) {
          try {
            fileContent = await fs.readFile(possiblePath, 'utf-8');
            resolvedPath = possiblePath;
            break;
          } catch {
            // Try next path
            continue;
          }
        }

        if (fileContent && resolvedPath) {
          codeContext += `### File: ${filePath}\n`;
          codeContext += `Path: ${resolvedPath}\n\n`;
          codeContext += '```\n';
          // Limit file size to prevent token overflow
          codeContext += fileContent.slice(0, 5000);
          if (fileContent.length > 5000) {
            codeContext += '\n... (truncated)';
          }
          codeContext += '\n```\n\n';
        } else {
          codeContext += `### File: ${filePath}\n`;
          codeContext += `Could not locate this file in the codebase.\n\n`;
        }
      } catch (error) {
        codeContext += `### File: ${filePath}\n`;
        codeContext += `Error reading file: ${(error as Error).message}\n\n`;
      }
    }

    if (context.affectedFiles.length === 0) {
      codeContext += 'No specific files identified in the stack trace.\n';
    }

    return codeContext;
  }

  /**
   * Save the fix proposal to disk
   */
  private async saveProposal(
    context: IssueContext,
    proposal: FixProposal
  ): Promise<void> {
    const outputDir = this.config.outputDir!;
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${context.issue.shortId}_${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    const output = {
      issue: {
        id: context.issue.id,
        shortId: context.issue.shortId,
        title: context.issue.title,
        permalink: context.issue.permalink,
      },
      proposal,
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(filepath, JSON.stringify(output, null, 2));
    console.log(`💾 Saved proposal to: ${filepath}`);

    // Also save a human-readable markdown version
    const mdFilename = `${context.issue.shortId}_${Date.now()}.md`;
    const mdFilepath = path.join(outputDir, mdFilename);

    let markdown = `# Fix Proposal for ${context.issue.shortId}\n\n`;
    markdown += `**Issue**: ${context.issue.title}\n`;
    markdown += `**Link**: ${context.issue.permalink}\n`;
    markdown += `**Date**: ${new Date().toISOString()}\n\n`;
    markdown += `## Analysis\n\n${proposal.analysis}\n\n`;
    markdown += `## Proposed Changes\n\n`;

    for (const change of proposal.proposedChanges) {
      markdown += `### ${change.file}\n\n`;
      markdown += `${change.description}\n\n`;
      if (change.code) {
        markdown += '```\n' + change.code + '\n```\n\n';
      }
    }

    markdown += `## Confidence\n\n${proposal.confidence}\n`;

    await fs.writeFile(mdFilepath, markdown);
    console.log(`📄 Saved markdown to: ${mdFilepath}`);
  }
}
