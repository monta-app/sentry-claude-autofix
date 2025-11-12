# Claude Context File

This file provides context about the Sentry-Claude Autofix project for AI assistants like Claude.

## Project Overview

**Name**: Sentry-Claude Autofix
**Purpose**: Automatically investigate and propose fixes for production errors tracked in Sentry.io using Claude AI
**Language**: TypeScript
**Runtime**: Node.js 18+
**Organization**: monta-app

## What This System Does

This system creates an automated feedback loop between error monitoring (Sentry) and AI-powered debugging (Claude):

1. Fetches unresolved issues from Sentry API
2. Extracts stack traces, error messages, and context
3. Reads affected source files from the local codebase
4. Sends everything to Claude for root cause analysis
5. Claude proposes specific code fixes with explanations
6. Saves proposals as JSON and Markdown files
7. Optionally comments on Sentry issues with the analysis

## Architecture Components

### Core Modules

- **SentryClient** (`src/sentry-client.ts`) - Sentry API wrapper for fetching issues and events
- **IssueAnalyzer** (`src/issue-analyzer.ts`) - Parses stack traces and extracts context
- **ClaudeAgent** (`src/claude-agent.ts`) - Interfaces with Anthropic's Claude API
- **Orchestrator** (`src/orchestrator.ts`) - Coordinates the entire workflow
- **Config** (`src/config.ts`) - Environment variable management

### Utilities

- **test-connection.ts** - Validates API credentials
- **list-projects.ts** - Discovers available Sentry projects
- **types.ts** - TypeScript type definitions

## Key Design Decisions

### Why TypeScript?
- Type safety for API responses and data structures
- Better IDE support for development
- Easier to maintain and refactor

### Why Sequential Processing?
- Respects API rate limits
- Easier error handling and logging
- Predictable resource usage

### Why Local File Reading?
- Provides Claude with actual source code context
- More accurate analysis than stack traces alone
- Enables specific, actionable fix proposals

### Why JSON + Markdown Output?
- JSON for programmatic processing (future automation)
- Markdown for human review (readability)
- Both formats useful for different workflows

## Data Flow

```
Sentry API → SentryClient → IssueAnalyzer → Orchestrator
                                               ↓
                                         (read files)
                                               ↓
                                          ClaudeAgent → Claude API
                                               ↓
                                        (parse response)
                                               ↓
                                    Save JSON + Markdown
                                               ↓
                                    Comment on Sentry (optional)
```

## Configuration

Required environment variables:
- `SENTRY_AUTH_TOKEN` - API token from Sentry
- `SENTRY_ORG_SLUG` - Organization identifier (e.g., "monta-app")
- `SENTRY_PROJECT_SLUG` - Project identifier
- `ANTHROPIC_API_KEY` - Claude API key
- `CODEBASE_PATH` - Path to the source code being monitored

## Issue Filtering Logic

The system applies intelligent filtering to only process fixable issues:

**Will Process:**
- Issues with clear stack traces
- Errors in application code (not third-party libraries)
- Issues with <10,000 occurrences
- Errors with identifiable file paths

**Will Skip:**
- Third-party library errors (no in-app frames)
- High-frequency issues (likely systemic problems)
- Issues without stack traces
- Errors from unidentifiable sources

## Claude Integration

### Model Used
- `claude-sonnet-4-20250514`
- Max tokens: 4096 for responses
- Provides balance of speed, cost, and quality

### Prompt Structure
1. Task definition (analyze production error)
2. Codebase context (relevant source files)
3. Issue details (stack trace, error message)
4. Expected output format (analysis, changes, confidence)

### Response Parsing
Extracts structured data from Claude's response:
- Root cause analysis
- Proposed file changes with descriptions
- Code snippets for fixes
- Confidence level (high/medium/low)

## Output Format

### JSON File
```json
{
  "issue": {
    "id": "123",
    "shortId": "PROJ-123",
    "title": "TypeError: ...",
    "permalink": "https://..."
  },
  "proposal": {
    "issueId": "123",
    "analysis": "The error occurs because...",
    "proposedChanges": [...],
    "confidence": "high"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Markdown File
Human-readable format with:
- Issue summary and link
- Detailed analysis
- File-by-file change descriptions
- Code snippets
- Confidence assessment

## Common Use Cases

### Manual Review Workflow
1. Run: `npm run dev`
2. Review proposals in `output/` directory
3. Apply fixes manually after validation
4. Test and deploy

### Automated Workflow (Future)
1. System runs on schedule (cron/PM2)
2. Creates PRs with proposed fixes
3. CI/CD runs tests
4. Human reviews and merges

### Triage Assistance
1. System adds comments to Sentry issues
2. Engineers review analysis before investigating
3. Faster root cause identification

## Development Guidelines

### Adding New Features

**To customize issue filtering:**
Edit `shouldAutoFix()` in `src/issue-analyzer.ts:233`

**To adjust Claude's analysis:**
Modify `buildInvestigationPrompt()` in `src/claude-agent.ts:22`

**To add more context:**
Enhance `gatherCodebaseContext()` in `src/orchestrator.ts:124`

### Testing Changes

1. Set `MAX_ISSUES_PER_RUN=1` in `.env`
2. Set `AUTO_COMMENT=false` to avoid Sentry spam
3. Run `npm run dev`
4. Review output in `output/` directory
5. Iterate on prompts/logic

### Code Style

- Use TypeScript strict mode
- Follow ESM module syntax
- Prefer async/await over promises
- Log progress to console for visibility
- Handle errors gracefully

## Known Limitations

1. **No automatic fix application** - Requires manual review and implementation
2. **Single project at a time** - Processes one Sentry project per run
3. **No issue tracking** - Doesn't remember previously analyzed issues
4. **Rate limit handling** - Relies on sequential processing, no retry logic
5. **File path resolution** - May struggle with complex source map configurations

## Future Enhancements

- [ ] Automatic PR creation with fixes
- [ ] Multi-project support
- [ ] Issue state tracking (avoid re-analyzing)
- [ ] Web dashboard for reviewing proposals
- [ ] Integration with GitHub Actions
- [ ] Support for multiple error tracking services
- [ ] Machine learning for issue prioritization
- [ ] Automated testing of proposed fixes

## Dependencies

### Production
- `@anthropic-ai/sdk` - Claude API client
- `axios` - HTTP client for Sentry API
- `dotenv` - Environment variable management

### Development
- `typescript` - Type checking and compilation
- `tsx` - TypeScript execution
- `@types/node` - Node.js type definitions

## Security Considerations

- API tokens stored in `.env` (git-ignored)
- Read-only access to codebase
- All fixes are proposals, not automatic changes
- Sentry tokens should have minimal required scopes
- Review all Claude-proposed changes before applying

## Performance Characteristics

- **Processing time**: ~30-60 seconds per issue
- **API costs**: ~$0.10-0.30 per issue (Claude API)
- **Memory usage**: <100MB typical
- **Network**: Depends on stack trace size and file count

## Troubleshooting Guide

### Issue: "Project does not exist"
- Run `npm run list-projects` to see available projects
- Verify `SENTRY_PROJECT_SLUG` matches output

### Issue: No proposals generated
- Check issue filtering logic in `shouldAutoFix()`
- Verify issues have stack traces
- Ensure source maps are configured in Sentry

### Issue: Poor fix quality
- Add more context in `gatherCodebaseContext()`
- Adjust Claude prompt in `buildInvestigationPrompt()`
- Increase file content limits

## Related Documentation

- [README.md](README.md) - User-facing documentation
- [QUICKSTART.md](QUICKSTART.md) - Setup guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) - Verification checklist

## API References

- [Sentry API Docs](https://docs.sentry.io/api/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude Code Docs](https://docs.claude.com/claude-code)

## Support

For issues or questions:
1. Check the troubleshooting section in README.md
2. Review this file for context
3. Check API documentation
4. Open an issue on GitHub

---

*This file is optimized for AI assistants like Claude to quickly understand the project structure, design decisions, and how to make changes effectively.*
