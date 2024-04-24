import * as fs from 'fs';
import * as path from 'path';
import * as tasks from '..';
import { InquirerUtils } from "../../utils/inquirer"


export const retrieveDeployedContracts = (contract: string) => {
    const cwd = process.cwd();
    // scan for deployed contracts from `deployments` directory to find network and address
    const deploymentsDir = path.join(cwd, 'deployments');

    if (!fs.existsSync(deploymentsDir)) {
        console.error('No deployments directory found.');
        return {};
    }

    // get networks
    const networks = fs.readdirSync(deploymentsDir);

    // get contract `selectedContract` for each network
    const networkContracts = networks.reduce((acc, network) => {
        const networkDir = path.join(deploymentsDir, network);
        // remove .sol postfix and add .json
        const contractFile = path.join(networkDir, contract.replace('.sol', '.json'));
        if (!fs.existsSync(contractFile)) {
            return acc;
        }
        acc[network] = contractFile;
        return acc;
    }, {} as Record<string, any>)

    return networkContracts;
}

const defaultBackCb = () => {
    return InquirerUtils.handlePrompt(tasks.default);
}

export default {
    tag: 'interact.proj',
    description: 'Interact with an Existing Project',
    // disabled: true,
    run: async (_backCb: Function) => {
        _backCb = _backCb || defaultBackCb;
        console.log('interact.proj');
        const cwd = process.cwd();
        const hardhatConfigPath = path.join(cwd, 'hardhat.config.ts');
        if (!fs.existsSync(hardhatConfigPath)) {
            console.error('Not a Hardhat project. Exiting...');
            return;
        }

        // scan artifacts directory for contracts
        const artifactsDir = path.join(cwd, 'artifacts', 'contracts');
        if (!fs.existsSync(artifactsDir)) {
            console.error('No artifacts directory found. Exiting...');
            return;
        }

        // contract files are directory with .sol postfix
        const contractFiles = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.sol'));
        if (!contractFiles.length) {
            console.error('No contract files found. Exiting...');
            return;
        }

        // console.log('Contract files found:');
        // contractFiles.forEach((f, i) => {
        //     console.log(`${i + 1}. ${f}`);
        // });

        const selectedContract = await InquirerUtils.handlePrompt(
            contractFiles.reduce((acc, f) => {
                acc[f] = {
                    description: f,
                    tag: f,
                    run: async () => {
                        console.log(`Interacting with contract: ${f}`);
                    }
                };
                return acc;
            }, {})
            , _backCb, false, 'Select a contract to interact with:');

        console.log({ selectedContract });

        // read contract file in memory
        const contractFile = path.join(artifactsDir, selectedContract, selectedContract.replace('.sol', '.json'));
        const contractData = fs.readFileSync(contractFile, 'utf-8');
        const abi = JSON.parse(contractData)?.abi;

        // filter abi for functions and constructor

        const functions = abi.filter((f: any) => f.type === 'function');

        // filter getter and setter functions
        const getterFunctions = functions.filter((f: any) => f.stateMutability === 'view' || f.stateMutability === 'pure');
        const setterFunctions = functions.filter((f: any) => f.stateMutability === 'nonpayable');

        // const constructor = undefined;//abi.find((f: any) => f.type === 'constructor');

        // console.log({ functions, constructor });

        // prompt for getter or setter functions

        const selectedFunctionType = await InquirerUtils.handlePrompt(
            {
                'getter': {
                    description: 'Getter Functions',
                    tag: 'getter',
                    run: async () => {
                        console.log('Getter Functions');
                    }
                },
                'setter': {
                    description: 'Setter Functions',
                    tag: 'setter',
                    run: async () => {
                        console.log('Setter Functions');
                    }
                }
            }
            , _backCb, false, 'Select a function type to interact with:');

        if (selectedFunctionType) {

            const selectedFunction = await InquirerUtils.handlePrompt(
                (selectedFunctionType === 'getter' ? getterFunctions : setterFunctions)
                    .reduce((acc, f: any) => {
                        acc[f.name] = {
                            description: f.name,
                            tag: f.name,
                            run: async () => {
                                console.log(`Interacting with getter function: ${f.name}`);
                            }
                        };
                        return acc;
                    }, {})
                , _backCb, false, `Select a ${selectedFunctionType} function to interact with:`);
            console.log({ selectedFunction });
        }

        // create a prompt for selecting a function or constructor to interact with

        // const selectedFunction = await InquirerUtils.handlePrompt(
        //     functions.reduce((acc, f: any) => {
        //         acc[f.name] = {
        //             description: f.name,
        //             tag: f.name,
        //             run: async () => {
        //                 console.log(`Interacting with function: ${f.name}`);
        //             }
        //         };
        //         return acc;
        //     },
        //         constructor ? {
        //             [constructor.name]: {
        //                 description: constructor.name,
        //                 tag: constructor.name,
        //                 run: async () => {
        //                     console.log(`Interacting with constructor: ${constructor.name}`);
        //                 }
        //             }
        //         } : {}
        //     )
        //     , _backCb, false, 'Select a function to interact with:');

        // console.log({ selectedFunction });



        /*
        const networkContracts = retrieveDeployedContracts(selectedContract);
        const deployedNetworks = Object.keys(networkContracts);

        if (deployedNetworks.length) {
            deployedNetworks.push('Default');
            const selectedNetwork = await InquirerUtils.handlePrompt(
                deployedNetworks.reduce((acc, network) => {
                    acc[network] = {
                        description: network,
                        tag: network,
                        run: async () => {
                            console.log(`Interacting with contract: ${selectedContract} on network: ${network}`);
                        }
                    };
                    return acc;
                }, {})
            );
            console.log({ selectedNetwork });
        }*/

    }


}