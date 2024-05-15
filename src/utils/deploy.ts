import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class DeployUtils {
    static async deployProject() {
        const cwd = process.cwd();
        const options: SpawnOptions = {
            cwd,
            stdio: 'inherit',
            shell: true
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
        const deployedContracts = networks.reduce((acc, network) => {
            const networkDir = path.join(deploymentsDir, network);
            const contractFiles = fs.readdirSync(networkDir).filter(f => f.endsWith('.json'));
            contractFiles.forEach(contractFile => {
                const contractName = contractFile.replace('.json', '');
                const contractPath = path.join(networkDir, contractFile);
                const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
                acc[contractName] = {
                    network,
                    address: contractData.address
                };
            });
            return acc;
        }, {} as Record<string, any>);

        return deployedContracts;
    }
}


