import { LayerZeroConfigManager } from '../utils/lzConfigManager';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { LAYER_ZERO_CONFIG_FILE_NAME } from '../constants';

const tempDir = os.tmpdir();
const configFilePath = path.join(tempDir, LAYER_ZERO_CONFIG_FILE_NAME);

const mockConfigContent = `
import { EndpointId } from '@layerzerolabs/lz-definitions'
import type { OAppOmniGraphHardhat, OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

const sepoliaContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOApp',
}

const fujiContract = {
    eid: EndpointId.AVALANCHE_V2_TESTNET,
    contractName: 'MyOApp',
}

const amoyContract = {
    eid: EndpointId.AMOY_V2_TESTNET,
    contractName: 'MyOApp',
}

const config = {
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
    ],
}

export default config;
`;

const parseBigIntJson = (key: string, value: any) => {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
};

describe('LayerZeroConfigManager', () => {
    let manager: LayerZeroConfigManager;

    beforeAll(() => {

    });

    beforeEach(() => {
        // Write the mock config file to the temp directory
        fs.writeFileSync(configFilePath, mockConfigContent);
        manager = new LayerZeroConfigManager(configFilePath);
    });

    it('should list all contracts', () => {
        const contracts = manager.listContracts();
        expect(contracts).toEqual([
            {
                "contractName": "fujiContract",
                "eid": "EndpointId.AVALANCHE_V2_TESTNET",
                "resolvedEid": 40106,
            },
            {
                "contractName": "sepoliaContract",
                "eid": "EndpointId.SEPOLIA_V2_TESTNET",
                "resolvedEid": 40161,
            },
            {
                "contractName": "amoyContract",
                "eid": "EndpointId.AMOY_V2_TESTNET",
                "resolvedEid": 40267,
            }
        ]);
    });

    it('should list all DVNs', () => {
        const dvns = manager.listDVNs();
        const serializedDvns = JSON.parse(JSON.stringify(dvns, parseBigIntJson));
        expect(serializedDvns).toEqual([
            {
                from: {
                    eid: 40161,
                    contractName: "DummyDefault"
                },
                to: {
                    eid: 40161,
                    contractName: "DummyDefault"
                },
                config: {
                    sendConfig: {
                        executorConfig: {
                            maxMessageSize: 99,
                            executor: "0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066"
                        },
                        ulnConfig: {
                            confirmations: "0",
                            requiredDVNs: [],
                            optionalDVNs: [
                                "0xe9dCF5771a48f8DC70337303AbB84032F8F5bE3E",
                                "0x0AD50201807B615a71a39c775089C9261A667780"
                            ],
                            optionalDVNThreshold: 2
                        }
                    },
                    receiveConfig: {
                        ulnConfig: {
                            confirmations: "0",
                            requiredDVNs: [],
                            optionalDVNs: [
                                "0x3Eb0093E079EF3F3FC58C41e13FF46c55dcb5D0a",
                                "0x0AD50201807B615a71a39c775089C9261A667780"
                            ],
                            optionalDVNThreshold: 2
                        }
                    }
                }
            },
            {
                from: {
                    eid: 40161,
                    contractName: "DummyDefault"
                },
                to: {
                    eid: 40161,
                    contractName: "DummyDefault"
                }
            },
            {
                from: {
                    eid: 40161,
                    contractName: "DummyDefault"
                },
                to: {
                    eid: 40161,
                    contractName: "DummyDefault"
                }
            }
        ]);
    });

    it('should add a new DVN to the optionalDVNs list', () => {
        manager.addDVN(
            '0xNewDVNAddress',
            'fujiContract',
            'sepoliaContract',
            'sendConfig',
            'optionalDVNs'
        );

        const dvns = manager.listDVNs();
        const serializedDvns = JSON.parse(JSON.stringify(dvns, parseBigIntJson));
        expect(serializedDvns[0].config?.sendConfig.ulnConfig.optionalDVNs).toContain('0xNewDVNAddress');
    });

    it('should remove an existing DVN from the optionalDVNs list', () => {
        manager.removeDVN(
            '0x0AD50201807B615a71a39c775089C9261A667780',
            'fujiContract',
            'sepoliaContract',
            'sendConfig',
            'optionalDVNs'
        );

        const dvns = manager.listDVNs();
        const serializedDvns = JSON.parse(JSON.stringify(dvns, parseBigIntJson));
        expect(serializedDvns[0].config?.sendConfig.ulnConfig.optionalDVNs).not.toContain('0x0AD50201807B615a71a39c775089C9261A667780');
    });

    it('should add a new connection', () => {
        manager.addConnection('sepoliaContract', 'amoyContract');
        const connections = manager.listConnections();
        const serializedConnections = JSON.parse(JSON.stringify(connections, parseBigIntJson));
        expect(serializedConnections[3]?.from?.contractName).toEqual('sepoliaContract');
        expect(serializedConnections[3]?.to?.contractName).toEqual('amoyContract');
    });

    it('should remove an existing connection', () => {
        manager.removeConnection('fujiContract', 'amoyContract');

        const connections = manager.listConnections();
        const serializedConnections = JSON.parse(JSON.stringify(connections, parseBigIntJson));
        expect(serializedConnections).not.toContainEqual({
            from: 'fujiContract',
            to: 'amoyContract',
        });
    });

    afterAll(() => {
        // Clean up the mock config file
        fs.unlinkSync(configFilePath);
    });
});
