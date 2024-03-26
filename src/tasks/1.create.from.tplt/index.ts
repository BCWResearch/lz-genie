import * as tasks from '..';
import { InquirerUtils } from "../../utils/inquirer"
import { input } from '@inquirer/prompts';
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
            'erc1155': {
                description: 'Setup an ERC1155 Project',
                tag: 'erc1155',
                run: async () => {
                    mockProjectSetup('ERC1155');
                }
            },
            'erc721': {
                description: 'Setup an ERC721 Project',
                tag: 'erc721',
                run: async () => {
                    mockProjectSetup('ERC721');
                }
            },
            'oft': {
                description: 'Setup an OFT Project',
                tag: 'oft',
                run: async () => {
                    mockProjectSetup('OFT');
                }

            },
            'onft': {
                description: 'Setup an ONFT Project',
                tag: 'onft',
                run: async () => {
                    mockProjectSetup('ONFT');
                }

            },
            'oftv2': {
                description: 'Setup an OFTV2 Project',
                tag: 'oftv2',
                run: async () => {
                    mockProjectSetup('OFTV2');
                }

            },
            'pingpong': {
                description: 'Setup a PingPong Project',
                tag: 'pingpong',
                run: async () => {
                    mockProjectSetup('PingPong');
                }

            },
            'omnicounter': {
                description: 'Setup an OmniCounter Project',
                tag: 'omnicounter',
                run: async () => {
                    mockProjectSetup('OmniCounter');
                }

            },
        }, () => {
            InquirerUtils.handlePrompt(tasks.default);
        }, false, "Select a Template to Create a New Project:");
    }
};