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
            console.log('Project created successfully!');
        });
    }

    public static async createNewProject(template: string): Promise<void> {
        const projectName = await input({
            message: 'Enter the name of the project: '
        });
        return await this.createProjectFromTemplate(template, projectName);
    }
}