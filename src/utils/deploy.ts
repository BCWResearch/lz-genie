import { spawn, SpawnOptions } from 'child_process';
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
}