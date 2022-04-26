/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import axiosCookieJarSupport from 'axios-cookiejar-support';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

axiosCookieJarSupport(axios);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = '';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env['port'] || 3333;

  if (!environment.production) {
    app.enableCors();
  }

  if (process.env['VCR_MODE']) {
    console.log('Using recorder with VCR_MODE:', process.env['VCR_MODE']);
    require('replayer');
  }

  await app.listen(port, () => {
    console.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}

bootstrap();
