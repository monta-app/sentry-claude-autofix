#!/usr/bin/env node
/**
 * Test script to verify Sentry and Claude API connections
 */
import { SentryClient } from './sentry-client.js';
import Anthropic from '@anthropic-ai/sdk';
import { loadConfig } from './config.js';

async function testSentryConnection(config: any): Promise<boolean> {
  console.log('\n🔍 Testing Sentry connection...');

  try {
    const client = new SentryClient(config.sentryAuthToken, config.sentryOrgSlug);
    const issues = await client.listProjectIssues(config.sentryProjectSlug, {
      limit: 1,
    });

    console.log('✅ Sentry connection successful!');
    console.log(`   Found ${issues.length > 0 ? 'issues' : 'no issues'} in project`);
    return true;
  } catch (error: any) {
    console.error('❌ Sentry connection failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.detail || 'Unknown error'}`);
    }
    return false;
  }
}

async function testClaudeConnection(config: any): Promise<boolean> {
  console.log('\n🤖 Testing Claude API connection...');

  try {
    const client = new Anthropic({ apiKey: config.anthropicApiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with just "OK" to confirm the connection.',
        },
      ],
    });

    console.log('✅ Claude API connection successful!');
    return true;
  } catch (error: any) {
    console.error('❌ Claude API connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 Connection Test                                     ║
║   Verify Sentry and Claude API credentials               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    const config = loadConfig();

    console.log('📋 Configuration loaded:');
    console.log(`   - Sentry Org: ${config.sentryOrgSlug}`);
    console.log(`   - Sentry Project: ${config.sentryProjectSlug}`);
    console.log(`   - Auth Token: ${config.sentryAuthToken.slice(0, 10)}...`);
    console.log(`   - API Key: ${config.anthropicApiKey.slice(0, 10)}...`);

    const sentryOk = await testSentryConnection(config);
    const claudeOk = await testClaudeConnection(config);

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Results:');
    console.log(`   Sentry API: ${sentryOk ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Claude API: ${claudeOk ? '✅ Working' : '❌ Failed'}`);

    if (sentryOk && claudeOk) {
      console.log('\n✨ All systems operational! You\'re ready to run the autofix system.');
      console.log('   Run: npm run dev\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some connections failed. Please check your configuration.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
