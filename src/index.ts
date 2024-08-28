#! /usr/bin/env node
import { select } from '@inquirer/prompts';
import { createConfig, createDefaultConfig, getConfig } from './config';
import { printLogo } from './logo';
import { InquirerUtils } from './utils/inquirer';
import * as tasks from './tasks';
import PostHogUtil from './utils/posthog';

process.chdir('/home/syed/lztest/oftE2E');

async function handleShutdown() {
  console.log('Exiting...');
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
  console.log('unhandledRejection', reason, promise);
  PostHogUtil.trackEvent('ERROR', {
    type: 'unhandledRejection',
    error: `${reason}`,
  });
  await handleShutdown();
  process.exit(1);
});

(async () => {
  printLogo();
  try {
    const config = getConfig();

    if (config) {
      if (config.trackAnalytics) {
        // If user id is not set, generate a random user id, and save it to the config
        let userId: string = config.anonymousUserId;
        if (!userId) {
          userId = PostHogUtil.generateRandomId();
          createConfig({ trackAnalytics: true, anonymousUserId: userId });
          console.log('updated config', getConfig());
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

    await InquirerUtils.handlePrompt(tasks.default);
  } catch (err) {
    console.error(err);
  }
})();
