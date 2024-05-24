export interface ContractABI {
    type: string;
    stateMutability?: string;
    name?: string;
    inputs?: Array<{ name: string; type: string }>;
}
