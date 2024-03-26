import { input } from '@inquirer/prompts';
const cliProgress = require('cli-progress');

export default {
    tag: 'create.oapp',
    description: 'Create an empty OApp Project',
    run: async (_backCb: Function) => {
        const projectName = await input({
            message: 'Enter the name of the project: '
        });
        console.log();
        console.log(`Setting up an empty OApp project ${projectName}...`);
        await mockProgressBar(1000);
        console.log('Installing dependencies...');
        await mockProgressBar(1000);
        console.log('Creating project files...');
        await mockProgressBar(1000);
        console.log('Project created successfully!');
    }
}

const mockProgressBar = async (splits: number) => {
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(splits, 0);
    let currentTime = 0;
    while (currentTime < splits) {
        await new Promise(resolve => setTimeout(resolve, 100));
        currentTime += 100;
        bar.update(currentTime);
    }
    bar.stop();
    console.log();
}