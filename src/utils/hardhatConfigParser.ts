import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@typescript-eslint/typescript-estree';
import { ASTUtils } from './ast';
import { HARDHAT_CONFIG_FILE_NAME } from '../constants';

export interface HardhatParsedNetwork {
  eid: string;
  url: string;
  accounts: string[];
}

export class HardhatConfigParser {
  public static async getNetworks(filePath?: string): Promise<HardhatParsedNetwork[]> {
    try {
      if (!filePath) {
        filePath = this.getDefaultConfigPath();
      }
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse the file content into an AST
      const ast = parse(fileContent, {
        loc: true,
        range: true,
        comment: true,
      });

      // Traverse the AST to find the default export declaration
      let networksNode: any;

      for (const node of ast.body) {
        if (node.type === 'VariableDeclaration') {
          if (node.declarations[0].init.type === 'ObjectExpression') {
            networksNode = node.declarations[0].init.properties.find(
              (prop) =>
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'networks'
            );
          }
        }
      }

      if (!networksNode && networksNode.value.type !== 'ObjectExpression') {
        return [];
      }

      // Extract and return the network names
      const networkNames = networksNode.value.properties
        .map((network) => {
          if (
            network.type === 'Property' &&
            network.key.type === 'Identifier'
          ) {
            return {
              [network.key.name]: ASTUtils.extractProperties(network.value)
            };
          }
        })
        .reduce((acc, curr) => {
          return { ...acc, ...curr };
        }, {});

      return networkNames;
      //.filter(Boolean) as string[];
    } catch (error) {
      return [];
    }
  }

  public static getDefaultConfigPath() {
    const cwd = process.cwd();
    return path.join(cwd, HARDHAT_CONFIG_FILE_NAME)
  }
}