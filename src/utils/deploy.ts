import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import PostHogUtil from './posthog';

export class DeployUtils {
  static async deployProject() {
    PostHogUtil.trackEvent('DEPLOY_PROJECT');
    const cwd = process.cwd();
    const options: SpawnOptions = {
      cwd,
      stdio: 'inherit',
      shell: true,
    };
    const deployProcess = spawn('npx', ['hardhat', 'lz:deploy'], options);
    deployProcess.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
    });
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
