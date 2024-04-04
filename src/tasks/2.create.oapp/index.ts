import { input } from '@inquirer/prompts';
import { mkdirSync, cpSync } from 'fs';
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
        try{
            mkdirSync(projectName);
        }catch(e){
            console.log(`Error: ${e.message}`);
            return;
        }
        const currentDir =  __dirname;
        // from /src/tasks/2.create.oapp/index.ts to projects/oapp
        const projectDir = currentDir.split('/').slice(0, -3).join('/') + '/projects/oapp';
        // copy all files from projectDir to projectName
        cpSync(projectDir, projectName, {recursive: true});

        await mockProgressBar(100);
        // console.log('Installing dependencies...');
        // await mockProgressBar(1000);
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