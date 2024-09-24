import * as path from 'path';
import { Project, SourceFile, ts, ObjectLiteralExpression, PropertyAssignment, ArrayLiteralExpression, SyntaxKind, VariableDeclarationKind, Statement, Expression } from "ts-morph";
import type { OAppEdgeConfig, OAppOmniGraphHardhat, OmniPointHardhat, Uln302ExecutorConfig } from '@layerzerolabs/toolbox-hardhat'
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { Connection, Contract, DVNConfig, FlattenOmniPointHardhat } from "../interfaces/lzConfigManager";
import { LAYER_ZERO_CONFIG_FILE_NAME } from '../constants';

const ophDefault: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'DummyDefault',
} as any

export class LayerZeroConfigManager {
    private project: Project;
    private sourceFile: SourceFile;
    private contractsCache: Contract[];
    private oAppOmniGraphHardhat: FlattenOmniPointHardhat;

    constructor(filePath: string) {
        this.project = new Project({
            tsConfigFilePath: "tsconfig.json",
            skipAddingFilesFromTsConfig: true,
        });
        this.sourceFile = this.project.addSourceFileAtPath(filePath);
        this.contractsCache = this.cacheContracts();
        this.oAppOmniGraphHardhat = this.cacheOmniPointHardhatObjects();
    }

    private getConfigObject(): ObjectLiteralExpression {
        return this.sourceFile.getVariableDeclarationOrThrow("config").getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
    }

    private getContractDefinition(contractVariableName: string): Contract {
        const ret = this.sourceFile.getVariableDeclarationOrThrow(contractVariableName);
        const contractObject = ret.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
        const contractName = (contractObject.getProperty("contractName") as PropertyAssignment)
            ?.getInitializer()
            .getText()
            .replaceAll("\"", "")
            .replaceAll("'", "");
        const eid = (contractObject.getProperty("eid") as PropertyAssignment)?.getInitializer().getText() as any;
        return { contractName, eid };
    }

    private getArrayProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): ArrayLiteralExpression | undefined {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            return undefined;
        }
        const arrayLiteral = property.getInitializerIfKind(ts.SyntaxKind.ArrayLiteralExpression);
        if (!arrayLiteral) {
            return undefined;
        }
        return arrayLiteral;
    }

    private getObjectProperty(_objectLiteral: ObjectLiteralExpression, propertyName: string): ObjectLiteralExpression | undefined {
        const property = _objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            return undefined;
        }
        const objectLiteral = property.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression);
        if (!objectLiteral) {
            return undefined;
        }
        return objectLiteral;
    }

    private getBigIntProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): bigint | undefined {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            return undefined;
        }
        const value = property.getInitializer().getText().replace(/BigInt\(([^)]+)\)/, '$1').trim();
        if (!/^\d+$/.test(value)) {
            return undefined;
        }
        return BigInt(value);
    }

    private getNumberProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): number | undefined {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            return undefined;
        }
        const value = property.getInitializer().getText().trim();
        return Number(value);
    }

    private cacheContracts(): Contract[] {
        const config = this.getConfigObject();
        const contractsArray = this.getArrayProperty(config, "contracts");

        if (!contractsArray) {
            console.error("Contracts array not found.");
            return [];
        }

        const contracts: Contract[] = [];
        contractsArray.getElements().forEach(element => {
            const contractObject = element.asKind(ts.SyntaxKind.ObjectLiteralExpression);
            if (contractObject) {
                const contractName = (contractObject.getProperty("contract") as PropertyAssignment)?.getInitializer().getText();
                const definition = this.getContractDefinition(contractName);
                const resolvedEid = EndpointId[definition.eid.replace("EndpointId.", "")]
                contracts.push({ contractName, eid: definition.eid, resolvedEid });
            }
        });

        return contracts;
    }

    public createContract(contractName: string): Expression<ts.Expression> {
        let element: Expression<ts.Expression> | null = null;
        try {
            const config = this.getConfigObject();
            const contracts = this.getArrayProperty(config, "contracts");

            if (contracts && !contracts.getText().includes(contractName)) {
                element = contracts.addElement(`{ contract: ${contractName} }`);
            }
            this.sourceFile.saveSync();
        } catch (e) {
            console.error(`Error creating contract ${contractName}:`, e);
        }
        return element;
    }

    public cacheOmniPointHardhatObjects(): FlattenOmniPointHardhat {
        try {
            // get variable declarations
            const variablesWithOmniPointHardhat = this.sourceFile.getVariableDeclarations().filter(variable => {
                const typeNode = variable.getTypeNode();
                return typeNode && typeNode.getText() === "OmniPointHardhat";
            });
            return variablesWithOmniPointHardhat.map(variable => {
                const key = variable.getName();
                const value = variable.getInitializer()?.getText();
                return { [key]: value };
            }).reduce((acc, curr) => ({ ...acc, ...curr }), {});
        } catch (e) {
            console.error("Error caching OmniPointHardhat objects:", e);
            return {};
        }
    }

    public isOmniPointHardhatObject(name: string) {
        return Object.keys(this.oAppOmniGraphHardhat || {}).includes(name);
    }

    public createOmniPointHardhatObject(name: string, eid: string): Statement[] {
        try {
            const objectLiteralText = `{
                eid: ${eid},
                contractName: contractName,
              }`;
            // Find the target node where the new variable will be inserted before
            const configDeclaration = this.sourceFile.getVariableDeclaration("config");
            if (!configDeclaration) return;

            const configStatement = configDeclaration.getVariableStatement();
            if (configStatement) {
                const insertPosition = configStatement.getChildIndex();

                // Insert the new variable statement right before the config statement
                const staements = this.sourceFile.insertStatements(insertPosition, [
                    `const ${name}: OmniPointHardhat = ${objectLiteralText};`
                ]);

                // Save the updated source file
                this.sourceFile.saveSync();

                // Update cached OmniPointHardhat objects
                this.oAppOmniGraphHardhat = this.cacheOmniPointHardhatObjects();
                return staements;
            }

        } catch (e) {
            console.error(`Error creating OmniPointHardhat object ${name}:`, e);
        }
        return [];
    }

    public deleteOmniPointHardhatObject(name: string): boolean {
        try {
            const variableDeclaration = this.sourceFile.getVariableDeclaration(name);
            if (variableDeclaration) {
                variableDeclaration.remove();
                this.sourceFile.saveSync();
                return true;
            }
        } catch (e) {
            console.error(`Error deleting OmniPointHardhat object ${name}:`, e);
        }
        return false;
    }

    public listContracts(): Contract[] {
        return this.contractsCache;
    }

    public listDVNs(): Connection[] {
        try {
            const config = this.getConfigObject();
            const connections = this.getArrayProperty(config, "connections");

            if (!connections) {
                console.error("Connections array not found.");
                return [];
            }

            const connectionDVNs: Connection[] = [];
            connections.getElements().forEach(connection => {
                const configObject = connection.asKind(ts.SyntaxKind.ObjectLiteralExpression);
                if (!configObject) {
                    console.error("Config object not found in connection.");
                    return;
                }

                // DISABLED FOR FIRST ITERATION
                // const from = (configObject.getProperty("from") as PropertyAssignment)?.getInitializer().getText();
                // const to = (configObject.getProperty("to") as PropertyAssignment)?.getInitializer().getText();

                const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
                if (!configProperty) {
                    connectionDVNs.push({ from: ophDefault, to: ophDefault });
                    return;
                }

                const sendConfig = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), "sendConfig");
                const receiveConfig = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), "receiveConfig");

                const extractDVNConfig = (config: ObjectLiteralExpression | undefined): DVNConfig => {
                    if (!config) return { requiredDVNs: [], optionalDVNs: [] };
                    const ulnConfig = this.getObjectProperty(config, "ulnConfig");
                    const requiredDVNs = this.getArrayProperty(ulnConfig, "requiredDVNs");
                    const optionalDVNs = this.getArrayProperty(ulnConfig, "optionalDVNs");

                    return {
                        requiredDVNs: requiredDVNs.getElements().map(element => element.getText().replace(/['"]+/g, '')),
                        optionalDVNs: optionalDVNs.getElements().map(element => element.getText().replace(/['"]+/g, '')),
                    };
                };

                const executorConfig = this.getObjectProperty(sendConfig, "executorConfig") || undefined;
                const executor = executorConfig?.getProperty("executor")?.getText() || null;
                const executorAddress = null != executor ? executor.substring(executor.indexOf("'") + 1, executor.lastIndexOf("'")) : null;

                const connectionConfig: OAppEdgeConfig = {
                    sendConfig: {
                        executorConfig: {
                            maxMessageSize: executorConfig ? this.getNumberProperty(this.getObjectProperty(sendConfig, "executorConfig"), "maxMessageSize") : 10000,
                            executor: executorAddress,
                        },
                        ulnConfig: {
                            // not necessary list output
                            confirmations: BigInt(0),
                            // this.getBigIntProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "confirmations"),
                            requiredDVNs: extractDVNConfig(sendConfig).requiredDVNs,
                            optionalDVNs: extractDVNConfig(sendConfig).optionalDVNs,
                            optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "optionalDVNThreshold"),
                        },
                    },
                    receiveConfig: {
                        ulnConfig: {
                            // not necessary list output
                            confirmations: BigInt(0),
                            // this.getBigIntProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "confirmations"),
                            requiredDVNs: extractDVNConfig(receiveConfig).requiredDVNs,
                            optionalDVNs: extractDVNConfig(receiveConfig).optionalDVNs,
                            optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "optionalDVNThreshold"),
                        },
                    },
                };

                connectionDVNs.push({ from: ophDefault, to: ophDefault, config: connectionConfig });
            });
            return connectionDVNs;
        } catch (e) {
            console.error("Error listing DVNs:", e);
        }
        return [];
    }

    public addDVN(newDVN: string, fromContract: string, toContract: string, configType: "sendConfig" | "receiveConfig", dvnType: "requiredDVNs" | "optionalDVNs") {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        connections?.getElements().forEach(connection => {
            const configObject = connection.asKind(ts.SyntaxKind.ObjectLiteralExpression);
            const from = (configObject?.getProperty("from") as PropertyAssignment)?.getInitializer().getText();
            const to = (configObject?.getProperty("to") as PropertyAssignment)?.getInitializer().getText();

            if (from !== fromContract || to !== toContract) {
                return;
            }

            const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
            if (!configProperty) {
                console.warn(`No config found for connection from ${from} to ${to}`);
                return;
            }

            const configNode = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), configType);
            const addDvnToConfig = (config: ObjectLiteralExpression | undefined) => {
                if (!config) return;
                const ulnConfig = this.getObjectProperty(config, "ulnConfig");
                const dvnArray = this.getArrayProperty(ulnConfig, dvnType);
                if (dvnArray && !dvnArray.getText().includes(newDVN)) {
                    dvnArray.addElement(`'${newDVN}'`);
                }
            };

            addDvnToConfig(configNode);
        });
    }

    public removeDVN(dvnToRemove: string, fromContract: string, toContract: string, configType: "sendConfig" | "receiveConfig", dvnType: "requiredDVNs" | "optionalDVNs") {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        connections?.getElements().forEach(connection => {
            const configObject = connection.asKind(ts.SyntaxKind.ObjectLiteralExpression);
            const from = (configObject?.getProperty("from") as PropertyAssignment)?.getInitializer().getText();
            const to = (configObject?.getProperty("to") as PropertyAssignment)?.getInitializer().getText();

            if (from !== fromContract || to !== toContract) {
                return;
            }

            const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
            if (!configProperty) {
                console.warn(`No config found for connection from ${from} to ${to}`);
                return;
            }

            const configNode = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), configType);
            const removeDvnFromConfig = (config: ObjectLiteralExpression | undefined) => {
                if (!config) return;
                const ulnConfig = this.getObjectProperty(config, "ulnConfig");
                const dvnArray = this.getArrayProperty(ulnConfig, dvnType);
                if (dvnArray) {
                    dvnArray.getElements().forEach((element, index) => {
                        if (element.getText().replace(/['"]+/g, '') === dvnToRemove) {
                            dvnArray.removeElement(index);
                        }
                    });
                }
            };

            removeDvnFromConfig(configNode);
        });
    }

    public listConnections(): Connection[] {
        try {
            const config = this.getConfigObject();
            const connections = this.getArrayProperty(config, "connections");

            return connections.getElements().map(element => {
                const configObject = element.asKind(ts.SyntaxKind.ObjectLiteralExpression);
                const from = (configObject?.getProperty("from") as PropertyAssignment)?.getInitializer().getText().replace(/['"]+/g, '');
                const to = (configObject?.getProperty("to") as PropertyAssignment)?.getInitializer().getText().replace(/['"]+/g, '');

                const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
                if (!configProperty) {
                    return { from: ophDefault, to: ophDefault };
                }

                const sendConfig = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), "sendConfig");
                const receiveConfig = this.getObjectProperty(configProperty.getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression), "receiveConfig");

                const extractDVNConfig = (config: ObjectLiteralExpression | undefined): DVNConfig => {
                    if (!config) return { requiredDVNs: [], optionalDVNs: [] };
                    const ulnConfig = this.getObjectProperty(config, "ulnConfig");
                    const requiredDVNs = this.getArrayProperty(ulnConfig, "requiredDVNs");
                    const optionalDVNs = this.getArrayProperty(ulnConfig, "optionalDVNs");

                    return {
                        requiredDVNs: requiredDVNs.getElements().map(element => element.getText().replace(/['"]+/g, '')),
                        optionalDVNs: optionalDVNs.getElements().map(element => element.getText().replace(/['"]+/g, '')),
                    };
                };
                const executorConfig = this.getObjectProperty(sendConfig, "executorConfig");
                const executor = executorConfig?.getProperty("executor")?.getText() || null;
                const executorAddress = null != executor ? executor.substring(executor.indexOf("'") + 1, executor.lastIndexOf("'")) : null;

                const connectionConfig: OAppEdgeConfig = {
                    sendConfig: {
                        executorConfig: {
                            maxMessageSize: executorConfig ? this.getNumberProperty(executorConfig, "maxMessageSize") : 0,
                            executor: executorAddress,
                        },
                        ulnConfig: {
                            // TODO: fix `getBigIntProperty` in next revision
                            confirmations: BigInt(0),
                            // this.getBigIntProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "confirmations"),
                            requiredDVNs: extractDVNConfig(sendConfig).requiredDVNs,
                            optionalDVNs: extractDVNConfig(sendConfig).optionalDVNs,
                            optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "optionalDVNThreshold"),
                        },
                    },
                    receiveConfig: {
                        ulnConfig: {
                            confirmations: BigInt(0),
                            //this.getBigIntProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "confirmations"),
                            requiredDVNs: extractDVNConfig(receiveConfig).requiredDVNs,
                            optionalDVNs: extractDVNConfig(receiveConfig).optionalDVNs,
                            optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "optionalDVNThreshold"),
                        },
                    },
                };

                return {
                    from: this.contractsCache.find(c => c.contractName === from) as unknown as OmniPointHardhat,
                    to: this.contractsCache.find(c => c.contractName === to) as unknown as OmniPointHardhat,
                    config: connectionConfig
                };
            });
        } catch (e) {
            console.error("Error listing connections:", e);
        }
        return [];
    }

    public addConnection(fromContract: string, toContract: string) {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");
        const newConnectionObject = {
            from: fromContract,
            to: toContract,
            config: {
                sendConfig: {
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
        };

        const newConnectionString = JSON.stringify(newConnectionObject,
            // TODO: Move serialization to a separate util function
            (key, value) => typeof value === 'bigint' ? `BigInt(${value.toString()})` : value
        ).replaceAll("\"", '');

        if (connections && !connections.getText().includes(newConnectionString)) {
            connections.addElement(newConnectionString);
        }
    }

    public removeConnection(fromContract: string, toContract: string) {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        connections?.getElements().forEach((element, index) => {
            const configObject = element.asKind(ts.SyntaxKind.ObjectLiteralExpression);
            const from = (configObject?.getProperty("from") as PropertyAssignment)?.getInitializer().getText();
            const to = (configObject?.getProperty("to") as PropertyAssignment)?.getInitializer().getText();
            if (from === fromContract && to === toContract) {
                connections.removeElement(index);
            }
        });
    }

    public saveChanges() {
        this.sourceFile.saveSync();
    }

    public static getDefaultLzConfigPath() {
        const cwd = process.cwd();
        return path.join(cwd, LAYER_ZERO_CONFIG_FILE_NAME);
    }
}
