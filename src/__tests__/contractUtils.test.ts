import * as fs from 'fs';
import * as path from 'path';
import mock from 'mock-fs';
import { retrieveDeployedContracts, getContractABI, filterFunctions } from '../utils/contractUtils';
import { ContractABI } from '../interfaces';

import { jest } from '@jest/globals';
global.jest = jest;

describe('contractUtils', () => {
    const cwd = '/test-cwd';
    const contract = 'TestContract.sol';
    const contractFile = `${cwd}/artifacts/contracts/${contract.replace('.sol', '.json')}`;

    beforeAll(() => {
        jest.spyOn(process, 'cwd').mockReturnValue(cwd);
    });

    beforeEach(() => {
        mock({
            '/test-cwd/deployments/network1/TestContract.json': '{"abi":[]}',
            '/test-cwd/deployments/network2/TestContract.json': '{"abi":[]}',
            '/test-cwd/artifacts/contracts/TestContract.json': '{"abi":[]}',
        });
    });

    afterEach(() => {
        mock.restore();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('retrieveDeployedContracts', () => {
        it('should return deployed contracts', () => {
            const result = retrieveDeployedContracts(contract);
            expect(result).toEqual({
                network1: `${cwd}/deployments/network1/TestContract.json`,
                network2: `${cwd}/deployments/network2/TestContract.json`
            });
        });

        it('should return an empty object if deployments directory does not exist', () => {
            mock({});
            const result = retrieveDeployedContracts(contract);
            expect(result).toEqual({});
        });
    });

    describe('getContractABI', () => {
        it('should return the contract ABI', () => {
            const abi = [{ type: 'function', name: 'testFunction', inputs: [] }] as ContractABI[];
            mock({
                [contractFile]: JSON.stringify({ abi }),
            });

            const result = getContractABI(contractFile);
            expect(result).toEqual(abi);
        });

        it('should throw an error if contract file does not exist', () => {
            mock({});
            expect(() => getContractABI(contractFile)).toThrowError(`Contract file ${contractFile} does not exist.`);
        });
    });

    describe('filterFunctions', () => {
        const abi = [
            { type: 'function', stateMutability: 'view', name: 'getFunction' },
            { type: 'function', stateMutability: 'nonpayable', name: 'setFunction' }
        ] as ContractABI[];

        it('should return getter functions', () => {
            const result = filterFunctions(abi, 'getter');
            expect(result).toEqual([{ type: 'function', stateMutability: 'view', name: 'getFunction' }]);
        });

        it('should return setter functions', () => {
            const result = filterFunctions(abi, 'setter');
            expect(result).toEqual([{ type: 'function', stateMutability: 'nonpayable', name: 'setFunction' }]);
        });
    });
});
