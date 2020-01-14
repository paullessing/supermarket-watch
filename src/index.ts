import express from 'express';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import path from 'path';
import { config } from './config.service';
import { productController } from './controllers/product.controller';
import { searchController } from './controllers/search.controller';

const app = express();

app.use(morgan('dev'));

app.use('/api/product', productController);
app.use('/api/search', searchController);

if (config.environment === 'prod') {
  app.use(express.static(path.join(__dirname, 'frontend')));
  app.use((req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html'))); // Send unexpected routes to the root index.html
} else {
  app.use(proxy('http://localhost:4200'));
}

app.listen(config.port, () => console.log(`App running on port ${config.port}`));
