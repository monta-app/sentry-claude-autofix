import dotenv from 'dotenv';
import { OrchestratorConfig } from './orchestrator.js';

dotenv.config();

export function loadConfig(): OrchestratorConfig {
  const requiredVars = [
    'SENTRY_AUTH_TOKEN',
    'SENTRY_ORG_SLUG',
    'SENTRY_PROJECT_SLUG',
    'ANTHROPIC_API_KEY',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please create a .env file with these variables. See .env.example for reference.'
    );
  }

  return {
    sentryAuthToken: process.env.SENTRY_AUTH_TOKEN!,
    sentryOrgSlug: process.env.SENTRY_ORG_SLUG!,
    sentryProjectSlug: process.env.SENTRY_PROJECT_SLUG!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    codebasePath: process.env.CODEBASE_PATH || process.cwd(),
    maxIssuesPerRun: parseInt(process.env.MAX_ISSUES_PER_RUN || '5', 10),
    autoComment: process.env.AUTO_COMMENT !== 'false',
    outputDir: process.env.OUTPUT_DIR || './output',
  };
}

export function validateConfig(config: OrchestratorConfig): void {
  if (!config.sentryAuthToken.startsWith('sntrys_')) {
    console.warn(
      '⚠️  Warning: SENTRY_AUTH_TOKEN should start with "sntrys_". ' +
        'Make sure you are using a valid Sentry auth token.'
    );
  }

  if (!config.anthropicApiKey.startsWith('sk-ant-')) {
    console.warn(
      '⚠️  Warning: ANTHROPIC_API_KEY should start with "sk-ant-". ' +
        'Make sure you are using a valid Anthropic API key.'
    );
  }

  console.log('✅ Configuration validated');
  console.log(`   - Sentry Org: ${config.sentryOrgSlug}`);
  console.log(`   - Sentry Project: ${config.sentryProjectSlug}`);
  console.log(`   - Codebase Path: ${config.codebasePath}`);
  console.log(`   - Max Issues: ${config.maxIssuesPerRun}`);
  console.log(`   - Auto Comment: ${config.autoComment}`);
  console.log(`   - Output Dir: ${config.outputDir}`);
}
