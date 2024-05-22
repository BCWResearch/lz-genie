import * as fs from 'fs';
import * as path from 'path';
import * as tasks from '..';
import checkbox from '@inquirer/checkbox';
import { InquirerUtils } from '../../utils/inquirer';
import { SolidityEditor } from '../../utils/solidityEditor';
import { CONTRACT_STANDARDS, AVAILABLE_MODULES } from '../../config/constants';
import { InheritanceSpecifier } from '@solidity-parser/parser/dist/src/ast-types';

const defaultBackCb = () => {
    return InquirerUtils.handlePrompt(tasks.default);
};

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

        // scan contracts directory for contracts
        const baseContractsDir = path.join(cwd, 'contracts');
        if (!fs.existsSync(baseContractsDir)) {
            console.error('No contracts directory found. Exiting...');
            return;
        }

        // contract files are file with .sol extension
        const contractFiles = fs.readdirSync(baseContractsDir).filter((f) => f.endsWith('.sol'));
        if (!contractFiles.length) {
            console.error('No contract files found. Exiting...');
            return;
        }

        const selectedContract = await InquirerUtils.handlePrompt(
            contractFiles.reduce((acc, f) => {
                acc[f] = {
                    description: f,
                    tag: f,
                    run: async () => {},
                };
                return acc;
            }, {}),
            _backCb,
            false,
            'Select a contract to add/remove modules to:',
        );

        if (!selectedContract) {
            return;
        }

        // add absolute path of contract file from `contracts` dir instead of artifacts dir
        const contractFilePath = path.join(baseContractsDir, selectedContract);
        const contractSourceCode = SolidityEditor.readSolidityFile(contractFilePath);
        const contractMetadata = SolidityEditor.getMetadata(contractSourceCode);
        const contractModules = contractMetadata.baseContracts.map(
            (inheritanceSpecifier: InheritanceSpecifier) => inheritanceSpecifier.baseName.namePath,
        );
        const contractType = contractModules.find((module) => CONTRACT_STANDARDS.includes(module)) || 'Custom';

        const addOrRemove = await InquirerUtils.handlePrompt(
            [
                { description: 'Add Module', tag: 'add' },
                { description: 'Remove Module', tag: 'remove', disabled: contractModules.length === 0 },
            ],
            _backCb,
            false,
            `You contract type is ${contractType}. Do you want to add or remove modules?`,
        );

        if (!addOrRemove) {
            return;
        }

        let modulesFiltered = [];
        // If adding modules, show all available modules, minus the ones already in the contract
        if (addOrRemove === 'add') {
            const openZeppelinModules = Object.keys(AVAILABLE_MODULES);
            modulesFiltered = openZeppelinModules.filter((module) => !contractModules.includes(module));
        } else {
            // If removing modules, show all modules in the contract
            modulesFiltered = contractModules;
        }

        const loadedTasks = modulesFiltered.map((module, idx) => {
            return {
                name: `${idx + 1}. ${module[0].toUpperCase() + module.slice(1)}`,
                value: module,
            };
        });

        const modulesToModify = await checkbox({
            pageSize: 10,
            message: `Select modules to ${addOrRemove}\n`,
            choices: loadedTasks,
        }).catch((_) => {
            return [];
        });

        let modifiedSourceCode = contractSourceCode;
        for (const module of modulesToModify) {
            if (fs.existsSync(contractFilePath.split('.sol')[0] + '-modified-.sol')) {
                fs.unlinkSync(contractFilePath.split('.sol')[0] + '-modified-.sol');
            }

            modifiedSourceCode =
                addOrRemove === 'add'
                    ? await SolidityEditor.addModule(modifiedSourceCode, module)
                    : await SolidityEditor.removeModule(modifiedSourceCode, module);

            SolidityEditor.saveModifiedFile(contractFilePath, modifiedSourceCode);
        }
    },
};
