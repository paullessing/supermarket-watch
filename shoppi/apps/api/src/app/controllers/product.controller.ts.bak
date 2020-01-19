import express, { Request, Response } from 'express';
import { supermarketService } from '../supermarket.service';

const router = express.Router();

router.get('/:id', async (req: Request, res: Response) => {
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

export const productController = router;
