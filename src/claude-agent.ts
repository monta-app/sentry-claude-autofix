import Anthropic from '@anthropic-ai/sdk';
import { IssueContext, FixProposal } from './types.js';

export class ClaudeAgent {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Analyze an issue and propose a fix using Claude
   */
  async investigateAndFix(
    issueContext: IssueContext,
    codebaseContext: string
  ): Promise<FixProposal> {
    const prompt = this.buildInvestigationPrompt(issueContext, codebaseContext);

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      return this.parseResponse(response, issueContext.issue.id);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  /**
   * Build the investigation prompt for Claude
   */
  private buildInvestigationPrompt(
    issueContext: IssueContext,
    codebaseContext: string
  ): string {
    return `You are a senior software engineer investigating a production error from Sentry.

${codebaseContext}

Your task is to:
1. Analyze the error and stack trace
2. Identify the root cause
3. Propose a specific fix with code changes
4. Assess your confidence in the fix

IMPORTANT: Please provide your response in EXACTLY this format:

## Analysis
[Your detailed analysis of the error, including root cause. Be thorough and explain the problem clearly.]

## Proposed Changes

### File: [exact/path/to/file.ext]
**Description**: [Detailed description of what needs to be changed and why. Be specific about the changes needed.]

**Code**:
\`\`\`javascript
// Your proposed code fix here
// Include enough context to show what should be changed
\`\`\`

[Repeat the above pattern for each file that needs changes]

## Confidence
[high/medium/low] - [Brief explanation of your confidence level]

---

Here is the Sentry issue information:

${this.formatIssueContext(issueContext)}`;
  }

  /**
   * Format issue context for the prompt
   */
  private formatIssueContext(context: IssueContext): string {
    let formatted = `## Issue Details\n`;
    formatted += `- **Title**: ${context.issue.title}\n`;
    formatted += `- **Error Type**: ${context.errorType}\n`;
    formatted += `- **Error Message**: ${context.errorMessage}\n`;
    formatted += `- **Occurrences**: ${context.issue.count}\n`;
    formatted += `- **Link**: ${context.issue.permalink}\n\n`;

    if (context.stackTrace && context.stackTrace.frames.length > 0) {
      formatted += `## Stack Trace (most recent frames first)\n\n`;
      const frames = [...context.stackTrace.frames].reverse();

      for (let i = 0; i < Math.min(frames.length, 15); i++) {
        const frame = frames[i];
        formatted += `**Frame ${i + 1}**${frame.inApp ? ' (In App)' : ''}\n`;
        formatted += `- File: ${frame.filename || frame.absPath || 'unknown'}\n`;
        formatted += `- Function: ${frame.function || 'anonymous'}\n`;
        if (frame.lineNo) {
          formatted += `- Line: ${frame.lineNo}${frame.colNo ? `:${frame.colNo}` : ''}\n`;
        }

        if (frame.context && frame.context.length > 0) {
          formatted += `\nCode:\n\`\`\`\n`;
          for (const [lineNo, code] of frame.context) {
            const marker = lineNo === frame.lineNo ? '>' : ' ';
            formatted += `${marker} ${lineNo}: ${code}\n`;
          }
          formatted += `\`\`\`\n`;
        }
        formatted += `\n`;
      }
    }

    return formatted;
  }

  /**
   * Parse Claude's response into a structured FixProposal
   */
  private parseResponse(response: string, issueId: string): FixProposal {
    // Extract analysis section
    const analysisMatch = response.match(/## Analysis\s+([\s\S]*?)(?=## Proposed Changes|$)/);
    const analysis = analysisMatch ? analysisMatch[1].trim() : response;

    // Extract proposed changes section
    const proposedChangesSection = response.match(/## Proposed Changes\s+([\s\S]*?)(?=## Confidence|$)/);
    const proposedChanges: FixProposal['proposedChanges'] = [];

    if (proposedChangesSection) {
      const changesText = proposedChangesSection[1];

      // Split by ### File: or ### to find file sections
      const fileSections = changesText.split(/(?=### )/);

      for (const section of fileSections) {
        if (!section.trim()) continue;

        // Extract filename - try multiple patterns
        const fileMatch = section.match(/### (?:File: )?(.+?)$/m);
        if (!fileMatch) continue;

        const filename = fileMatch[1].trim();

        // Extract description - look for Description: or just text after filename
        let description = '';
        const descMatch = section.match(/\*\*Description\*\*:\s*(.+?)(?=\*\*Code\*\*:|```|$)/s);
        if (descMatch) {
          description = descMatch[1].trim();
        } else {
          // Try to get any text between the filename and code block
          const textMatch = section.match(/### (?:File: )?.+?\n+(.+?)(?=```|$)/s);
          if (textMatch) {
            description = textMatch[1].trim();
          }
        }

        // Extract code - look for code blocks
        let code: string | undefined;
        const codeMatch = section.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          code = codeMatch[1].trim();
        }

        proposedChanges.push({
          file: filename,
          description: description || 'See analysis above',
          code,
        });
      }
    }

    // Extract confidence
    const confidenceMatch = response.match(/## Confidence\s*\n*\s*(high|medium|low)/i);
    let confidence: FixProposal['confidence'] = 'medium';
    if (confidenceMatch) {
      confidence = confidenceMatch[1].toLowerCase() as FixProposal['confidence'];
    }

    return {
      issueId,
      analysis,
      proposedChanges,
      confidence,
    };
  }

  /**
   * Generate a summary comment for Sentry
   */
  generateSentryComment(proposal: FixProposal): string {
    let comment = `## Automated Investigation by Claude\n\n`;
    comment += `**Analysis:**\n${proposal.analysis}\n\n`;

    if (proposal.proposedChanges.length > 0) {
      comment += `**Proposed Changes:**\n`;
      for (const change of proposal.proposedChanges) {
        comment += `- ${change.file}: ${change.description}\n`;
      }
      comment += `\n`;
    }

    comment += `**Confidence:** ${proposal.confidence}\n\n`;
    comment += `*This analysis was automatically generated. Please review carefully before applying changes.*`;

    return comment;
  }
}
