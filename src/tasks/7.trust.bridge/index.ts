// import { InquirerUtils } from "../../utils/inquirer";
import { LayerZeroConfigManager } from "../../utils/lzConfigManager";
import * as path from 'path';
import checkbox from '@inquirer/checkbox';

export default {
    tag: 'trust.bridge',
    description: 'Bridge Trust Between Contracts',
    run: async (_backCb: Function) => {
        const cwd = process.cwd();

        const configFilePath = path.join(cwd, 'layerzero.config.ts');

        const manager = new LayerZeroConfigManager(configFilePath);

        // List contracts
        const contracts = manager.listContracts();

        const contractCombinations = [];
        for (let i = 0; i < contracts.length; i++) {
            for (let j = 0; j < contracts.length; j++) {
                if (i !== j) {
                    contractCombinations.push([contracts[i].contractName, contracts[j].contractName]);
                }
            }
        }

        const promptOptions = contractCombinations.map((combination, idx) => {
            return {
                name: `${idx + 1}. ${combination[0]} -> ${combination[1]}`,
                value: combination
            };
        });

        const answer = await checkbox({
            pageSize: 10,
            message: 'Select contract combinations to bridge trust\n',
            choices: promptOptions,
        }).catch((_) => { return [] });

        answer.forEach((combination) => {
            console.log(`Bridging trust between ${combination[0]} and ${combination[1]}`);
        });

    }
}