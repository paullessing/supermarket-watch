import { env } from '$env/dynamic/private';

export class Config {
  public readonly port!: number;
  public readonly environment!: string;
  public readonly tescoUrl!: string;
  public readonly sainsburysUrl!: string;
  public readonly searchResultCount!: number;
  public readonly dbDirPath!: string;

  constructor(config: { [key in keyof Config]: Config[key] }) {
    Object.assign(this, config);
  }
}

type EnvKey = keyof typeof env;

type ConfigEntry<T extends string | number | boolean> = readonly [
  envValue: EnvKey,
  typeCaster: T extends string ? typeof String : T extends number ? typeof Number : never,
  defaultValue?: T,
];

// prettier-ignore
const configProps = {
  port: ['PORT', Number, 3000],
  environment: ['NODE_ENV', String, 'development'],
  tescoUrl: ['TESCO_URL', String, 'https://www.tesco.com/groceries/en-GB/'],
  sainsburysUrl: ['SAINSBURYS_URL', String, 'https://www.sainsburys.co.uk/groceries-api/gol-services/product/v1/'],
  searchResultCount: ['SEARCH_RESULT_COUNT', Number, 120], // Number of results a search query will fetch from the supermarket search page
  dbDirPath: ['DB_DIR_PATH', String, ''],
} as const satisfies { readonly [K in keyof Config]: ConfigEntry<Config[K]> };

export function getConfig(): Config {
  // The typing here is not ideal and could be improved to be stricter
  const config: { -readonly [K in keyof Config]?: any } = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const key in configProps) {
    const propKey = key as keyof Config;
    const [envValue, type, defaultValue] = configProps[propKey];

    if (env[envValue]) {
      config[propKey] = (type || ((x) => x))(env[envValue]);
    } else if (typeof defaultValue !== 'undefined') {
      config[propKey] = defaultValue;
    } else {
      throw new Error(`Missing required config value "${envValue}"`);
    }
  }

  return new Config(config as Config);
}

export const config = getConfig();
