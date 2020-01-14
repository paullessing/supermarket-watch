import express, { Request, Response } from 'express';
import morgan from 'morgan';
import { config } from './config.service';
import { supermarketService } from './supermarket.service';

const app = express();

app.use(morgan(config.environment === 'development' ? 'dev' : 'combined'));

app.get('/api/product/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id || '';
    if (!id) {
      return res.status(400).send('Missing required URL parameter "id"');
    }
    const item = await supermarketService.getSingleItem(id);
    if (!item) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).send(JSON.stringify(item));
  } catch (e) {
    console.error(e);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/api/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.status(400).send('Missing required query parameter "q"');
    }
    const items = await supermarketService.search(query);
    if (!items) {
      return res.status(404).send('Not Found');
    }
    return res.status(200).send(JSON.stringify({ items }));
  } catch (e) {
    console.error(e);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(config.port, () => console.log(`App running on port ${config.port}`));
