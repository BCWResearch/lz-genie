import { Project, SourceFile, ts, ObjectLiteralExpression, PropertyAssignment, ArrayLiteralExpression } from "ts-morph";

interface DVNConfig {
    requiredDVNs: string[];
    optionalDVNs: string[];
}

interface ConnectionConfig {
    sendConfig: {
        executorConfig: {
            maxMessageSize: number;
            executor: string;
        };
        ulnConfig: {
            confirmations: bigint;
            requiredDVNs: string[];
            optionalDVNs: string[];
            optionalDVNThreshold: number;
        };
    };
    receiveConfig: {
        ulnConfig: {
            confirmations: bigint;
            requiredDVNs: string[];
            optionalDVNs: string[];
            optionalDVNThreshold: number;
        };
    };
}

interface Connection {
    from: string;
    to: string;
    config?: ConnectionConfig;
}

interface Contract {
    name: string;
    details: ObjectLiteralExpression;
}

export class LayerZeroConfigManager {
    private project: Project;
    private sourceFile: SourceFile;
    private contractsCache: Contract[];

    constructor(filePath: string) {
        this.project = new Project({
            tsConfigFilePath: "tsconfig.json",
            skipAddingFilesFromTsConfig: true,
        });
        this.sourceFile = this.project.addSourceFileAtPath(filePath);
        this.contractsCache = this.cacheContracts();
    }

    private handleError(message: string): never {
        throw new Error(message);
    }

    private getConfigObject(): ObjectLiteralExpression {
        return this.sourceFile.getVariableDeclarationOrThrow("config").getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
    }

    private getArrayProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): ArrayLiteralExpression {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            this.handleError(`Property ${propertyName} not found.`);
        }
        const arrayLiteral = property.getInitializerIfKind(ts.SyntaxKind.ArrayLiteralExpression);
        if (!arrayLiteral) {
            this.handleError(`Property ${propertyName} is not an array.`);
        }
        return arrayLiteral;
    }

    private getObjectProperty(_objectLiteral: ObjectLiteralExpression, propertyName: string): ObjectLiteralExpression {
        const property = _objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            this.handleError(`Property ${propertyName} not found.`);
        }
        const objectLiteral = property.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression);
        if (!objectLiteral) {
            this.handleError(`Property ${propertyName} is not an object.`);
        }
        return objectLiteral;
    }

    private getBigIntProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): bigint {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            this.handleError(`Property ${propertyName} not found.`);
        }
        const value = property.getInitializer().getText().replace(/BigInt\(([^)]+)\)/, '$1').trim();
        if (!/^\d+$/.test(value)) {
            this.handleError(`Invalid BigInt value for ${propertyName}: ${value}`);
        }
        return BigInt(value);
    }

    private getNumberProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): number {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        if (!property) {
            this.handleError(`Property ${propertyName} not found.`);
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
                contracts.push({ name: contractName, details: contractObject });
            }
        });

        return contracts;
    }

    public listContracts(): string[] {
        return this.contractsCache.map(contract => contract.name);
    }

    public listDVNs(): Connection[] {
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

            const from = (configObject.getProperty("from") as PropertyAssignment)?.getInitializer().getText();
            const to = (configObject.getProperty("to") as PropertyAssignment)?.getInitializer().getText();

            const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
            if (!configProperty) {
                connectionDVNs.push({ from, to });
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

            const executor = this.getObjectProperty(sendConfig, "executorConfig").getProperty("executor")?.getText() || null;
            const executorAddress = null != executor ? executor.substring(executor.indexOf("'") + 1, executor.lastIndexOf("'")) : null;

            const connectionConfig: ConnectionConfig = {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: this.getNumberProperty(this.getObjectProperty(sendConfig, "executorConfig"), "maxMessageSize"),
                        executor: executorAddress,
                    },
                    ulnConfig: {
                        confirmations: this.getBigIntProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "confirmations"),
                        requiredDVNs: extractDVNConfig(sendConfig).requiredDVNs,
                        optionalDVNs: extractDVNConfig(sendConfig).optionalDVNs,
                        optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "optionalDVNThreshold"),
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: this.getBigIntProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "confirmations"),
                        requiredDVNs: extractDVNConfig(receiveConfig).requiredDVNs,
                        optionalDVNs: extractDVNConfig(receiveConfig).optionalDVNs,
                        optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "optionalDVNThreshold"),
                    },
                },
            };

            connectionDVNs.push({ from, to, config: connectionConfig });
        });

        return connectionDVNs;
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
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        return connections.getElements().map(element => {
            const configObject = element.asKind(ts.SyntaxKind.ObjectLiteralExpression);
            const from = (configObject?.getProperty("from") as PropertyAssignment)?.getInitializer().getText().replace(/['"]+/g, '');
            const to = (configObject?.getProperty("to") as PropertyAssignment)?.getInitializer().getText().replace(/['"]+/g, '');

            const configProperty = configObject.getProperty("config") as PropertyAssignment | undefined;
            if (!configProperty) {
                return { from, to };
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
            const executor = this.getObjectProperty(sendConfig, "executorConfig").getProperty("executor")?.getText() || null;
            const executorAddress = null != executor ? executor.substring(executor.indexOf("'") + 1, executor.lastIndexOf("'")) : null;

            const connectionConfig: ConnectionConfig = {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: this.getNumberProperty(this.getObjectProperty(sendConfig, "executorConfig"), "maxMessageSize"),
                        executor: executorAddress,
                    },
                    ulnConfig: {
                        confirmations: this.getBigIntProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "confirmations"),
                        requiredDVNs: extractDVNConfig(sendConfig).requiredDVNs,
                        optionalDVNs: extractDVNConfig(sendConfig).optionalDVNs,
                        optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(sendConfig, "ulnConfig"), "optionalDVNThreshold"),
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: this.getBigIntProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "confirmations"),
                        requiredDVNs: extractDVNConfig(receiveConfig).requiredDVNs,
                        optionalDVNs: extractDVNConfig(receiveConfig).optionalDVNs,
                        optionalDVNThreshold: this.getNumberProperty(this.getObjectProperty(receiveConfig, "ulnConfig"), "optionalDVNThreshold"),
                    },
                },
            };

            return {
                from,
                to,
                config: connectionConfig
            };
        });
    }

    public addConnection(fromContract: string, toContract: string) {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        const newConnectionObject = {
            from: fromContract,
            to: toContract,
            config: {
                sendConfig: {
                    executorConfig: {
                        maxMessageSize: 99,
                        executor: '0x71d7a02cDD38BEa35E42b53fF4a42a37638a0066',
                    },
                    ulnConfig: {
                        confirmations: 42,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 2,
                    },
                },
                receiveConfig: {
                    ulnConfig: {
                        confirmations: 42,
                        requiredDVNs: [],
                        optionalDVNs: [],
                        optionalDVNThreshold: 2,
                    },
                },
            },
        };

        const newConnectionString = JSON.stringify(newConnectionObject, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ).replace(/"([^"]+)":/g, '$1:')
            .replace(/"(\w+)"/g, "'$1'");

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
}
