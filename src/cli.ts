import * as readline from 'readline';
import { SearchResultItem } from './models/search-result.model';
import { supermarketService, SupermarketService } from './supermarket.service';
import { createTable } from './util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (question: string, allowBlank = false): Promise<string> => {
  const ask = () => new Promise<string>((resolve) => rl.question(question, (result: string) => {
    if (!!result || allowBlank) {
      resolve(result);
    } else {
      ask().then(resolve);
    }
  }));
  return ask();
};

async function main() {
  const command = process.argv[2] || '';
  switch (command) {
    case 'search': {
      const result = await search(process.argv[3]);
      process.exit(result);
    }
    case 'find':
    case 'lookup': {
      const result = await lookup(process.argv[3]);
      process.exit(result);
    }
    case 'help':
    default: {
      printHelp();
      process.exit(command === 'help' ? 0 : 1);
    }
  }
  process.exit(1);
}

async function search(query: string | undefined): Promise<number> {
  if (!query) {
    process.stdout.write('Must provide an argument for search');
    return 1;
  }

  const results = await supermarketService.search(query);

  process.stdout.write(createTable<SearchResultItem>([
    { name: 'Price',     key: (result) => result.price.toFixed(2), padLeft: true },
    { name: 'Item Name', key: 'name' },
    { name: 'ID',        key: 'id' },
  ], results) + '\n');

  return 0;
}

async function lookup(id: string): Promise<number> {
  const result = await supermarketService.getSingleItem(id);
  if (!result) {
    process.stdout.write('Not found.\n');
    return 1;
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    return 0;
  }
}

function printHelp(): void {
  process.stdout.write(`Usage: yarn cli <command> <args>

Possible commands:
  - search "<terms>"
  - find "<id>"
  - help
`);
}

main();
