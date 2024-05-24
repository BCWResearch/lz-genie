import { spawn, SpawnOptions } from 'child_process';
import { SingleBar, Presets, } from 'cli-progress';

export class PackageManagerUtil {
    private static progressBar: SingleBar = new SingleBar({
        format: '{bar}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, Presets.shades_classic);

    private static simulateProgress(): Function {
        let value = 0;
        this.progressBar.start(100, 0);
        const interval = setInterval(() => {
            value += 1;
            if (value > 100) {
                value = 0; // Reset for indeterminate effect
            }
            this.progressBar.update(value);
        }, 50); // Adjust speed as needed
        return () => {
            clearInterval(interval);
            this.progressBar.update(100);
            this.progressBar.stop();
        }
    }

    public static async installDependencies(packageManager: 'yarn' | 'npm' | 'pnpm', workingDir: string = '.'): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {

            const options: SpawnOptions = {
                cwd: workingDir,
                stdio: ['ignore', 'ignore', 'ignore'], // Suppress stdout and stderr
                shell: true
            };
            console.log(`Installing dependencies using ${packageManager}...`);
            const process = spawn(packageManager, ['install'], options);

            process.stdout?.on('data', (_data) => {
                // console.log(`stdout: ${data}`);
            });

            process.stderr?.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            // check on spawn start
            let progressStopper: Function;
            process.on('spawn', () => {
                setTimeout(() => {
                    progressStopper = this.simulateProgress();
                }, 100);
            });

            process.on('close', (code) => {
                if (progressStopper) progressStopper();
                if (code === 0) {
                    console.log('Dependencies installed successfully!');
                    resolve();
                } else {
                    console.error(`Failed to install dependencies. Exit code: ${code}`);
                    reject();
                }
            });
        });
        return promise;
    }
}
