import { SentryClient } from './sentry-client.js';
import {
  SentryIssue,
  SentryEvent,
  IssueContext,
  StackTrace,
  StackFrame,
} from './types.js';

export class IssueAnalyzer {
  constructor(private sentryClient: SentryClient) {}

  /**
   * Extract full context for an issue including stack traces and affected files
   */
  async analyzeIssue(issueId: string): Promise<IssueContext> {
    const issue = await this.sentryClient.getIssueDetails(issueId);
    const latestEvent = await this.sentryClient.getLatestEvent(issueId);

    if (!latestEvent) {
      throw new Error(`No events found for issue ${issueId}`);
    }

    const stackTrace = this.extractStackTrace(latestEvent);
    const affectedFiles = this.extractAffectedFiles(stackTrace, latestEvent);
    const { errorMessage, errorType } = this.extractErrorInfo(issue, latestEvent);

    return {
      issue,
      latestEvent,
      stackTrace,
      affectedFiles,
      errorMessage,
      errorType,
    };
  }

  /**
   * Extract stack trace from event
   */
  private extractStackTrace(event: SentryEvent): StackTrace | undefined {
    // Find the exception entry in the event
    const exceptionEntry = event.entries?.find((entry) => entry.type === 'exception');

    if (!exceptionEntry || !exceptionEntry.data) {
      return undefined;
    }

    // Sentry stores exceptions in a 'values' array
    const exceptions = exceptionEntry.data.values || [];
    if (exceptions.length === 0) {
      return undefined;
    }

    // Get the most recent exception (usually the last one)
    const mainException = exceptions[exceptions.length - 1];
    const stacktrace = mainException.stacktrace;

    if (!stacktrace || !stacktrace.frames) {
      return undefined;
    }

    return {
      frames: stacktrace.frames.map((frame: any) => ({
        filename: frame.filename,
        function: frame.function,
        module: frame.module,
        lineNo: frame.lineNo,
        colNo: frame.colNo,
        absPath: frame.absPath,
        context: frame.context,
        vars: frame.vars,
        inApp: frame.inApp,
      })),
    };
  }

  /**
   * Extract affected file paths from stack trace and event
   */
  private extractAffectedFiles(
    stackTrace: StackTrace | undefined,
    event: SentryEvent
  ): string[] {
    const files = new Set<string>();

    // Extract from stack trace
    if (stackTrace) {
      for (const frame of stackTrace.frames) {
        // Prioritize in-app frames
        if (frame.inApp && frame.filename) {
          files.add(frame.filename);
        } else if (frame.absPath) {
          files.add(frame.absPath);
        } else if (frame.filename) {
          files.add(frame.filename);
        }
      }
    }

    // Extract from metadata
    if (event.entries) {
      for (const entry of event.entries) {
        if (entry.type === 'exception' && entry.data?.values) {
          for (const exception of entry.data.values) {
            if (exception.stacktrace?.frames) {
              for (const frame of exception.stacktrace.frames) {
                if (frame.inApp && frame.filename) {
                  files.add(frame.filename);
                }
              }
            }
          }
        }
      }
    }

    return Array.from(files);
  }

  /**
   * Extract error message and type
   */
  private extractErrorInfo(
    issue: SentryIssue,
    event: SentryEvent
  ): { errorMessage: string; errorType: string } {
    let errorMessage = issue.title || issue.metadata?.value || 'Unknown error';
    let errorType = issue.metadata?.type || issue.level || 'error';

    // Try to get more detailed error info from the event
    const exceptionEntry = event.entries?.find((entry) => entry.type === 'exception');

    if (exceptionEntry?.data?.values) {
      const mainException = exceptionEntry.data.values[exceptionEntry.data.values.length - 1];
      if (mainException) {
        errorType = mainException.type || errorType;
        errorMessage = mainException.value || errorMessage;
      }
    }

    return { errorMessage, errorType };
  }

  /**
   * Format the issue context into a readable prompt for Claude
   */
  formatContextForClaude(context: IssueContext): string {
    let prompt = `# Sentry Issue Analysis\n\n`;
    prompt += `## Issue Details\n`;
    prompt += `- **ID**: ${context.issue.shortId}\n`;
    prompt += `- **Title**: ${context.issue.title}\n`;
    prompt += `- **Error Type**: ${context.errorType}\n`;
    prompt += `- **Error Message**: ${context.errorMessage}\n`;
    prompt += `- **First Seen**: ${context.issue.firstSeen}\n`;
    prompt += `- **Last Seen**: ${context.issue.lastSeen}\n`;
    prompt += `- **Occurrences**: ${context.issue.count}\n`;
    prompt += `- **Affected Users**: ${context.issue.userCount}\n`;
    prompt += `- **Sentry Link**: ${context.issue.permalink}\n\n`;

    if (context.stackTrace && context.stackTrace.frames.length > 0) {
      prompt += `## Stack Trace\n\n`;
      // Show frames in reverse order (most recent first)
      const frames = [...context.stackTrace.frames].reverse();

      for (let i = 0; i < Math.min(frames.length, 10); i++) {
        const frame = frames[i];
        prompt += `### Frame ${i + 1}${frame.inApp ? ' (In App)' : ''}\n`;
        prompt += `- **File**: ${frame.filename || frame.absPath || 'unknown'}\n`;
        prompt += `- **Function**: ${frame.function || 'anonymous'}\n`;
        if (frame.lineNo) {
          prompt += `- **Line**: ${frame.lineNo}${frame.colNo ? `:${frame.colNo}` : ''}\n`;
        }

        if (frame.context && frame.context.length > 0) {
          prompt += `\n**Code Context**:\n\`\`\`\n`;
          for (const [lineNo, code] of frame.context) {
            const marker = lineNo === frame.lineNo ? '>' : ' ';
            prompt += `${marker} ${lineNo}: ${code}\n`;
          }
          prompt += `\`\`\`\n`;
        }

        if (frame.vars && Object.keys(frame.vars).length > 0) {
          prompt += `\n**Variables**:\n`;
          for (const [varName, varValue] of Object.entries(frame.vars)) {
            prompt += `- ${varName}: ${JSON.stringify(varValue)}\n`;
          }
        }

        prompt += `\n`;
      }
    }

    if (context.affectedFiles.length > 0) {
      prompt += `## Affected Files\n\n`;
      for (const file of context.affectedFiles) {
        prompt += `- ${file}\n`;
      }
      prompt += `\n`;
    }

    if (context.latestEvent.tags && context.latestEvent.tags.length > 0) {
      prompt += `## Tags\n\n`;
      for (const tag of context.latestEvent.tags) {
        prompt += `- **${tag.key}**: ${tag.value}\n`;
      }
      prompt += `\n`;
    }

    return prompt;
  }

  /**
   * Determine if an issue should be auto-fixed based on criteria
   */
  shouldAutoFix(context: IssueContext): boolean {
    // Don't auto-fix if no stack trace is available
    if (!context.stackTrace || context.stackTrace.frames.length === 0) {
      return false;
    }

    // Don't auto-fix if no in-app frames
    const hasInAppFrames = context.stackTrace.frames.some((frame) => frame.inApp);
    if (!hasInAppFrames) {
      return false;
    }

    // Don't auto-fix if too many occurrences (might indicate a complex issue)
    const occurrences = parseInt(context.issue.count, 10);
    if (occurrences > 10000) {
      return false;
    }

    return true;
  }
}
