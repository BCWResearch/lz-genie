import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { LayerZeroConfigManager } from './lzConfigManager';
import { DVNS } from '../dvn-definitions';
import { InquirerUtils } from './inquirer';
import PostHogUtil from './posthog';
import { LAYER_ZERO_CONFIG_FILE_NAME } from '../constants';

export class DVNUtils {
  static async configureDVN(index?: number) {
    const configFilePath = LayerZeroConfigManager.getDefaultLzConfigPath();
    if (!fs.existsSync(configFilePath)) {
      console.error('Not a LayerZero project. Exiting...');
      return;
    }
    const manager = new LayerZeroConfigManager(configFilePath);
    // List contracts
    const contracts = manager.listContracts();
    const contractsEid = contracts.map((contract) => contract.resolvedEid);

    const availableDvns = Object.keys(DVNS)
      .map((dvn, index) => {
        return {
          name: `${index + 1}. ${dvn}`,
          value: dvn,
          description: dvn,
          tag: dvn,
          disabled:
            Object.keys(DVNS[dvn]).filter((eid) => contractsEid.includes(+eid))
              .length === 0,
        };
      })
      .sort((a, b) => {
        if (a.disabled && !b.disabled) {
          return 1;
        }
        if (!a.disabled && b.disabled) {
          return -1;
        }
        return 0;
      });
    const selectedDvn = !isNaN(index)
      ? availableDvns[index].tag
      : await InquirerUtils.handlePrompt(availableDvns);

    if (!selectedDvn) {
      return;
    }

    PostHogUtil.trackEvent(`DVN_CONFIGURE_${selectedDvn}`, {
      dvn: selectedDvn,
    });

    for (let i = 0; i < contracts.length; i++) {
      const from = contracts[i].contractName;
      console.log(`Adding DVN for ${from} (${i + 1}/${contracts.length})`);
      for (let j = 0; j < contracts.length; j++) {
        process.stdout.write(
          `\r${Math.round(((j + 1) / contracts.length) * 100)}%`
        );
        if (i !== j) {
          const to = contracts[j].contractName;
          // Remove connection for v1
          manager.removeConnection(from, to);
          manager.addConnection(from, to);
          const eid = contracts.find(
            (contract) => contract.contractName === from
          )?.resolvedEid;

          if (eid === undefined) {
            console.error(`EID not found for ${from}`);
            continue;
          }
          manager.addDVN(
            DVNS[selectedDvn][eid],
            from,
            to,
            'sendConfig',
            'optionalDVNs'
          );
        }
      }
    }
    manager.saveChanges();
  }

  static async setDVNConfig() {
    const cwd = process.cwd();
    const options: SpawnOptions = {
      cwd,
      stdio: 'inherit',
      shell: true,
    };
    const deployProcess = spawn(
      'npx',
      ['hardhat', 'lz:oapp:wire', `--oapp-config ${LAYER_ZERO_CONFIG_FILE_NAME}`],
      options
    );
    deployProcess.on('exit', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}
