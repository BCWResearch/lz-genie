import { Project, SourceFile, ts, ObjectLiteralExpression, PropertyAssignment, ArrayLiteralExpression, SyntaxKind, VariableDeclarationKind } from "ts-morph";
import type { OAppEdgeConfig,  OmniPointHardhat, } from '@layerzerolabs/toolbox-hardhat'
import { EndpointId } from "@layerzerolabs/lz-definitions";


export interface DVNConfig {
    requiredDVNs: string[];
    optionalDVNs: string[];
}

export interface Connection {
    from: OmniPointHardhat;
    to: OmniPointHardhat;
    config?: OAppEdgeConfig;
}

export interface Contract {
    contractName: string;
    eid: string;
    resolvedEid?: number;
}

export interface FlattenOmniPointHardhat{
    [key: string]: string;
}