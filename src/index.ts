#! /usr/bin/env node
import { select } from '@inquirer/prompts';
import { createConfig, createDefaultConfig, getConfig } from './config';
import { printLogo } from './logo';
import { InquirerUtils } from './utils/inquirer';
import * as tasks from './tasks';
import PostHogUtil from './utils/posthog';

async function handleShutdown() {
  //   console.log('Starting shutdown process...');
  await PostHogUtil.shutdown();
  //   console.log('Shutdown process complete.');
}

process.on('beforeExit', async () => {
  //   console.log('Process beforeExit event received');
  await handleShutdown();
  //   console.log('bye after handleShutdown from beforeExit');
  process.exit(0);
});

process.on('exit', async () => {
  console.log('Process exit event received');
});

(async () => {
  printLogo();
  try {
    const config = getConfig();
    console.log('config', config);

    if (config) {
      if (config.trackAnalytics) {
        PostHogUtil.initialize();
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
        PostHogUtil.initialize();
        createConfig({ trackAnalytics: true });
      } else {
        createDefaultConfig();
      }
    }

    await InquirerUtils.handlePrompt(tasks.default);
  } catch (err) {
    console.error(err);
  }
})();
