import * as tasks from '..';
import { InquirerUtils } from "../../utils/inquirer"
import { input } from '@inquirer/prompts';
import { ProjectSetupUtil } from '../../utils/projectsetup';
const cliProgress = require('cli-progress');


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

const mockProjectSetup = async (templateName) => {
    const projectName = await input({
        message: 'Enter the name of the project: '
    });
    console.log();
    console.log(`Setting up an ${templateName} OApp project ${projectName}...`);
    await mockProgressBar(1000);
    console.log('Installing dependencies...');
    await mockProgressBar(1000);
    console.log('Creating project files...');
    await mockProgressBar(1000);
    console.log('Project created successfully!');
}

export default {
    tag: 'create.from.template',
    description: 'Create a New Project from a Template',
    run: async (_backCb: Function) => {
        InquirerUtils.handlePrompt({
            'onft1155': {
                description: 'Setup an ONFT1155 Project',
                tag: 'onft1155',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('onft1155');
                }
            },
            'onft721': {
                description: 'Setup an ONFT721 Project',
                tag: 'onft721',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('onft721');
                }
            },
            'oft': {
                description: 'Setup an OFT Project',
                tag: 'oft',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('oft');
                }

            },
            'proxyoft': {
                description: 'Setup an ProxyOft Project',
                tag: 'proxyoft',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('proxyoft');
                }

            },
            'proxyonft1155': {
                description: 'Setup an ProxyONFT1155 Project',
                tag: 'proxyonft1155',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('proxyonft1155');
                }

            },
            'oftv2': {
                description: 'Setup a OFTV2 Project',
                tag: 'oftv2',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('oftv2');
                }

            },
            'pingpong': {
                description: 'Setup an PingPong Project',
                tag: 'pingpong',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('pingpong');
                }
            },
            'omnicounter': {
                description: 'Setup an OmniCounter Project',
                tag: 'omnicounter',
                run: async () => {
                    await ProjectSetupUtil.createNewProject('omnicounter');
                }
            },
        }, () => {
            InquirerUtils.handlePrompt(tasks.default);
        }, false, "Select a Template to Create a New Project:");
    }
};