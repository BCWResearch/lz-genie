import * as fs from 'fs';
import * as path from 'path';
import { taskTemplate } from '../templates/hardhatTask';

export class HardhatTaskUtil {
    static ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    }

    static generateTaskFile(tasksDir: string, contractName: string, functionName: string, inputs: { name: string; type: string }[]): void {
        this.ensureDirectoryExists(tasksDir);
        const tasksFile = path.join(tasksDir, `${contractName}_${functionName}.ts`);

        const inputLines = inputs.length > 0 ? inputs.map(i => `const ${i.name.toUpperCase()} = '';`).join('\n') : '';
        const argumentList = inputs.map(i => i.name.toUpperCase()).join(', ');

        const tasksContent = taskTemplate
            .replace(/{{contractName}}/g, contractName)
            .replace(/{{functionName}}/g, functionName)
            .replace(/{{inputs}}/g, inputLines)
            .replace(/{{arguments}}/g, argumentList);

        fs.writeFileSync(tasksFile, tasksContent);
        console.log(`Tasks file generated: ${tasksFile}`);
    }

    static updateIndexFile(tasksDir: string, importStatement: string): void {
        const indexFile = path.join(tasksDir, 'index.ts');
        const indexContent = fs.readFileSync(indexFile, 'utf-8');
        if (!indexContent.includes(importStatement)) {
            fs.appendFileSync(indexFile, '\n' + importStatement + '\n');
            console.log(`Import statement added to ${indexFile}`);
        }
    }
}
