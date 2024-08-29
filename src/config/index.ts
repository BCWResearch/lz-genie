import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

const CONFIG_PATH = path.join(__dirname, 'lzgenie.config.json');

interface IConfigData {
  trackAnalytics: boolean;
  anonymousUserId?: string;
  autoUpdate?: boolean;
}

const defaultConfig: IConfigData = {
  trackAnalytics: false,
};

let config: IConfigData | null = null;

function getConfig(): IConfigData | null {
  if (fs.existsSync(CONFIG_PATH)) {
    logger.verbose('Reading config from:', CONFIG_PATH);
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    config = JSON.parse(configData) as IConfigData;
    return config;
  } else {
    return null;
  }
}

function createDefaultConfig(): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
}

function createConfig(configData: IConfigData): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2));
}

export { getConfig, createDefaultConfig, createConfig, IConfigData };
