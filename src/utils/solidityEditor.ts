import * as fs from 'fs';
import { parse, visit } from '@solidity-parser/parser';
import * as prettier from 'prettier';

interface SolidityModificationOptions {
    addImport?: string;
    addFunctions?: Array<string>;
    removeFunctions?: Array<string>;
    functionModifications?: Array<{
        functionName: string;
        newCode?: string;
        position: 'start' | 'end';  // Specifies where to insert the new code
        remove?: boolean;
    }>;
}

class SolidityEditor {
    static readSolidityFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf8');
    }

    static async modifySolidityCode(source: string, options: SolidityModificationOptions): Promise<string> {
        let modifiedSource = source;

        if (options.addImport) {
            modifiedSource = `import "${options.addImport}";\n${modifiedSource}`;
        }

        options.addFunctions?.forEach(funcDeclaration => {
            modifiedSource += `\n${funcDeclaration}\n`;
        });

        const ast = parse(modifiedSource, { loc: true, range: true });

        options.functionModifications?.forEach(mod => {
            visit(ast, {
                FunctionDefinition(node) {
                    if (node.name === mod.functionName) {
                        let insertionPoint = node.body.range[0] + 1; // Just after the opening brace
                        if (mod.position === 'end') {
                            insertionPoint = node.body.range[1] - 1; // Just before the closing brace
                        }
                        const beforeInsert = modifiedSource.substring(0, insertionPoint);
                        const afterInsert = modifiedSource.substring(insertionPoint);
                        modifiedSource = `${beforeInsert}\n    ${mod.newCode}\n${afterInsert}`;
                    }
                }
            });
        });

        options.removeFunctions?.forEach(functionName => {
            visit(ast, {
                FunctionDefinition(node) {
                    if (node.name === functionName) {
                        const start = modifiedSource.lastIndexOf('\n', node.range[0]) + 1;
                        const end = modifiedSource.indexOf('\n', node.range[1]) + 1;
                        modifiedSource = modifiedSource.slice(0, start) + modifiedSource.slice(end);
                    }
                }
            });
        });

        return await prettier.format(modifiedSource, { parser: 'solidity-parse', plugins: ['prettier-plugin-solidity'] });
    }

    static saveModifiedFile(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

export { SolidityEditor, SolidityModificationOptions };
