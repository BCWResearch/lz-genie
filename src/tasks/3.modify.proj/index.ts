import { InquirerUtils } from "../../utils/inquirer"
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

const mockProjectSetup = async (moduleName) => {
    console.log();
    console.log(`Adding Module ${moduleName}`);
    await mockProgressBar(1000);
    
}

export default {
    tag: 'modify.proj',
    description: 'Add or Remove Modules to an Existing Project',
    run: async (_backCb: Function) => {
        const answer = await InquirerUtils.handleSelectionPrompt({
            'mintable': {
                description: 'Mintable Module',
                tag: 'mintable',
                run: async () => {
                    console.log('Adding Mintable Module');
                }
            },
            'burnable': {
                description: 'Burnable Module',
                tag: 'burnable',
                run: async () => {
                    console.log('Adding Burnable Module');
                }
            },
            'supply-tracking': {
                description: 'Supply Tracking Module',
                tag: 'supply-tracking',
                run: async () => {
                    console.log('Adding Supply Tracking Module');
                }
            },
            'pausable': {
                description: 'Pausable Module',
                tag: 'pausable',
                run: async () => {
                    console.log('Adding Pausable Module');
                }
            },
            'updatable-uri': {
                description: 'Updatable URI Module',
                tag: 'updatable-uri',
                run: async () => {
                    console.log('Adding Updatable URI Module');
                }
            },

            'ownable': {
                description: 'Ownable Module',
                tag: 'ownable',
                run: async () => {
                    console.log('Adding Ownable Module');
                }
            },
            'roles': {
                description: 'Roles Module',
                tag: 'roles',
                run: async () => {
                    console.log('Adding Roles Module');
                }
            },
            'managed': {
                description: 'Managed Module',
                tag: 'managed',
                run: async () => {
                    console.log('Adding Managed Module');
                }
            },
            'transparent-proxy': {
                description: 'Transparent Proxy Module',
                tag: 'transparent-proxy',
                run: async () => {
                    console.log('Adding Transparent Proxy Module');
                }
            },
            'uups-proxy': {
                description: 'UUPS Proxy Module',
                tag: 'uups-proxy',
                run: async () => {
                    console.log('Adding UUPS Proxy Module');
                }
            },

        });
        for (let i = 0; i < answer.length; i++) {
            await mockProjectSetup(answer[i]);
        }
        console.log('Project updated successfully!');
    }
}