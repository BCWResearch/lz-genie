import * as fs from 'fs';
import * as path from 'path';
import checkbox from '@inquirer/checkbox';
import * as tasks from '..';
import { InquirerUtils } from "../../utils/inquirer"
import ContractModifier from '../../utils/contractModifier';
// const cliProgress = require('cli-progress');

const defaultBackCb = () => {
    return InquirerUtils.handlePrompt(tasks.default);
}

// const mockProgressBar = async (splits: number) => {
//     const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
//     bar.start(splits, 0);
//     let currentTime = 0;
//     while (currentTime < splits) {
//         await new Promise(resolve => setTimeout(resolve, 100));
//         currentTime += 100;
//         bar.update(currentTime);
//     }
//     bar.stop();
//     console.log();
// }

// const mockProjectSetup = async (moduleName) => {
//     console.log();
//     console.log(`Adding Module ${moduleName}`);
//     await mockProgressBar(1000);

// }

export default {
    tag: 'modify.proj',
    description: 'Add or Remove Modules',
    disabled: false,
    run: async (_backCb: Function) => {

        _backCb = _backCb || defaultBackCb;
        const cwd = process.cwd();
        const hardhatConfigPath = path.join(cwd, 'hardhat.config.ts');
        if (!fs.existsSync(hardhatConfigPath)) {
            console.error('Not a Hardhat project. Exiting...');
            return;
        }

        // scan artifacts directory for contracts
        const artifactsDir = path.join(cwd, 'artifacts', 'contracts');
        if (!fs.existsSync(artifactsDir)) {
            console.error('No artifacts directory found. Exiting...');
            return;
        }

        // contract files are directory with .sol postfix
        const contractFiles = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.sol'));
        if (!contractFiles.length) {
            console.error('No contract files found. Exiting...');
            return;
        }


        const selectedContract = await InquirerUtils.handlePrompt(
            contractFiles.reduce((acc, f) => {
                acc[f] = {
                    description: f,
                    tag: f,
                    run: async () => {

                    }
                };
                return acc;
            }, {})
            , _backCb, false, 'Select a contract to add/remove modules:');

        if (!selectedContract) {
            return;
        }

        // add absolute path of contract file from `contracts` dir instead of artifacts dir
        const contractFile = path.join(cwd, 'contracts', selectedContract);

        // console.log('Selected contract:', contractFile);
        // return;

        const openZeppelinModules = ContractModifier.getOpenZeppelinModules();

        if (openZeppelinModules.length === 0) {
            console.log("No OpenZeppelin modules found in node_modules directory.");
            return;
        }

        const loadedTasks = openZeppelinModules.map((module, idx) => {
            return {
                name: `${idx + 1}. ${module[0].toUpperCase() + module.slice(1)}`,
                value: module
            };
        });

        const answer = await checkbox({
            pageSize: 10,
            message: 'Select modules to add or remove\n',
            choices: loadedTasks,
        }).catch((_) => { return [] });

        const modulesToAdd = answer || [];
        const modulesToRemove = openZeppelinModules.filter(module => !modulesToAdd.includes(module));

        // Add selected modules
        modulesToAdd.forEach(moduleName => {
            ContractModifier.addModule(moduleName, contractFile);
        });

        // Remove unselected modules
        modulesToRemove.forEach(moduleName => {
            ContractModifier.removeModule(moduleName, contractFile);
        });
    }
}