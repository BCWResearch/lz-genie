import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import { LayerZeroConfigManager } from "./lzConfigManager";
import { DVNS } from '../dvn-definitions';
import { InquirerUtils } from './inquirer';

export class DVNUtils {
    static async configureDVN() {
        const cwd = process.cwd();
        const configFilePath = path.join(cwd, 'layerzero.config.ts');

        const manager = new LayerZeroConfigManager(configFilePath);
        // List contracts
        const contracts = manager.listContracts();
        const contractsEid = contracts.map((contract) => contract.resolvedEid);


        const availableDvns = Object.keys(DVNS).map((dvn, index) => {
            return {
                name: `${index + 1}. ${dvn}`,
                value: dvn,
                description: dvn,
                tag: dvn,
                disabled: Object.keys(DVNS[dvn]).filter((eid) => contractsEid.includes(+eid)).length === 0
            }
        }).sort((a, b) => {
            return a.disabled ? 1 : -1;
        });

        const selectedDvn = await InquirerUtils.handlePrompt(availableDvns,);

        if (!selectedDvn) {
            return;
        }

        const contractCombinations = [];
        for (let i = 0; i < contracts.length; i++) {
            for (let j = 0; j < contracts.length; j++) {
                if (i !== j) {
                    contractCombinations.push([contracts[i].contractName, contracts[j].contractName]);
                }
            }
        }


        contractCombinations.forEach((combination) => {
            // Remove connection for v1
            manager.removeConnection(combination[0], combination[1]);

            // Add connection
            manager.addConnection(combination[0], combination[1]);

            const eid = contracts.find((contract) => contract.contractName === combination[0])?.resolvedEid;

            // Add DVN
            manager.addDVN(DVNS[selectedDvn][eid], combination[0], combination[1], 'sendConfig', 'optionalDVNs');

        });

        manager.saveChanges();
    }
    static async setDVNConfig() {
        const cwd = process.cwd();
        const options: SpawnOptions = {
            cwd,
            stdio: 'inherit',
            shell: true
        };
        const deployProcess = spawn('npx', ['hardhat', 'lzgenie:configure:dvn'], options);
        deployProcess.on('exit', (code) => {
            console.log(`child process exited with code ${code}`);
        });

    }
}