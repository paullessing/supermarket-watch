import { Provider } from '@nestjs/common';

export class Config {

  public readonly port: number;
  public readonly environment: string;
  public readonly tescoApiKey: string;
  public readonly tescoUrl: string;
  public readonly searchResultCount: number;
  public readonly dbDirPath: string;

  constructor(
    config: { [key in keyof Config]: Config[key] }
  ) {
    Object.assign(this, config);
  }
}

type ConfigEntry<T extends string | number | boolean> = [
  envValue: string,
  typeCaster: T extends string ? typeof String :
    T extends number ? typeof Number :
    never,
  defaultValue?: T
];

const configProps: { [configKey in keyof Config]: ConfigEntry<Config[configKey]> } = {
  port:              ['PORT',                Number, 3000],
  environment:       ['NODE_ENV',            String, 'development'],
  tescoApiKey:       ['TESCO_API_KEY',       String],
  tescoUrl:          ['TESCO_URL',           String, 'https://www.tesco.com/groceries/en-GB/'],
  searchResultCount: ['SEARCH_RESULT_COUNT', Number, 120], // Number of results a search query will fetch from the supermarket search page
  dbDirPath:         ['DB_DIR_PATH',         String, ''],
}

export function getConfig(): Config {
  const config: Partial<Config> = {};

  for (const key in configProps) {
    const [envValue, type, defaultValue] = configProps[key];
    if (process.env[envValue]) {
      config[key] = (type || (x => x))(process.env[envValue]);
    } else if (typeof defaultValue !== 'undefined') {
      config[key] = defaultValue;
    } else {
      throw new Error(`Missing required config value "${envValue}"`);
    }
  }

  return new Config(config as Config);
}

export const ConfigProvider: Provider = {
  provide: Config,
  useFactory: getConfig
};
