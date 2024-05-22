import * as fs from 'fs';
import * as prettier from 'prettier';
import { parse } from '@solidity-parser/parser';
import { ContractDefinition, FunctionDefinition } from '@solidity-parser/parser/dist/src/ast-types';
import { AVAILABLE_MODULES } from '../config/constants';

// General rule of thumb:
// When you want to search if something is present/not present in the source code, use AST
// When you want to insert something at a specific location, use regex
// When you want to replace something, use regex
export class SolidityEditor {
    static readSolidityFile(filePath: string): string {
        return fs.readFileSync(filePath, 'utf8');
    }

    /**
     * Retrieves the metadata of a Solidity contract from the given source code.
     * @param source The source code of the Solidity contract.
     * @returns The contract definition object representing the metadata of the contract.
     */
    static getMetadata(source: string): ContractDefinition {
        const ast = parse(source, { loc: true, range: true });
        const contractDefinition = ast.children.find(
            (node) => node.type === 'ContractDefinition',
        ) as ContractDefinition;

        return contractDefinition;
    }

    /**
     * Adds a module to the given Solidity source code.
     *
     * @param source - The Solidity source code to modify.
     * @param moduleName - The name of the module to add.
     * @returns A promise that resolves to the modified Solidity source code.
     */
    static async addModule(source: string, moduleName: string): Promise<string> {
        const moduleToAdd = AVAILABLE_MODULES[moduleName];

        if (!moduleToAdd) {
            throw new Error(`Module ${moduleName} not found`);
        }

        let modifiedSource = source;
        let ast = parse(modifiedSource, { loc: true, range: true });
        let contractDefinition = ast.children.find((node) => node.type === 'ContractDefinition') as ContractDefinition;

        // Step 1: Add import statement
        // Check if import statement for this module already exists in AST
        const importStatement = ast.children.find(
            (node) => node.type === 'ImportDirective' && node.path === moduleToAdd.import,
        );
        if (importStatement) {
            throw new Error(
                `Import statement for module ${moduleName} already exists in the ${contractDefinition.name} contract.`,
            );
        }

        // If import statement doesn't exist, add the import statement
        // All imports statement will be added after the pragma statement
        const pragmaRegex = /pragma solidity [^;]+;/;
        const pragmaMatch = modifiedSource.match(pragmaRegex);
        modifiedSource = modifiedSource.replace(pragmaMatch[0], `${pragmaMatch[0]}\n${moduleToAdd.import}`);

        // Step 2: Add inheritance
        // Check if the contract already inherits the module
        const baseContract = ast.children.find((node) => node.type === 'ContractDefinition')['baseContracts'];
        const currentInheritances: string[] = baseContract.map((node) => node.baseName.namePath);

        if (currentInheritances.includes(moduleToAdd.inheritance)) {
            throw new Error(`Contract ${contractDefinition.name} already inherits from ${moduleToAdd.inheritance}.`);
        }

        // If contract doesn't inherit the module already, add the inheritance.
        // Add the new inheritance at the beginning of the inheritance list
        // This can be refined later to add the inheritance at a specific location,
        // based on some sort of "precedence" or "order" defined in the module metadata

        // If there is already an inheritance, the regex will include the "contract MyContract is" part,
        // otherwise, it will only include "contract MyContract"
        const inheritanceRegex =
            currentInheritances.length > 0 ? /contract\s+(\w+)\s+is\s+([^({]+)\{/ : /contract\s+(\w+)\s*([^({]+)\{/;
        currentInheritances.unshift(moduleToAdd.inheritance);
        modifiedSource = modifiedSource.replace(
            inheritanceRegex,
            `contract ${contractDefinition.name} is ${currentInheritances.join(', ')} {`,
        );

        // Step 3: Modify constructor
        if (moduleToAdd.constructor?.params.length > 0 || moduleToAdd.constructor?.body) {
            // Check if constructor already exists
            const constructor = contractDefinition.subNodes.find(
                (node) => node.type === 'FunctionDefinition' && (node as FunctionDefinition).isConstructor,
            ) as FunctionDefinition;

            if (constructor) {
                const constructorRegex = /constructor\s*\(([^)]*)\)\s*(.*?)\{([\s\S]*?)\}/;
                const constructorMatch = modifiedSource.match(constructorRegex);

                if (!constructorMatch) {
                    // This will probably never happen because we already check for constructor through AST, but just in case
                    throw new Error('Constructor match not found');
                }

                const [fullMatch, params, modifiers, body] = constructorMatch;
                const newParams = [
                    ...new Set([...params.split(',').map((p) => p.trim()), ...moduleToAdd.constructor.params]),
                ]
                    .filter(Boolean)
                    .join(', ');

                let newConstructor = '';
                let newBody = '';
                let newModifiers = modifiers.trim();

                // Need to figure out where to place the constructor
                // In cases like ERC20, ERC721, etc., the constructor is placed in the initialization list
                // In other cases, the constructor body is placed in the constructor body itself
                if (moduleToAdd.constructor.placement === 'initialization_list') {
                    newModifiers = newModifiers + ` ${moduleToAdd.constructor.body}`;
                } else {
                    newBody = [body.trim(), moduleToAdd.constructor.body].filter(Boolean).join('\n        ');
                }

                newConstructor = `constructor(${newParams}) ${newModifiers}{\n        ${newBody}\n    }`;
                modifiedSource = modifiedSource.replace(constructorRegex, newConstructor);
            } else {
                // If constructor doesn't exist, add the constructor
                const contractBodyRegex = new RegExp(`contract ${contractDefinition.name} .* \{`);

                // Similarly, Check where to place the constructors
                if (moduleToAdd.constructor.placement === 'initialization_list') {
                    modifiedSource = modifiedSource.replace(
                        contractBodyRegex,
                        `$&\n    constructor(${moduleToAdd.constructor.params.join(', ')})  ${moduleToAdd.constructor.body} {}\n`,
                    );
                } else {
                    modifiedSource = modifiedSource.replace(
                        contractBodyRegex,
                        `$&\n    constructor(${moduleToAdd.constructor.params.join(', ')}) {\n        ${moduleToAdd.constructor.body}\n    }\n`,
                    );
                }
            }
        }

        // Step 4: Add functions/methods
        for (const method of moduleToAdd.methods) {
            // Need to re-parse the AST because we modified the source code
            // Re-parsing would give us the correct "end" of last function
            ast = parse(modifiedSource, { loc: true, range: true });
            contractDefinition = ast.children.find((node) => node.type === 'ContractDefinition') as ContractDefinition;

            // Check if function already exists
            const functionDefinition = contractDefinition.subNodes.find(
                (node) => node.type === 'FunctionDefinition' && (node as FunctionDefinition).name === method.name,
            ) as FunctionDefinition;

            // TODO: Can also replace the existing function with the new function, if needed. For now, just skip
            if (functionDefinition) {
                console.warn(
                    `Skipping function ${method.name} because it already exists in the contract ${contractDefinition.name}.`,
                );
                continue;
            }

            // If function doesn't exist, add the function
            // All new functions will be added after the last function definition
            const lastFunction = contractDefinition.subNodes
                .filter((node) => node.type === 'FunctionDefinition')
                .sort((a, b) => a.range[0] - b.range[0])
                .pop() as FunctionDefinition;

            modifiedSource =
                modifiedSource.slice(0, lastFunction.range[1] + 1) +
                `\n${method.body}` +
                modifiedSource.slice(lastFunction.range[1] + 1);
        }

        return await prettier.format(modifiedSource, {
            parser: 'solidity-parse',
            plugins: ['prettier-plugin-solidity'],
        });
    }

    /**
     * Removes a module from the given Solidity source code.
     *
     * @param source - The Solidity source code.
     * @param options - The name of the module to remove.
     * @returns A promise that resolves to modified Solidity source code with the module removed.
     */
    static async removeModule(source: string, moduleName: string): Promise<string> {
        /**
         * TODO: Implement this later
         *
         * Gist of the implementation:
         * Parse AST to find the module to remove
         * 1. Remove import statement
         * 2. Remove inheritance
         * 3. Remove constructor, if any
         * 4. Remove functions/methods, if any
         */
        console.warn('⚠️ Remove module not implemented yet. ⚠️');
        return source;
    }

    static saveModifiedFile(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}
