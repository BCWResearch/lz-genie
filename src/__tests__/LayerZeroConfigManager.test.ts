import { LayerZeroConfigManager } from '../utils/lzConfigManager';
import * as fs from 'fs';
import * as path from 'path';



const sampleConfigPath = path.resolve(process.cwd(), 'layerzero.config.ts');

const sampleConfigContent = `
import { EndpointId } from '@layerzerolabs/lz-definitions'

import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOApp',
}

const fujiContract: OmniPointHardhat = {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    contractName: 'MyOApp',
}

const amoyContract: OmniPointHardhat = {
    eid: EndpointId.AMOY_V2_TESTNET,
    contractName: 'MyOApp',
}

const config: OAppOmniGraphHardhat = {
    contracts: [
        {
            contract: fujiContract,
        },
        {
            contract: sepoliaContract,
        },
        {
            contract: amoyContract,
        },
    ],
    connections: [
        {
            from: fujiContract,
            to: sepoliaContract,
            config: {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 99,
                        executor: '0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066',
                    },
                    ulnConfig: {
                        confirmations: BigInt(42),
                        requiredDVNs: [],
                        optionalDVNs: [
                            '0xe9dCF5771a48f8DC70337303AbB84032F8F5bE3E',
                            '0x0AD50201807B615a71a39c775089C9261A667780',
                        ],
                        optionalDVNThreshold: 2,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: BigInt(42),
                        requiredDVNs: [],
                        optionalDVNs: [
                            '0x3Eb0093E079EF3F3FC58C41e13FF46c55dcb5D0a',
                            '0x0AD50201807B615a71a39c775089C9261A667780',
                        ],
                        optionalDVNThreshold: 2,
                    },
                },
            },
        },
        {
            from: fujiContract,
            to: amoyContract,
        },
        {
            from: sepoliaContract,
            to: fujiContract,
        },
        {
            from: sepoliaContract,
            to: amoyContract,
        },
        {
            from: amoyContract,
            to: sepoliaContract,
        },
        {
            from: amoyContract,
            to: fujiContract,
        },
    ],
}

export default config;
`;

beforeAll(() => {
    fs.writeFileSync(sampleConfigPath, sampleConfigContent);
});

afterAll(() => {
    fs.unlinkSync(sampleConfigPath);
});

describe('LayerZeroConfigManager', () => {
    let manager: LayerZeroConfigManager;

    beforeEach(() => {
        manager = new LayerZeroConfigManager(sampleConfigPath);
    });

    test('should list contracts', () => {
        const contracts = manager.listContracts();
        expect(contracts).toEqual([
            'fujiContract',
            'sepoliaContract',
            'amoyContract',
        ]);
    });

    test('should list DVNs', () => {
        const dvns = manager.listDVNs();
        expect(dvns).toEqual([
            {
                from: 'fujiContract',
                to: 'sepoliaContract',
                dvns: {
                    sendConfig: {
                        requiredDVNs: [],
                        optionalDVNs: [
                            '0xe9dCF5771a48f8DC70337303AbB84032F8F5bE3E',
                            '0x0AD50201807B615a71a39c775089C9261A667780',
                        ],
                    },
                    receiveConfig: {
                        requiredDVNs: [],
                        optionalDVNs: [
                            '0x3Eb0093E079EF3F3FC58C41e13FF46c55dcb5D0a',
                            '0x0AD50201807B615a71a39c775089C9261A667780',
                        ],
                    },
                },
            },
        ]);
    });

    test('should add a DVN', () => {
        manager.addDVN('0xNewDVNAddress', 'fujiContract', 'sepoliaContract', 'sendConfig', 'optionalDVNs');
        manager.saveChanges();

        const dvns = manager.listDVNs();
        expect(dvns.find(dvn => dvn.from === 'fujiContract' && dvn.to === 'sepoliaContract')?.dvns.sendConfig.optionalDVNs).toContain('0xNewDVNAddress');
    });

    test('should remove a DVN', () => {
        manager.removeDVN('0x0AD50201807B615a71a39c775089C9261A667780', 'fujiContract', 'sepoliaContract', 'sendConfig', 'optionalDVNs');
        manager.saveChanges();

        const dvns = manager.listDVNs();
        expect(dvns.find(dvn => dvn.from === 'fujiContract' && dvn.to === 'sepoliaContract')?.dvns.sendConfig.optionalDVNs).not.toContain('0x0AD50201807B615a71a39c775089C9261A667780');
    });

    test('should list connections', () => {
        const connections = manager.listConnections();
        expect(connections).toContain(`{
    from: fujiContract,
    to: sepoliaContract,
    config: {
        sendConfig: {
            executorConfig: {
                maxMessageSize: 99,
                executor: '0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066',
            },
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [
                    '0xe9dCF5771a48f8DC70337303AbB84032F8F5bE3E',
                    '0x0AD50201807B615a71a39c775089C9261A667780',
                ],
                optionalDVNThreshold: 2,
            },
        },
        receiveConfig: {
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [
                    '0x3Eb0093E079EF3F3FC58C41e13FF46c55dcb5D0a',
                    '0x0AD50201807B615a71a39c775089C9261A667780',
                ],
                optionalDVNThreshold: 2,
            },
        },
    },
}`);
    });

    test('should add a connection', () => {
        manager.addConnection('fujiContract', 'newContract');
        manager.saveChanges();

        const connections = manager.listConnections();
        expect(connections).toContain(`{
    from: fujiContract,
    to: newContract,
    config: {
        sendConfig: {
            executorConfig: {
                maxMessageSize: 99,
                executor: '0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066',
            },
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [],
                optionalDVNThreshold: 2,
            },
        },
        receiveConfig: {
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [],
                optionalDVNThreshold: 2,
            },
        },
    },
}`);
    });

    test('should remove a connection', () => {
        manager.removeConnection('fujiContract', 'sepoliaContract');
        manager.saveChanges();

        const connections = manager.listConnections();
        expect(connections).not.toContain(`{
    from: fujiContract,
    to: sepoliaContract,
    config: {
        sendConfig: {
            executorConfig: {
                maxMessageSize: 99,
                executor: '0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066',
            },
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [
                    '0xe9dCF5771a48f8DC70337303AbB84032F8F5bE3E',
                    '0x0AD50201807B615a71a39c775089C9261A667780',
                ],
                optionalDVNThreshold: 2,
            },
        },
        receiveConfig: {
            ulnConfig: {
                confirmations: BigInt(42),
                requiredDVNs: [],
                optionalDVNs: [
                    '0x3Eb0093E079EF3F3FC58C41e13FF46c55dcb5D0a',
                    '0x0AD50201807B615a71a39c775089C9261A667780',
                ],
                optionalDVNThreshold: 2,
            },
        },
    },
}`);
    });
});
