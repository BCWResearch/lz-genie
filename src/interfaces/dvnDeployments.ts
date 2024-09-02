export type DVNName = string;
export type NetworkName = string;
export type DVNAddress = string;
export type NetworkId = number;

export interface DVNDeploymentConfig {
    [key: NetworkName]: DVNAddress
}

export interface DVNDeployment {
    [key: DVNName]: DVNDeploymentConfig
}

export interface DVNNetworkMap{
    [key: NetworkName]: NetworkId[]
}