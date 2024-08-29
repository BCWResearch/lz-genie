#! /usr/bin/env node
import { select } from '@inquirer/prompts';
import { createConfig, createDefaultConfig, getConfig } from './config';
import { printLogo } from './logo';
import { InquirerUtils } from './utils/inquirer';
import * as tasks from './tasks';
import PostHogUtil from './utils/posthog';
import * as fs from 'fs';
import * as path from 'path';
import logger from './utils/logger';
const { execSync } = require('child_process');
const checkForUpdate = require('update-check');

async function handleShutdown() {
  logger.log('\nExiting...');
  await PostHogUtil.shutdown();
}

// 'Exit' option in the CLI
process.on('beforeExit', async () => {
  await handleShutdown();
  process.exit(0);
});

process.on('exit', async () => {});

// ctrl+c
process.on('SIGINT', async () => {
  await handleShutdown();
  process.exit(0);
});

// kill -9 or similar
process.on('SIGTERM', async () => {
  await handleShutdown();
  process.exit(0);
});

// uncaught exceptions
process.on('uncaughtException', async (err) => {
  PostHogUtil.trackEvent('ERROR', {
    type: 'uncaughtException',
    error: `${err}`,
  });
  await handleShutdown();
  process.exit(1);
});

// unhandled rejections
process.on('unhandledRejection', async (reason, promise) => {
  logger.verbose('unhandledRejection', reason, promise);
  PostHogUtil.trackEvent('ERROR', {
    type: 'unhandledRejection',
    error: `${reason}`,
  });
  await handleShutdown();
  process.exit(1);
});

async function checkForUpdates(pkg: Object) {
  try {
    logger.log('Checking for updates...');
    const update = await checkForUpdate(pkg, { interval: 0 }); // 1 day

    if (update) {
      logger.log(
        `A new version (${update.latest}) is available!. Downloading...`
      );
      execSync(`npm install -g ${pkg['name']}@${update.latest}`, {
        stdio: 'inherit',
      });
      logger.log('Update completed. Please restart the CLI.');
      process.exit(0);
    }
    logger.log('You are using the latest version of the application.');
  } catch (error) {
    logger.error('Failed to check for updates:', error);
    logger.error('Please check for and install updates manually.');
    process.exit(1);
  }
}

(async () => {
  try {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    printLogo(pkg?.version);

    let config = getConfig();
    logger.verbose(config);

    if (config) {
      if (config.trackAnalytics) {
        // If user id is not set, generate a random user id, and save it to the config
        let userId: string = config.anonymousUserId;
        if (!userId) {
          userId = PostHogUtil.generateRandomId();
          createConfig({ trackAnalytics: true, anonymousUserId: userId });
        }

        PostHogUtil.initialize(userId);
      }
    } else {
      const collectAnalytics = await select({
        message:
          'To help us improve your experience, do you consent to the collection of anonymous usage data?',
        choices: [
          { value: true, name: 'Yes' },
          { value: false, name: 'No' },
        ],
      });

      if (collectAnalytics) {
        const userId = PostHogUtil.generateRandomId();
        createConfig({ trackAnalytics: true, anonymousUserId: userId });
        PostHogUtil.initialize(userId);
      } else {
        createDefaultConfig();
      }
    }

    config = getConfig(); // reload config

    if (config.autoUpdate === undefined || config.autoUpdate === null) {
      const autoUpdate = await select({
        message: 'Enable auto-updates?',
        choices: [
          { value: true, name: 'Yes' },
          { value: false, name: 'No' },
        ],
      });

      createConfig({ ...config, autoUpdate });
    }

    config = getConfig(); // reload config

    logger.verbose(config);

    if (config.autoUpdate) {
      await checkForUpdates(pkg);
    }

    await InquirerUtils.handlePrompt(tasks.default);
  } catch (err) {
    console.error(err);
  }
})();
