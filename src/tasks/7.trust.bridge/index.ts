import { InquirerUtils } from '../../utils/inquirer';
import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import checkbox from '@inquirer/checkbox';
import {
  getContracts,
  retrieveDeployedContracts,
} from '../../utils/contractUtils';
import PostHogUtil from '../../utils/posthog';
export default {
  tag: 'trust.bridge',
  description: 'Bridge Trust Between Contracts',
  run: async (_backCb: Function) => {
    PostHogUtil.trackEvent('TRUST_BRIDGE');
    const cwd = process.cwd();

    const configFilePath = path.join(cwd, 'layerzero.config.ts');

    if (!fs.existsSync(configFilePath)) {
      console.error('Not a LayerZero project. Exiting...');
      return;
    }

    const contractFiles = getContracts();

    const deployedContracts = contractFiles.reduce(
      (acc, contract) => {
        const onlyContractName = contract.split('.').slice(0, -1).join('.');
        acc[onlyContractName] = retrieveDeployedContracts(contract);
        return acc;
      },
      {} as Record<string, Record<string, string>>
    );

    const promptOptions = Object.keys(deployedContracts).reduce(
      (acc, contractName) => {
        acc[contractName] = {
          description: contractName,
          tag: contractName,
        };
        return acc;
      },
      {} as Record<string, any>
    );

    const selectedContract = await InquirerUtils.handlePrompt(
      promptOptions,
      InquirerUtils.defaultBackCb,
      true,
      'Select contract to bridge trust'
    );
    if (!selectedContract) {
      return;
    }
    const deployedNetworks = Object.keys(deployedContracts[selectedContract]);

    const networkCombinations = [];
    for (let i = 0; i < deployedNetworks.length; i++) {
      for (let j = 0; j < deployedNetworks.length; j++) {
        if (i !== j) {
          networkCombinations.push([deployedNetworks[i], deployedNetworks[j]]);
        }
      }
    }

    if (networkCombinations.length < 2) {
      console.error('Not enough networks to bridge trust');
      return;
    }

    const promptOptions2 = networkCombinations.map((combination, idx) => {
      return {
        name: `${idx + 1}. ${combination[0]} -> ${combination[1]}`,
        value: combination,
      };
    });

    const answer = await checkbox({
      pageSize: 10,
      message: 'Select network combinations to bridge trust\n',
      choices: promptOptions2,
    }).catch((_) => {
      return [];
    });

    if (!answer) {
      return;
    }
    for (const [sourceNetwork, targetNetwork] of answer) {
      await setTrustBridge(selectedContract, sourceNetwork, targetNetwork);
    }
  },
};

const setTrustBridge = async (
  contract: string,
  sourceNetwork: string,
  targetNetwork: string
) => {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    const options: SpawnOptions = {
      cwd,
      stdio: 'inherit',
      shell: true,
    };
    const bridgeProcess = spawn(
      'npx',
      [
        'hardhat',
        'lzgenie:configure:trust',
        `--network ${sourceNetwork}`,
        `--source ${sourceNetwork}`,
        `--target ${targetNetwork}`,
        `--contract ${contract}`,
      ],
      options
    );
    bridgeProcess.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
      console.log(
        `Bridge Trust of ${contract} from ${sourceNetwork} to ${targetNetwork} exited with code ${code}`
      );
    });
    bridgeProcess.on('error', (err) => {
      console.error(err);
      reject(err);
    });
  });
};
