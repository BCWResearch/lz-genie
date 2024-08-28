import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import PostHogUtil from './posthog';
import { parse } from '@typescript-eslint/typescript-estree';
import select from '@inquirer/select';
import { LayerZeroConfigManager } from './lzConfigManager';
import { DVNUtils } from './dvn';
import { PromiseResult } from '../interfaces';

export class DeployUtils {
  static async deployProject() {
    PostHogUtil.trackEvent('DEPLOY_PROJECT');
    const cwd = process.cwd();
    const options: SpawnOptions = {
      cwd,
      stdio: 'pipe',
      shell: true,
    };

    const commandArgs = ['hardhat'];

    // get network names
    const networksOrig = await DeployUtils.getNetworkNames(
      path.join(cwd, 'hardhat.config.ts')
    );

    const networks = Object.keys(networksOrig);
    var answer = undefined;
    if (networks && networks.length) {
      answer = await select({
        message: 'Which Network do you want to deploy to?\n',
        choices: networks
          .map((name, idx) => {
            return [
              {
                name: `${idx + 1}. ${name}`,
                value: name,
              },
            ];
          })
          .flat(),
      });

      if (!answer) {
        console.log('No network selected. Deployment cancelled.');
        return;
      }

      PostHogUtil.trackEvent(`DEPLOY_TO_${answer}`);

      commandArgs.push('deploy');
      commandArgs.push('--network');
      commandArgs.push(answer);
    } else {
      // if we aren't able to get network names from the hardhat config file, we will use the lz:deploy command instead
      commandArgs.push('lz:deploy');
      PostHogUtil.trackEvent('DEPLOY_TO_GENERIC'); // because we don't know the network
    }

    const deploymentResponse = await new Promise<PromiseResult>(
      (resolve, reject) => {
        const deployProcess = spawn('npx', commandArgs, options);

        let output = '';
        let errorOutput = '';

        // Capture standard output (stdout)
        deployProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        // Capture error output (stderr)
        deployProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        deployProcess.on('error', (err) => {
          resolve({
            isSuccess: false,
            msg: `Deployment failed due to error: ${err.message}. Error: ${errorOutput}`,
          });
        });

        deployProcess.on('exit', (code) => {
          resolve({
            isSuccess: code === 0,
            msg:
              code === 0
                ? `Deployment successful. Details: ${output}`
                : `Deployment failed. Error: ${errorOutput}`,
          });
        });
      }
    );

    deploymentResponse.isSuccess
      ? PostHogUtil.trackEvent('DEPLOY_SUCCESS', {
          msg: deploymentResponse.msg,
        })
      : PostHogUtil.trackEvent('DEPLOY_FAILED', {
          error: deploymentResponse.msg,
        });

    deploymentResponse.isSuccess
      ? console.log(deploymentResponse.msg)
      : console.error(deploymentResponse.msg);

    if (deploymentResponse.isSuccess) {
      const configFilePath = path.join(cwd, 'layerzero.config.ts');
      if (!fs.existsSync(configFilePath)) {
        console.warn('Not a LayerZero project.');
        return;
      }
      const manager = new LayerZeroConfigManager(configFilePath);
      const omniPointhardhatVarName = `${answer}Contract`;
      if (manager.isOmniPointHardhatObject(omniPointhardhatVarName)) {
        console.debug('omni point hardhat object already exists');
      } else {
        const omniPointhardhatVarValue = `{
    eid: ${networksOrig[answer]},
    contractName: contractName,
  }`;
        manager.createOmniPointHardhatObject(
          omniPointhardhatVarName,
          omniPointhardhatVarValue
        );
      }
      manager.createContract(omniPointhardhatVarName);
      await DVNUtils.configureDVN(0);
    }
  }

  static async getNetworkNames(filePath: string): Promise<string[]> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse the file content into an AST
      const ast = parse(fileContent, {
        loc: true,
        range: true,
        comment: true,
      });

      // Traverse the AST to find the default export declaration
      let networksNode: any;

      for (const node of ast.body) {
        if (node.type === 'VariableDeclaration') {
          if (node.declarations[0].init.type === 'ObjectExpression') {
            networksNode = node.declarations[0].init.properties.find(
              (prop) =>
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'networks'
            );
          }
        }
      }

      if (!networksNode && networksNode.value.type !== 'ObjectExpression') {
        return [];
      }

      // Extract and return the network names
      const networkNames = networksNode.value.properties
        .map((network) => {
          if (
            network.type === 'Property' &&
            network.key.type === 'Identifier'
          ) {
            return {
              [network.key.name]:
                `${network.value.properties[0].value.object.name}.${network.value.properties[0].value.property.name}`,
            };
          }
        })
        .reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {});

      return networkNames;
      //.filter(Boolean) as string[];
    } catch (error) {
      return [];
    }
  }

  static async fetchDeployedContracts() {
    const cwd = process.cwd();
    const deploymentsDir = path.join(cwd, 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      console.error('No deployments directory found.');
      return {};
    }

    const networks = fs.readdirSync(deploymentsDir);
    const deployedContracts = networks.reduce(
      (acc, network) => {
        const networkDir = path.join(deploymentsDir, network);
        const contractFiles = fs
          .readdirSync(networkDir)
          .filter((f) => f.endsWith('.json'));
        contractFiles.forEach((contractFile) => {
          const contractName = contractFile.replace('.json', '');
          const contractPath = path.join(networkDir, contractFile);
          const contractData = JSON.parse(
            fs.readFileSync(contractPath, 'utf8')
          );
          if (acc[contractName] === undefined) acc[contractName] = {};
          acc[contractName] = {
            ...acc[contractName],
            [network]: contractData.address,
          };
        });
        return acc;
      },
      {} as Record<string, any>
    );

    return deployedContracts;
  }

  static async compileContracts() {
    return new Promise((resolve, reject) => {
      const cwd = process.cwd();
      const options: SpawnOptions = {
        cwd,
        stdio: 'inherit',
        shell: true,
      };
      const compileProcess = spawn('npx', ['hardhat', 'compile'], options);
      compileProcess.on('exit', (code) => {
        resolve(code);
      });
      compileProcess.on('error', (err) => {
        reject(err);
      });
    });
  }
}
