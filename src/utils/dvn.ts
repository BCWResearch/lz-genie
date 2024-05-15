import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import { LayerZeroConfigManager } from "./lzConfigManager";

export class DVNUtils {
    static async configureDVN() {
        const cwd = process.cwd();
        const configFilePath = path.join(cwd, 'layerzero.config.ts');

        const manager = new LayerZeroConfigManager(configFilePath);
        // List contracts
        console.log(manager.listContracts());
        // List DVNs
        console.log(manager.listDVNs());


        // manager.addDVN('0xNewDVNAddress', 'fujiContract', 'sepoliaContract', 'sendConfig', 'optionalDVNs');
        // manager.saveChanges();

        // manager.removeDVN('0xNewDVNAddress', 'fujiContract', 'sepoliaContract', 'sendConfig', 'optionalDVNs');
        // manager.saveChanges();
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