import { input } from '@inquirer/prompts';
import { join } from 'path';
import { FileCopyUtil } from './filecopy';
import { PackageManagerUtil } from './packagemanager';

export class ProjectSetupUtil {
    public static async createProjectFromTemplate(template: string, projectName: string): Promise<void> {
        const currentDir = __dirname;
        const templateDir = join(currentDir, '..', '..', 'projects', template);
        const projectDir = join(process.cwd(), projectName);
        // copy all files from templateDir to projectDir
        console.log(`Setting up an ${template.toUpperCase()} project ${projectName}...`);
        await FileCopyUtil.copyDirWithProgress(templateDir, projectDir);

        // install dependencies
        const packageManager = 'yarn';
        const workingDir = projectDir;
        PackageManagerUtil.installDependencies(packageManager, workingDir).catch((err) => {
            console.error(err);
        }).then(() => {
            console.log(`
            # Navigate to your project
            cd ./${projectName}
            
            #
            # Follow the steps in hardhat.config.ts:
            #
            # - Create an .env file based on the provided template
            # - Adjust the contracts to your liking
            #
            
            # Deploy your contracts
            npx lzgenie
            # or
            npx hardhat lz:deploy
            `
            );
        });
    }

    public static async createNewProject(template: string): Promise<void> {
        const projectName = await input({
            message: 'Enter the name of the project: ',
            default: 'my-project'
        }).catch(() => {
            return undefined;
        })
        if (!!!projectName) {
            console.error('Project name is required!');
            return;
        }
        return await this.createProjectFromTemplate(template, projectName);
    }
}