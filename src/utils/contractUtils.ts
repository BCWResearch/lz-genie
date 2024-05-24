import * as fs from 'fs';
import * as path from 'path';
import { ContractABI } from '../interfaces';

export const retrieveDeployedContracts = (contract: string): Record<string, string> => {
    const cwd = process.cwd();
    const deploymentsDir = path.join(cwd, 'deployments');

    if (!fs.existsSync(deploymentsDir)) {
        console.error('No deployments directory found.');
        return {};
    }

    const networks = fs.readdirSync(deploymentsDir);
    const networkContracts = networks.reduce((acc, network) => {
        const networkDir = path.join(deploymentsDir, network);
        const contractFile = path.join(networkDir, contract.replace('.sol', '.json'));
        if (!fs.existsSync(contractFile)) {
            return acc;
        }
        acc[network] = contractFile;
        return acc;
    }, {} as Record<string, string>)

    return networkContracts;
}

export const getContractABI = (contractFile: string): ContractABI[] => {
    if (!fs.existsSync(contractFile)) {
        throw new Error(`Contract file ${contractFile} does not exist.`);
    }
    const contractData = fs.readFileSync(contractFile, 'utf-8');
    return JSON.parse(contractData)?.abi;
}

export const filterFunctions = (abi: ContractABI[], type: 'getter' | 'setter'): ContractABI[] => {
    if (type === 'getter') {
        return abi.filter(f => f.type === 'function' && (f.stateMutability === 'view' || f.stateMutability === 'pure'));
    } else {
        return abi.filter(f => f.type === 'function' && f.stateMutability === 'nonpayable');
    }
}
