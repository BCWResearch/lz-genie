import * as fs from 'fs';
import * as path from 'path';

class ContractModifier {
    static getOpenZeppelinModules(): string[] {
        const openZeppelinModules: string[] = [];
        const nodeModulesPath = path.resolve(process.cwd(), 'node_modules/@openzeppelin/contracts');

        const readDirectory = (dir: string) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    readDirectory(filePath); // Recursively read directories
                } else if (file.endsWith('.sol')) {
                    const module = file.split('.sol')[0];
                    openZeppelinModules.push(module);
                }
            });
        };

        if (fs.existsSync(nodeModulesPath)) {
            readDirectory(nodeModulesPath);
        } else {
            console.error(`@openzeppelin/contracts directory not found at ${nodeModulesPath}`);
        }

        return openZeppelinModules;
    }

    static addModule(moduleName: string, contractFile: string): void {
        let data = fs.readFileSync(contractFile, 'utf8');

        // Add import statement
        const importStatement = `import "@openzeppelin/contracts/${moduleName}.sol";`;
        data = importStatement + '\n' + data;

        // Modify constructor
        data = data.replace(/constructor\s*\(([^)]*)\)/g, (_match, p1) => {
            return `constructor(${p1}, ${moduleName} ${moduleName.toLowerCase()}ContractAddress)`;
        });

        // Save modified contract
        fs.writeFileSync(contractFile, data);

        console.log(`${moduleName} module added successfully!`);
    }

    static removeModule(moduleName: string, contractFile: string): void {
        let data = fs.readFileSync(contractFile, 'utf8');

        // Remove import statement
        data = data.replace(`import "@openzeppelin/contracts/${moduleName}.sol";\n`, '');

        // Modify constructor
        data = data.replace(new RegExp(`${moduleName}\\s*${moduleName.toLowerCase()}ContractAddress,?`, 'g'), '');

        // Save modified contract
        fs.writeFileSync(contractFile, data);

        console.log(`${moduleName} module removed successfully!`);
    }
}

export default ContractModifier;
