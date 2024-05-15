import { Project, SourceFile, ts, Node, ObjectLiteralExpression, PropertyAssignment, ArrayLiteralExpression } from "ts-morph";

interface DVNConfig {
    sendConfig: {
        requiredDVNs: string[];
        optionalDVNs: string[];
    };
    receiveConfig: {
        requiredDVNs: string[];
        optionalDVNs: string[];
    };
}

interface Connection {
    from: string;
    to: string;
    dvns: DVNConfig;
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

    private getConfigObject(): ObjectLiteralExpression {
        return this.sourceFile.getVariableDeclarationOrThrow("config").getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
    }

    private getArrayProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): ArrayLiteralExpression | undefined {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        return property?.getInitializerIfKind(ts.SyntaxKind.ArrayLiteralExpression);
    }

    private getProperty(objectLiteral: ObjectLiteralExpression, propertyName: string): ObjectLiteralExpression | undefined {
        const property = objectLiteral.getProperty(propertyName) as PropertyAssignment;
        return property?.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression);
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

            const sendConfig = this.getProperty(configObject, "config")?.getProperty("sendConfig") as PropertyAssignment;
            const receiveConfig = this.getProperty(configObject, "config")?.getProperty("receiveConfig") as PropertyAssignment;

            const dvnConfig: DVNConfig = {
                sendConfig: {
                    requiredDVNs: [],
                    optionalDVNs: []
                },
                receiveConfig: {
                    requiredDVNs: [],
                    optionalDVNs: []
                }
            };

            const addDvn = (config: PropertyAssignment | undefined, type: "sendConfig" | "receiveConfig") => {
                if (!config) return;
                const ulnConfig = (config.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression)?.getProperty("ulnConfig") as PropertyAssignment;
                if (!ulnConfig) return;
                const ulnConfigObject = ulnConfig.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression;
                const requiredDVNs = this.getArrayProperty(ulnConfigObject, "requiredDVNs");
                const optionalDVNs = this.getArrayProperty(ulnConfigObject, "optionalDVNs");

                if (requiredDVNs) {
                    requiredDVNs.getElements().forEach(element => dvnConfig[type].requiredDVNs.push(element.getText().replace(/['"]+/g, '')));
                } else {
                    console.log(`No requiredDVNs found in ${type}.`);
                }

                if (optionalDVNs) {
                    optionalDVNs.getElements().forEach(element => dvnConfig[type].optionalDVNs.push(element.getText().replace(/['"]+/g, '')));
                } else {
                    console.log(`No optionalDVNs found in ${type}.`);
                }
            };

            addDvn(sendConfig, "sendConfig");
            addDvn(receiveConfig, "receiveConfig");

            connectionDVNs.push({ from, to, dvns: dvnConfig });
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

            const configProperty = this.getProperty(configObject!, "config")?.getProperty(configType) as PropertyAssignment;
            const addDvnToConfig = (config: PropertyAssignment | undefined) => {
                if (!config) return;
                const ulnConfig = (config.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression)?.getProperty("ulnConfig") as PropertyAssignment;
                const ulnConfigObject = ulnConfig?.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression;
                const dvnArray = this.getArrayProperty(ulnConfigObject!, dvnType);
                if (dvnArray && !dvnArray.getText().includes(newDVN)) {
                    dvnArray.addElement(`'${newDVN}'`);
                }
            };

            addDvnToConfig(configProperty);
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

            const configProperty = this.getProperty(configObject!, "config")?.getProperty(configType) as PropertyAssignment;
            const removeDvnFromConfig = (config: PropertyAssignment | undefined) => {
                if (!config) return;
                const ulnConfig = (config.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression)?.getProperty("ulnConfig") as PropertyAssignment;
                const ulnConfigObject = ulnConfig?.getInitializerIfKind(ts.SyntaxKind.ObjectLiteralExpression) as ObjectLiteralExpression;
                const dvnArray = this.getArrayProperty(ulnConfigObject!, dvnType);
                if (dvnArray) {
                    dvnArray.getElements().forEach((element, index) => {
                        if (element.getText().replace(/['"]+/g, '') === dvnToRemove) {
                            dvnArray.removeElement(index);
                        }
                    });
                }
            };

            removeDvnFromConfig(configProperty);
        });
    }

    public listConnections() {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");
        return connections?.getElements().map(element => element.getText());
    }

    public addConnection(fromContract: string, toContract: string) {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        const newConnection = `{
            from: ${fromContract},
            to: ${toContract},
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
        }`;
        
        if (connections && !connections.getText().includes(newConnection)) {
            connections.addElement(newConnection);
        }
    }

    public removeConnection(fromContract: string, toContract: string) {
        const config = this.getConfigObject();
        const connections = this.getArrayProperty(config, "connections");

        connections?.getElements().forEach((element, index) => {
            const from = this.getProperty(element.asKind(ts.SyntaxKind.ObjectLiteralExpression)!, "from")?.getText();
            const to = this.getProperty(element.asKind(ts.SyntaxKind.ObjectLiteralExpression)!, "to")?.getText();
            if (from === fromContract && to === toContract) {
                connections.removeElement(index);
            }
        });
    }

    public saveChanges() {
        this.sourceFile.saveSync();
    }
}
