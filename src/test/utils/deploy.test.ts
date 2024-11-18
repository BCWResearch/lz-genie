import { DeployUtils } from '../../utils/deploy';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import PostHogUtil from '../../utils/posthog';
import select from '@inquirer/select';
import { LayerZeroConfigManager } from '../../utils/lzConfigManager';
import confirm from '@inquirer/confirm';
import { DVNUtils } from '../../utils/dvn';
import { HardhatConfigParser } from '../../utils/hardhatConfigParser';
import { EventEmitter } from 'events';

// Mock all dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
jest.mock( '../../utils/posthog');
jest.mock('@inquirer/select');
jest.mock('@inquirer/confirm');
jest.mock('../../utils/lzConfigManager');
jest.mock('../../utils/dvn');
jest.mock('../../utils/hardhatConfigParser');

describe('DeployUtils', () => {
    // Create a mock process with EventEmitter
    const createMockProcess = () => {
        const mockProcess = new EventEmitter() as any;
        mockProcess.stdout = new EventEmitter();
        mockProcess.stderr = new EventEmitter();
        return mockProcess;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    describe('deployProject', () => {
        it('should deploy to a selected network successfully', async () => {
            // Mock dependencies
            const mockNetworks = { testnet: { eid: 1 } };
            (HardhatConfigParser.getNetworks as jest.Mock).mockResolvedValue(mockNetworks);
            (select as jest.Mock).mockResolvedValue('testnet');
            (confirm as jest.Mock).mockResolvedValue(false);

            const mockProcess = createMockProcess();
            (spawn as jest.Mock).mockReturnValue(mockProcess);

            // Start the deployment
            const deployPromise = DeployUtils.deployProject();

            // Simulate successful deployment
            mockProcess.stdout.emit('data', 'Deployment progress...');
            mockProcess.emit('exit', 0);

            await deployPromise;

            // Verify tracking events
            expect(PostHogUtil.trackEvent).toHaveBeenCalledWith('DEPLOY_PROJECT');
            expect(PostHogUtil.trackEvent).toHaveBeenCalledWith('DEPLOY_TO_testnet');
            expect(PostHogUtil.trackEvent).toHaveBeenCalledWith('DEPLOY_SUCCESS', expect.any(Object));

            // Verify spawn was called with correct arguments
            expect(spawn).toHaveBeenCalledWith(
                'npx',
                ['hardhat', 'deploy', '--network', 'testnet'],
                expect.any(Object)
            );
        });

        it('should handle deployment failure', async () => {
            // Mock dependencies
            const mockNetworks = { testnet: { eid: 1 } };
            (HardhatConfigParser.getNetworks as jest.Mock).mockResolvedValue(mockNetworks);
            (select as jest.Mock).mockResolvedValue('testnet');

            const mockProcess = createMockProcess();
            (spawn as jest.Mock).mockReturnValue(mockProcess);

            // Start the deployment
            const deployPromise = DeployUtils.deployProject();

            // Simulate failed deployment
            mockProcess.stderr.emit('data', 'Error during deployment');
            mockProcess.emit('exit', 1);

            await deployPromise;

            // Verify failure tracking
            expect(PostHogUtil.trackEvent).toHaveBeenCalledWith('DEPLOY_FAILED', expect.any(Object));
        });

        it('should handle DVN configuration when deployment succeeds', async () => {
            // Mock dependencies
            const mockNetworks = { testnet: { eid: 1 } };
            (HardhatConfigParser.getNetworks as jest.Mock).mockResolvedValue(mockNetworks);
            (select as jest.Mock).mockResolvedValue('testnet');
            (confirm as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(true);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const mockProcess = createMockProcess();
            (spawn as jest.Mock).mockReturnValue(mockProcess);

            // Start the deployment
            const deployPromise = DeployUtils.deployProject();

            // Simulate successful deployment
            mockProcess.stdout.emit('data', 'Deployment success');
            mockProcess.emit('exit', 0);

            await deployPromise;

            // Verify DVN configuration was attempted
            expect(DVNUtils.configureDVN).toHaveBeenCalledWith(0);
            expect(DVNUtils.setDVNConfig).toHaveBeenCalled();
        });
    });

    describe('fetchDeployedContracts', () => {
        it('should fetch deployed contracts successfully', async () => {
            // Mock file system operations
            const mockContractData = { address: '0x123' };
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readdirSync as jest.Mock)
                .mockReturnValueOnce(['testnet']) // networks
                .mockReturnValueOnce(['Contract.json']); // contract files
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockContractData));

            const contracts = await DeployUtils.fetchDeployedContracts();

            expect(contracts).toEqual({
                Contract: {
                    testnet: '0x123'
                }
            });
        });

        it('should handle missing deployments directory', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const contracts = await DeployUtils.fetchDeployedContracts();

            expect(contracts).toEqual({});
        });
    });

    describe('compileContracts', () => {
        it('should compile contracts successfully', async () => {
            const mockProcess = createMockProcess();
            (spawn as jest.Mock).mockReturnValue(mockProcess);

            const compilePromise = DeployUtils.compileContracts();

            mockProcess.emit('exit', 0);

            const result = await compilePromise;
            expect(result).toBe(0);
            expect(spawn).toHaveBeenCalledWith(
                'npx',
                ['hardhat', 'compile'],
                expect.any(Object)
            );
        });

        it('should handle compilation failure', async () => {
            const mockProcess = createMockProcess();
            (spawn as jest.Mock).mockReturnValue(mockProcess);

            const compilePromise = DeployUtils.compileContracts();

            const error = new Error('Compilation failed');
            mockProcess.emit('error', error);

            await expect(compilePromise).rejects.toEqual(error);
        });
    });
});