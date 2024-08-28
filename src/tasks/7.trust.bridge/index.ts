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
import { PromiseResult } from '../../interfaces';
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
      PostHogUtil.trackEvent(`TRUST_BRIDGE_${sourceNetwork}_${targetNetwork}`, {
        sourceNetwork,
        targetNetwork,
        contract: selectedContract,
      });
      const resp = await setTrustBridge(
        selectedContract,
        sourceNetwork,
        targetNetwork
      );

      console.log('RESPONSE');
      console.log(resp);

      if (resp.isSuccess) {
        PostHogUtil.trackEvent('TRUST_BRIDGE_SUCCESS', { msg: resp.msg });
        console.log(resp.msg);
      } else {
        PostHogUtil.trackEvent('TRUST_BRIDGE_FAILURE', { error: resp.msg });
        console.error(resp.msg);
      }
    }
  },
};

const setTrustBridge = async (
  contract: string,
  sourceNetwork: string,
  targetNetwork: string
) => {
  return new Promise<PromiseResult>((resolve, reject) => {
    const cwd = process.cwd();
    const options: SpawnOptions = {
      cwd,
      stdio: 'pipe',
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

    let output = '';
    let errorOutput = '';

    // Capture standard output (stdout)
    bridgeProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Capture error output (stderr)
    bridgeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    bridgeProcess.on('error', (err) => {
      resolve({
        isSuccess: false,
        msg: `Bridge trust of ${contract} from ${sourceNetwork} to ${targetNetwork} failed due to error: ${err.message}. Error: ${errorOutput}`,
      });
    });

    bridgeProcess.on('exit', (code) => {
      resolve({
        isSuccess: code === 0,
        msg:
          code === 0
            ? `Bridge process successful. Details: ${output}`
            : `Bridge process failed. Error: ${errorOutput}`,
      });
    });
  });
};
