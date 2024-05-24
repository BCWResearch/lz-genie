import * as fs from 'fs';
import * as path from 'path';
import mock from 'mock-fs';
import { HardhatTaskUtil } from '../utils/hardhatTask';

import { jest } from '@jest/globals';
global.jest = jest;

describe('HardhatTaskUtil', () => {
    const tasksDir = '/test-tasks';
    const contractName = 'TestContract';
    const functionName = 'testFunction';
    const inputs = [{ name: 'param1', type: 'uint256' }];

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock file system
        mock({
            [tasksDir]: {
                'index.ts': ''
            },
        });
    });

    afterEach(() => {
        mock.restore();
    });

    describe('ensureDirectoryExists', () => {
        it('should create the directory if it does not exist', () => {
            mock({});
            HardhatTaskUtil.ensureDirectoryExists(tasksDir);
            expect(fs.existsSync(tasksDir)).toBe(true);
        });
    });

    describe('generateTaskFile', () => {
        it('should generate a task file', () => {
            HardhatTaskUtil.generateTaskFile(tasksDir, contractName, functionName, inputs);

            const tasksFile = path.join(tasksDir, `${contractName}_${functionName}.ts`);
            expect(fs.existsSync(tasksFile)).toBe(true);
        });
    });

    describe('updateIndexFile', () => {
        const indexFile = path.join(tasksDir, 'index.ts');
        const importStatement = `import './${contractName}_${functionName}';`;

        it('should add the import statement if not present', () => {
            HardhatTaskUtil.updateIndexFile(tasksDir, importStatement);
            const content = fs.readFileSync(indexFile, 'utf-8');
            expect(content.includes(importStatement)).toBe(true);
        });

        it('should not add the import statement if already present', () => {
            mock({
                [`${tasksDir}/index.ts`]: importStatement,
            });
            HardhatTaskUtil.updateIndexFile(tasksDir, importStatement);
            const content = fs.readFileSync(indexFile, 'utf-8');
            expect(content.split(importStatement).length).toBe(2);  // Original + added
        });
    });
});
