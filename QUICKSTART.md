# Quick Start Guide

Get up and running with Sentry-Claude Autofix in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your API Keys

### Sentry Auth Token

1. Go to https://monta-app.sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Give it a name like "Claude Autofix"
4. Select these scopes:
   - `project:read`
   - `event:read`
   - `org:read`
   - `project:write` (if you want to add comments)
5. Copy the token (starts with `sntrys_`)

### Anthropic API Key

1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Give it a name like "Sentry Autofix"
4. Copy the key (starts with `sk-ant-`)

### Find Your Project Slug

1. Go to your Sentry project: https://monta-app.sentry.io/issues/
2. Look at the URL - it should be like: `https://monta-app.sentry.io/projects/YOUR-PROJECT-SLUG/`
3. Copy the project slug

## Step 3: Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```bash
# Sentry Configuration
SENTRY_AUTH_TOKEN=sntrys_YOUR_TOKEN_HERE
SENTRY_ORG_SLUG=monta-app
SENTRY_PROJECT_SLUG=YOUR_PROJECT_SLUG

# Claude Configuration
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE

# Optional Configuration
CODEBASE_PATH=/path/to/your/codebase
MAX_ISSUES_PER_RUN=5
AUTO_COMMENT=true
OUTPUT_DIR=./output
```

**Important**: Set `CODEBASE_PATH` to the root directory of the codebase that Sentry is monitoring. This allows Claude to read the actual source files.

## Step 4: Run It

```bash
npm run dev
```

You should see output like:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔧 Sentry-Claude Autofix                               ║
║   Automatically investigate and fix Sentry issues        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✅ Configuration validated
   - Sentry Org: monta-app
   - Sentry Project: your-project
   - Codebase Path: /path/to/codebase
   - Max Issues: 5
   - Auto Comment: true
   - Output Dir: ./output

🚀 Starting Sentry-Claude Autofix
📊 Fetching issues from monta-app/your-project
📋 Found 3 unresolved issue(s)

============================================================
🔍 Processing issue: PROJ-123
📊 Analyzing issue...
  - Title: TypeError: Cannot read property 'name' of undefined
  - Error: TypeError: Cannot read property 'name' of undefined
  - Occurrences: 42
  - Affected files: 2
📁 Gathering codebase context...
🤖 Investigating with Claude...
  - Confidence: high
  - Proposed changes: 1 file(s)
💾 Saved proposal to: ./output/PROJ-123_1234567890.json
📄 Saved markdown to: ./output/PROJ-123_1234567890.md
💬 Adding comment to Sentry...
✅ Successfully processed issue
```

## Step 5: Review the Proposals

Check the `output/` directory for the generated proposals:

```bash
ls -la output/
```

Open the markdown files to review the analysis and proposed fixes:

```bash
cat output/PROJ-123_*.md
```

## Step 6: Apply Fixes (Manual)

Review each proposal carefully and apply the fixes manually to your codebase.

**Important**: Always review fixes before applying them. Claude is helpful but not infallible!

## Next Steps

- Read the full [README.md](README.md) for more details
- Customize issue filtering in `src/issue-analyzer.ts`
- Set up automated runs with cron or PM2
- Integrate with your CI/CD pipeline

## Troubleshooting

### No issues found
- Check that you have unresolved issues in Sentry
- Verify your project slug is correct

### "Could not locate this file"
- Make sure `CODEBASE_PATH` points to the correct directory
- Check that your Sentry source maps are configured correctly

### Rate limit errors
- Reduce `MAX_ISSUES_PER_RUN`
- Add delays between runs
- Check your API quotas

### "Missing required environment variables"
- Double-check your `.env` file
- Make sure all required variables are set
- Don't add quotes around values

## Tips

1. **Start Small**: Set `MAX_ISSUES_PER_RUN=1` for your first run
2. **Test with Simple Issues**: Start with simpler errors to validate the system
3. **Review Everything**: Always review proposals before applying fixes
4. **Monitor Costs**: Claude API calls cost money - monitor your usage
5. **Iterate**: Improve the prompts and filtering based on results

## Example Workflow

1. Run the tool: `npm run dev`
2. Review proposals in `output/` directory
3. Apply fixes to your codebase
4. Test the fixes locally
5. Create a PR with the changes
6. Mark issues as resolved in Sentry after deployment

Happy bug fixing! 🐛✨
