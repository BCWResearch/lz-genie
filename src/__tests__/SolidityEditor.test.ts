import * as fs from 'fs';
import * as path from 'path';
import { SolidityEditor } from '../utils/solidityEditor';

const TEST_DIR = path.join(process.cwd(), 'src', '__tests__');

const readTestFile = (fileName: string): string => {
    const filePath = path.join(TEST_DIR, 'contracts', fileName);
    return fs.readFileSync(filePath, 'utf8');
};

describe('SolidityEditor', () => {
    it('should read Solidity file', () => {
        const filePath = path.join(TEST_DIR, 'contracts', 'MyContract.sol');
        const content = SolidityEditor.readSolidityFile(filePath);
        expect(content).toContain('pragma solidity ^0.8.0;');
        expect(content).toContain('contract MyContract {');
    });

    it('should get contract metadata', () => {
        const source = readTestFile('MyContract.sol');
        const metadata = SolidityEditor.getMetadata(source);
        expect(metadata.name).toBe('MyContract');
    });

    it('should add Ownable module', async () => {
        const source = readTestFile('MyContract.sol');
        const modifiedCode = await SolidityEditor.addModule(source, 'ownable');
        expect(modifiedCode).toContain('import "@openzeppelin/contracts/access/Ownable.sol";');
        expect(modifiedCode).toContain('contract MyContract is Ownable {');
        expect(modifiedCode).toContain('constructor(address initialOwner) {');
        expect(modifiedCode).toContain('Ownable(initialOwner);');
    });

    it('should throw error if module is not found', async () => {
        const source = readTestFile('MyContract.sol');
        await expect(SolidityEditor.addModule(source, 'nonexistent')).rejects.toThrow('Module nonexistent not found');
    });

    it('should throw error if import statement already exists', async () => {
        const source = readTestFile('Inherited.sol');
        await expect(SolidityEditor.addModule(source, 'ownable')).rejects.toThrow(
            'Contract MyContract already inherits from Ownable.',
        );
    });

    it('should throw error if contract already inherits module', async () => {
        const source = readTestFile('Inherited.sol');
        await expect(SolidityEditor.addModule(source, 'ownable')).rejects.toThrow(
            'Contract MyContract already inherits from Ownable.',
        );
    });

    it('should add module with constructor having different parameters', async () => {
        const source = readTestFile('MyContract.sol');
        const modifiedCode = await SolidityEditor.addModule(source, 'ERC20');
        expect(modifiedCode).toContain('import "@openzeppelin/contracts/token/ERC20/ERC20.sol";');
        expect(modifiedCode).toContain('contract MyContract is ERC20 {');
        expect(modifiedCode).toContain('constructor(string memory name, string memory symbol) ERC20(name, symbol)');
    });

    it('should add multiple modules to the same contract', async () => {
        let source = readTestFile('MyContract.sol');
        source = await SolidityEditor.addModule(source, 'ERC20');
        const modifiedCode = await SolidityEditor.addModule(source, 'ownable');
        expect(modifiedCode).toContain('import "@openzeppelin/contracts/access/Ownable.sol";');
        expect(modifiedCode).toContain('import "@openzeppelin/contracts/token/ERC20/ERC20.sol";');
        expect(modifiedCode).toContain('contract MyContract is Ownable, ERC20 {');

        expect(modifiedCode.replace(/[\t\n\r]/g, '').replace(/\s+/g, ' ')).toContain(
            `constructor( string memory name, string memory symbol, address initialOwner )`,
        );
        expect(modifiedCode).toContain('Ownable(initialOwner);');
        expect(modifiedCode).toContain('ERC20(name, symbol)');
    });

    it('should add module with methods', async () => {
        const source = readTestFile('MyContract.sol');
        const modifiedCode = await SolidityEditor.addModule(source, 'mintable');
        expect(modifiedCode).toContain('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Mintable.sol";');
        expect(modifiedCode).toContain('contract MyContract is ERC20Mintable {');
        expect(modifiedCode).toContain('constructor(address defaultAdmin) {');
        expect(modifiedCode).toContain('_grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);');
        expect(modifiedCode).toContain('function mint(address to, uint256 amount) public onlyOwner');
    });
});
