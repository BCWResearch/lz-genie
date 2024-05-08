import { SolidityEditor, SolidityModificationOptions } from '../utils/solidityEditor';

describe('SolidityEditor', () => {
    const sampleCode = `
pragma solidity ^0.8.0;

contract MyContract {
    uint256 public count = 0;

    function increment() public {
        count += 1;
    }

    function decrement() public {
        count -= 1;
    }
}
`;

    it('should add an import statement', async () => {
        const options: SolidityModificationOptions = {
            addImport: 'AnotherContract.sol'
        };
        const result = await SolidityEditor.modifySolidityCode(sampleCode, options);
        expect(result).toContain('import "AnotherContract.sol";');
    });

    it('should add a new function', async () => {
        const options: SolidityModificationOptions = {
            addFunctions: ['function newFunction() public {}']
        };
        const result = await SolidityEditor.modifySolidityCode(sampleCode, options);
        expect(result).toContain('function newFunction() public {}');
    });

    it('should remove a function', async () => {
        const options: SolidityModificationOptions = {
            removeFunctions: ['decrement']
        };
        const result = await SolidityEditor.modifySolidityCode(sampleCode, options);
        expect(result).not.toContain('function decrement()');
    });

    it('should insert code at the start of an existing function', async () => {
        const options: SolidityModificationOptions = {
            functionModifications: [
                { functionName: 'increment', newCode: 'require(count < 10);', position: 'start' }
            ]
        };
        const result = await SolidityEditor.modifySolidityCode(sampleCode, options);
        expect(result).toMatch(/function increment\(\) public {\s+require\(count < 10\);/);
    });

    it('should insert code at the end of an existing function', async () => {
        const options: SolidityModificationOptions = {
            functionModifications: [
                { functionName: 'increment', newCode: 'emit Increment(count);', position: 'end' }
            ]
        };
        const result = await SolidityEditor.modifySolidityCode(sampleCode, options);
        expect(result).toMatch(/emit Increment\(count\);/);
    });
});
