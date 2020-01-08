import * as readline from 'readline';
import { SearchResult, SearchResultItem } from './models/search-result.model';
import { Sainsburys } from './supermarkets/sainsburys';
import { Tesco } from './supermarkets/tesco';
import { Waitrose } from './supermarkets/waitrose';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supermarkets = [
  new Waitrose(),
  new Sainsburys(),
  new Tesco(),
];

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
  let query: string;

  do {
    query = await question('What are you searching for? ', true);
    // query = 'alpro almond unsweetened';

    const results: SearchResultItem[] = ([] as SearchResultItem[]).concat.apply([], await Promise.all(
      supermarkets.map((supermarket) => supermarket.search(query).then(({ items }) => items)))
    );

    let longestId = 0;
    let longestName = 0;
    results.forEach((result) => {
      if (result.id.length > longestId) {
        longestId = result.id.length;
      }
      if (result.name.length > longestName) {
        longestName = result.name.length;
      }
    });

    process.stdout.write(
      rpad('', longestId, '-') + '-|-' +
      rpad('', 7, '-') + '-|-' +
      rpad('', longestName, '-') + '\n');

    results.forEach((result) => {
      process.stdout.write(
        rpad(result.id, longestId, ' ') + ' | ' +
        lpad(result.price.toFixed(2) + ' ', 7, ' ') + ' | ' +
        rpad(result.name, longestName, ' ') + '\n'
      );
    });

    // process.stdout.write(JSON.stringify(results, null, 2) + '\n\n');
    // query = '';
  } while (query);
  process.exit(0);
}

function rpad(value: string, length: number, padChar: string): string {
  return value + new Array(Math.max(0, length - value.length)).fill(padChar).join('');
}

function lpad(value: string, length: number, padChar: string): string {
  return new Array(Math.max(0, length - value.length)).fill(padChar).join('') + value;
}

main();
