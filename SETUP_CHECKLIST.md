# Setup Checklist

Use this checklist to ensure your Sentry-Claude Autofix system is properly configured.

## Prerequisites

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Access to Sentry.io instance (https://monta-app.sentry.io)
- [ ] Anthropic API account with credits
- [ ] Git repository with the codebase being monitored

## Installation Steps

### 1. Clone and Install

- [ ] Clone/download this repository
- [ ] Navigate to project directory: `cd sentry-claude`
- [ ] Install dependencies: `npm install`
- [ ] Verify installation: `ls node_modules` should show packages

### 2. Sentry Configuration

- [ ] Log in to Sentry: https://monta-app.sentry.io
- [ ] Navigate to Settings → Account → API → Auth Tokens
- [ ] Create new token with name "Claude Autofix"
- [ ] Grant these scopes:
  - [ ] `project:read`
  - [ ] `event:read`
  - [ ] `org:read`
  - [ ] `project:write` (optional, for comments)
- [ ] Copy token (starts with `sntrys_`)
- [ ] Find your project slug from the URL
- [ ] Confirm org slug is `monta-app`

### 3. Anthropic Configuration

- [ ] Sign up/log in to Claude: https://console.anthropic.com
- [ ] Navigate to Settings → API Keys
- [ ] Create new key with name "Sentry Autofix"
- [ ] Copy API key (starts with `sk-ant-`)
- [ ] Verify you have credits available

### 4. Environment Setup

- [ ] Copy example file: `cp .env.example .env`
- [ ] Open `.env` in your editor
- [ ] Fill in `SENTRY_AUTH_TOKEN`
- [ ] Fill in `SENTRY_ORG_SLUG` (should be `monta-app`)
- [ ] Fill in `SENTRY_PROJECT_SLUG`
- [ ] Fill in `ANTHROPIC_API_KEY`
- [ ] Set `CODEBASE_PATH` to your codebase root directory
- [ ] Configure optional settings:
  - [ ] `MAX_ISSUES_PER_RUN` (start with 1-2)
  - [ ] `AUTO_COMMENT` (set to `false` for testing)
  - [ ] `OUTPUT_DIR` (default: `./output`)

### 5. Verify Configuration

- [ ] Run connection test: `npm run test:connection`
- [ ] Verify Sentry connection succeeds
- [ ] Verify Claude API connection succeeds
- [ ] Check for any error messages

### 6. Test Run

- [ ] Set `MAX_ISSUES_PER_RUN=1` in `.env`
- [ ] Set `AUTO_COMMENT=false` in `.env` (for testing)
- [ ] Run the system: `npm run dev`
- [ ] Watch console output for errors
- [ ] Check `output/` directory for generated files
- [ ] Review the `.md` file for proposal quality

### 7. Review First Proposal

- [ ] Open the generated `.md` file
- [ ] Check if the analysis makes sense
- [ ] Verify proposed changes are relevant
- [ ] Assess the confidence level
- [ ] Look for any hallucinations or incorrect assumptions

### 8. Production Configuration

- [ ] Increase `MAX_ISSUES_PER_RUN` to desired value (5-10)
- [ ] Set `AUTO_COMMENT=true` if you want Sentry comments
- [ ] Configure `CODEBASE_PATH` to point to correct directory
- [ ] Set up git ignore for `output/` directory (already in `.gitignore`)
- [ ] Set up secure storage for `.env` file

### 9. Automation (Optional)

#### Using Cron
- [ ] Open crontab: `crontab -e`
- [ ] Add entry for desired schedule
- [ ] Example for every hour: `0 * * * * cd /path/to/sentry-claude && npm start`
- [ ] Save and verify: `crontab -l`

#### Using PM2
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start process: `pm2 start npm --name "sentry-claude" -- start`
- [ ] Set up auto-restart: `pm2 startup`
- [ ] Save configuration: `pm2 save`

### 10. Monitoring

- [ ] Set up log rotation for console output
- [ ] Monitor `output/` directory size
- [ ] Track Anthropic API usage and costs
- [ ] Review proposal quality regularly
- [ ] Monitor Sentry for automatic comments

## Troubleshooting Checklist

### Connection Issues

- [ ] Verify API tokens are correct and not expired
- [ ] Check internet connectivity
- [ ] Verify firewall isn't blocking API requests
- [ ] Test API endpoints manually with curl

### File Path Issues

- [ ] Verify `CODEBASE_PATH` is absolute, not relative
- [ ] Check that source maps are configured in Sentry
- [ ] Ensure file paths in Sentry match local structure
- [ ] Try different path resolution strategies

### Quality Issues

- [ ] Review and adjust filtering in `shouldAutoFix()`
- [ ] Modify Claude prompts for better results
- [ ] Increase or decrease context size
- [ ] Adjust file reading limits

### Performance Issues

- [ ] Reduce `MAX_ISSUES_PER_RUN`
- [ ] Limit file context size
- [ ] Add delays between API calls
- [ ] Monitor token usage

## Maintenance Checklist

### Daily
- [ ] Check output directory for new proposals
- [ ] Review proposal quality
- [ ] Monitor API costs

### Weekly
- [ ] Review Sentry comments
- [ ] Apply validated fixes
- [ ] Update filtering criteria based on results
- [ ] Check for failed runs in logs

### Monthly
- [ ] Review API usage and costs
- [ ] Update dependencies: `npm update`
- [ ] Clean up old proposal files
- [ ] Assess system effectiveness

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] API keys are not committed to git
- [ ] API keys have minimal required permissions
- [ ] Regular rotation of API keys
- [ ] Secure storage of credentials
- [ ] Code review before applying fixes
- [ ] Test fixes in staging before production

## Success Criteria

Your system is working correctly if:

- [ ] Unresolved Sentry issues are being fetched
- [ ] Stack traces are being parsed correctly
- [ ] Affected files are being identified
- [ ] Claude provides relevant analysis
- [ ] Proposed fixes address the root cause
- [ ] Confidence scores are reasonable
- [ ] Comments appear in Sentry (if enabled)
- [ ] Output files are being generated
- [ ] No repeated API errors

## Getting Help

If you're stuck:

1. [ ] Review [README.md](README.md) for detailed docs
2. [ ] Check [QUICKSTART.md](QUICKSTART.md) for step-by-step guide
3. [ ] Read [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
4. [ ] Run `npm run test:connection` to diagnose issues
5. [ ] Check Sentry API docs: https://docs.sentry.io/api/
6. [ ] Check Anthropic docs: https://docs.anthropic.com/

## Next Steps

Once everything is working:

- [ ] Integrate with CI/CD pipeline
- [ ] Set up automated PR creation
- [ ] Create dashboard for proposal review
- [ ] Expand to multiple projects
- [ ] Customize prompts for your tech stack
- [ ] Build metrics and reporting

---

**Date Completed**: ________________

**Completed By**: ________________

**Notes**:
