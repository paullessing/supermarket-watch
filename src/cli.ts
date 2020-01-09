import * as readline from 'readline';
import { SearchResultItem } from './models/search-result.model';
import { SupermarketService } from './supermarket.service';
import { createTable } from './util';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supermarketService = new SupermarketService();

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
  let query = await question('What are you searching for? ', true);

  while (query) {
    const results = await supermarketService.search(query);

    process.stdout.write(createTable<SearchResultItem>([
      { name: 'Price',     key: (result) => result.price.toFixed(2), padLeft: true },
      { name: 'Item Name', key: 'name' },
      { name: 'ID',        key: 'id' },
    ], results));

    query = await question('What are you searching for? ', true);
  }
  process.exit(0);
}

main();
