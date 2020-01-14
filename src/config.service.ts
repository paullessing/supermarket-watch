import fs from 'fs';
import path from 'path';

export class Config {
  public readonly port: number;
  public readonly environment: string;
  public readonly tescoApiKey: string;
  public readonly searchResultCount: number; // Number of results a search query will fetch from the supermarket search page

  private readonly configObject: { [key: string]: any } | null;

  constructor() {
    const configFilePath = path.join(__dirname, '../config/config.json');
    const exists = fs.existsSync(configFilePath);
    this.configObject = exists && JSON.parse(fs.readFileSync(configFilePath).toString()) || null;

    this.port              = this.getConfigValue('PORT', Number, 3000);
    this.environment       = this.getConfigValue('NODE_ENV', String, 'development');
    this.tescoApiKey       = this.getConfigValue('TESCO_API_KEY');
    this.searchResultCount = this.getConfigValue('SEARCH_RESULT_COUNT', Number, 120);
  }

  private getConfigValue<T>(configKey: string, converter?: (input: string) => T, defaultValue?: T): T {
    if (process.env[configKey]) {
      return (converter || (x => x))(process.env[configKey]!) as T;
    }
    if (this.configObject && this.configObject.hasOwnProperty(configKey)) {
      return this.configObject[configKey] as T;
    }
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    throw new Error(`Missing config value "${configKey}"`);
  }
}

export const config = new Config();
