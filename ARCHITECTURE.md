# System Architecture

## Overview

The Sentry-Claude Autofix system consists of several components that work together to automatically investigate and propose fixes for Sentry issues.

## Components

### 1. Sentry Client (`src/sentry-client.ts`)

**Responsibilities:**
- Authenticate with Sentry API
- Fetch unresolved issues from a project
- Retrieve detailed event information
- Post comments back to Sentry

**Key Methods:**
- `listProjectIssues()`: Get unresolved issues
- `getIssueDetails()`: Get full issue information
- `getLatestEvent()`: Get the most recent occurrence
- `getEventDetails()`: Get detailed stack traces and context
- `addComment()`: Post analysis back to Sentry

### 2. Issue Analyzer (`src/issue-analyzer.ts`)

**Responsibilities:**
- Extract meaningful context from Sentry issues
- Parse stack traces
- Identify affected files
- Determine if an issue should be auto-fixed

**Key Methods:**
- `analyzeIssue()`: Main analysis entry point
- `extractStackTrace()`: Parse stack trace from event data
- `extractAffectedFiles()`: Identify files involved in the error
- `formatContextForClaude()`: Create a readable summary
- `shouldAutoFix()`: Apply filtering criteria

**Filtering Criteria:**
- Must have a valid stack trace
- Must have in-app (not third-party) frames
- Must have fewer than 10,000 occurrences
- Must have identifiable file paths

### 3. Claude Agent (`src/claude-agent.ts`)

**Responsibilities:**
- Interface with Anthropic's Claude API
- Build investigation prompts
- Parse Claude's responses into structured proposals

**Key Methods:**
- `investigateAndFix()`: Send issue context to Claude
- `buildInvestigationPrompt()`: Create the analysis prompt
- `parseResponse()`: Extract structured data from Claude's response
- `generateSentryComment()`: Format a comment for Sentry

**Claude Model:**
- Uses `claude-sonnet-4-20250514`
- Max tokens: 4096 for responses
- Provides high-quality code analysis

### 4. Orchestrator (`src/orchestrator.ts`)

**Responsibilities:**
- Coordinate the entire workflow
- Manage configuration
- Read local codebase files
- Save proposals to disk

**Key Methods:**
- `run()`: Main execution loop
- `processIssue()`: Handle a single issue
- `gatherCodebaseContext()`: Read affected files from disk
- `saveProposal()`: Write JSON and Markdown outputs

**Workflow:**
1. Fetch unresolved issues from Sentry
2. For each issue:
   - Analyze with Issue Analyzer
   - Check if it should be auto-fixed
   - Read affected files from codebase
   - Send to Claude for investigation
   - Save the proposal
   - Comment on Sentry (if enabled)

### 5. Configuration (`src/config.ts`)

**Responsibilities:**
- Load environment variables
- Validate configuration
- Provide typed config object

**Environment Variables:**
- Required: Sentry auth, org, project, Anthropic key
- Optional: Codebase path, limits, output settings

### 6. Main Entry Point (`src/index.ts`)

**Responsibilities:**
- CLI interface
- Error handling
- Execution flow control

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         START                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  Load Config   │
                │  (.env file)   │
                └────────┬───────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Sentry Client               │
         │   - Authenticate              │
         │   - Fetch unresolved issues   │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │   Issue Analyzer              │
         │   - Parse stack traces        │
         │   - Extract affected files    │
         │   - Apply filtering           │
         └───────────┬───────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │  Should auto-   │───── No ───▶ Skip Issue
           │  fix?           │
           └────────┬────────┘
                    │ Yes
                    ▼
         ┌───────────────────────────────┐
         │   Orchestrator                │
         │   - Read affected files       │
         │   - Build context             │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │   Claude Agent                │
         │   - Send to Claude API        │
         │   - Parse response            │
         │   - Generate proposal         │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────────────┐
         │   Save Outputs                │
         │   - JSON file                 │
         │   - Markdown file             │
         └───────────┬───────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │  Auto-comment   │───── No ───▶ Done
           │  enabled?       │
           └────────┬────────┘
                    │ Yes
                    ▼
         ┌───────────────────────────────┐
         │   Sentry Client               │
         │   - Post comment to issue     │
         └───────────┬───────────────────┘
                     │
                     ▼
                  ┌──────┐
                  │ DONE │
                  └──────┘
```

## File Structure

```
sentry-claude/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration loader
│   ├── types.ts              # TypeScript interfaces
│   ├── sentry-client.ts      # Sentry API client
│   ├── issue-analyzer.ts     # Issue analysis logic
│   ├── claude-agent.ts       # Claude API integration
│   ├── orchestrator.ts       # Workflow coordination
│   └── test-connection.ts    # Connection test utility
├── output/                   # Generated proposals (git-ignored)
├── dist/                     # Compiled JavaScript (git-ignored)
├── .env                      # Environment variables (git-ignored)
├── .env.example              # Example configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Full documentation
├── QUICKSTART.md             # Quick start guide
└── ARCHITECTURE.md           # This file
```

## Type Definitions

### Core Types (`src/types.ts`)

- **SentryIssue**: Sentry issue metadata
- **SentryEvent**: Individual error occurrence
- **StackFrame**: Single frame in a stack trace
- **StackTrace**: Complete stack trace
- **IssueContext**: All context for an issue
- **FixProposal**: Claude's proposed fix

## Error Handling

### Sentry API Errors
- Network errors: Logged and propagated
- Authentication errors: Clear error message
- Rate limits: Handled by sequential processing

### Claude API Errors
- Rate limits: Caught and logged
- Invalid responses: Parsed with fallbacks
- Network errors: Logged and continue to next issue

### File System Errors
- Missing files: Noted in context, doesn't stop analysis
- Permission errors: Logged and skipped
- Invalid paths: Try multiple resolution strategies

## Security Considerations

### API Keys
- Stored in `.env` (git-ignored)
- Never logged or exposed
- Validated on startup

### Code Reading
- Only reads files in configured `CODEBASE_PATH`
- No write access to codebase (only reads)
- All changes are proposals, not automatic

### Sentry Comments
- Clearly marked as automated
- Include confidence levels
- Encourage manual review

## Performance

### Rate Limiting
- Sequential issue processing (not parallel)
- Configurable max issues per run
- No built-in rate limit handling (rely on API responses)

### Token Usage
- Stack traces limited to 10 frames for Claude
- File content limited to 5000 characters per file
- Max 5 files per issue

### Caching
- No caching (stateless design)
- Each run fetches fresh data
- Proposals saved to disk for review

## Extension Points

### Custom Filtering
Modify `shouldAutoFix()` in [src/issue-analyzer.ts:233](src/issue-analyzer.ts#L233):

```typescript
shouldAutoFix(context: IssueContext): boolean {
  // Add custom logic
  if (context.issue.level === 'warning') return false;
  return true;
}
```

### Custom Context
Enhance `gatherCodebaseContext()` in [src/orchestrator.ts:124](src/orchestrator.ts#L124):

```typescript
private async gatherCodebaseContext(context: IssueContext): Promise<string> {
  // Add test files, configs, etc.
}
```

### Custom Prompts
Modify `buildInvestigationPrompt()` in [src/claude-agent.ts:22](src/claude-agent.ts#L22):

```typescript
private buildInvestigationPrompt(issueContext, codebaseContext): string {
  // Customize the prompt sent to Claude
}
```

## Testing Strategy

### Connection Test
```bash
npm run test:connection
```
Verifies:
- Sentry API authentication
- Claude API authentication
- Basic API functionality

### Manual Testing
1. Set `MAX_ISSUES_PER_RUN=1`
2. Run on a known simple issue
3. Review the proposal quality
4. Iterate on prompts/filters

### Production Testing
1. Start with low volume
2. Monitor API costs
3. Review proposal quality
4. Adjust filters as needed

## Monitoring

### Logs
- Console output shows progress
- Errors logged with context
- Per-issue status updates

### Outputs
- JSON files for programmatic analysis
- Markdown files for human review
- Timestamped for historical tracking

### Metrics to Track
- Issues processed per run
- Fix proposal quality
- Confidence score distribution
- API costs (Anthropic)
- Processing time per issue

## Future Enhancements

### Short Term
- [ ] Better error recovery
- [ ] Retry logic for API failures
- [ ] Progress persistence between runs
- [ ] Better file path resolution

### Medium Term
- [ ] Parallel issue processing
- [ ] Web dashboard for proposals
- [ ] Integration with GitHub for PRs
- [ ] Support for multiple projects

### Long Term
- [ ] Machine learning for issue prioritization
- [ ] Automated testing of fixes
- [ ] Integration with CI/CD
- [ ] Support for other error tracking services
