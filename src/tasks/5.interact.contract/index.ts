import * as fs from 'fs';
import * as path from 'path';
import * as tasks from '..';
import { InquirerUtils } from '../../utils/inquirer';
import { DeployUtils } from '../../utils/deploy';
import {
  retrieveDeployedContracts,
  getContractABI,
  filterFunctions,
} from '../../utils/contractUtils';
import { HardhatTaskUtil } from '../../utils/hardhatTask';
import { PostHog } from 'posthog-node';
import PostHogUtil from '../../utils/posthog';

export default {
  tag: 'interact.proj',
  description: 'Interact with an Existing Project',
  run: async (_backCb: Function) => {
    PostHogUtil.trackEvent('INTERACT_PROJECT');
    _backCb = _backCb || InquirerUtils.defaultBackCb;
    const cwd = process.cwd();
    const hardhatConfigPath = path.join(cwd, 'hardhat.config.ts');
    if (!fs.existsSync(hardhatConfigPath)) {
      console.error('Not a Hardhat project. Exiting...');
      return;
    }

    await DeployUtils.compileContracts();

    const artifactsDir = path.join(cwd, 'artifacts', 'contracts');
    if (!fs.existsSync(artifactsDir)) {
      console.error('No artifacts directory found. Exiting...');
      return;
    }

    const contractFiles = fs
      .readdirSync(artifactsDir)
      .filter((f) => f.endsWith('.sol'));
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
            console.log(`Interacting with contract: ${f}`);
          },
        };
        return acc;
      }, {}),
      _backCb,
      false,
      'Select a contract to interact with:'
    );

    if (!selectedContract) {
      return;
    }

    const contractFile = path.join(
      artifactsDir,
      selectedContract,
      selectedContract.replace('.sol', '.json')
    );
    const abi = getContractABI(contractFile);

    const selectedFunctionType = await InquirerUtils.handlePrompt(
      {
        getter: {
          description: 'Getter Functions',
          tag: 'getter',
          run: async () => {
            console.log('Getter Functions');
          },
        },
        setter: {
          description: 'Setter Functions',
          tag: 'setter',
          run: async () => {
            console.log('Setter Functions');
          },
        },
      },
      _backCb,
      false,
      'Select a function type to interact with:'
    );

    if (selectedFunctionType) {
      const fnList = filterFunctions(
        abi,
        selectedFunctionType as 'getter' | 'setter'
      );
      const selectedFunction = await InquirerUtils.handlePrompt(
        fnList.reduce((acc, f) => {
          acc[f.name] = {
            description: f.name,
            tag: f.name,
            run: async () => {
              console.log(
                `Interacting with ${selectedFunctionType} function: ${f.name}`
              );
            },
          };
          return acc;
        }, {}),
        _backCb,
        false,
        `Select a ${selectedFunctionType} function to interact with:`
      );

      if (selectedFunction) {
        const selectedFn = fnList.find((f) => f.name === selectedFunction);
        const inputs = selectedFn?.inputs?.filter((i) => i.name !== '') ?? [];
        const tasksDir = path.join(cwd, 'tasks');
        const onlyContractName = selectedContract.split('.sol')[0];
        HardhatTaskUtil.generateTaskFile(
          tasksDir,
          onlyContractName,
          selectedFunction,
          inputs
        );
        HardhatTaskUtil.updateIndexFile(
          tasksDir,
          `import './${onlyContractName}_${selectedFunction}';`
        );

        console.log(`
#######################
# To run the task:
 npx hardhat ${onlyContractName}:${selectedFunction}
#
# To run the task with network:
 npx hardhat ${onlyContractName}:${selectedFunction} --network <network-name>
#######################
                `);
      }
    }
  },
};
