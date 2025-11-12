#!/usr/bin/env node
/**
 * Utility script to list all available Sentry projects
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listProjects() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📋 List Sentry Projects                                ║
║   Find your project slug                                 ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const authToken = process.env.SENTRY_AUTH_TOKEN;
  const orgSlug = process.env.SENTRY_ORG_SLUG;

  if (!authToken || !orgSlug) {
    console.error('❌ Missing SENTRY_AUTH_TOKEN or SENTRY_ORG_SLUG in .env file');
    process.exit(1);
  }

  console.log(`🔍 Fetching projects for organization: ${orgSlug}\n`);

  try {
    const response = await axios.get(
      `https://sentry.io/api/0/organizations/${orgSlug}/projects/`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const projects = response.data;

    if (projects.length === 0) {
      console.log('⚠️  No projects found in this organization');
      return;
    }

    console.log(`✅ Found ${projects.length} project(s):\n`);
    console.log('═'.repeat(80));

    for (const project of projects) {
      console.log(`\n📦 Project: ${project.name}`);
      console.log(`   Slug: ${project.slug}`);
      console.log(`   Platform: ${project.platform || 'unknown'}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Team: ${project.team?.name || 'N/A'}`);

      if (project.hasAccess) {
        console.log(`   ✅ You have access`);
      } else {
        console.log(`   ⚠️  Limited or no access`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 To use a project, set SENTRY_PROJECT_SLUG in your .env file to one of the slugs above\n');
    console.log('Example:');
    console.log(`   SENTRY_PROJECT_SLUG=${projects[0].slug}\n`);

  } catch (error: any) {
    console.error('❌ Error fetching projects:', error.message);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Detail: ${error.response.data?.detail || 'Unknown error'}`);

      if (error.response.status === 401) {
        console.error('\n💡 Your auth token may be invalid or expired');
      } else if (error.response.status === 403) {
        console.error('\n💡 Your auth token may not have the required permissions');
      } else if (error.response.status === 404) {
        console.error('\n💡 The organization slug may be incorrect');
        console.error(`   Current org slug: ${orgSlug}`);
        console.error('   Check your Sentry URL - the org slug comes after sentry.io/organizations/');
      }
    }

    process.exit(1);
  }
}

listProjects();
