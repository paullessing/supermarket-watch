import express, { Request, Response } from 'express';
import { supermarketService } from '../supermarket.service';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
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

export const searchController = router;
