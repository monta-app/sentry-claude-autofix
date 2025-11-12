#!/usr/bin/env node
import { Orchestrator } from './orchestrator.js';
import { loadConfig, validateConfig } from './config.js';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔧 Sentry-Claude Autofix                               ║
║   Automatically investigate and fix Sentry issues        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  try {
    // Load and validate configuration
    const config = loadConfig();
    validateConfig(config);

    // Create orchestrator
    const orchestrator = new Orchestrator(config);

    // Run the workflow
    await orchestrator.run();

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

main();
