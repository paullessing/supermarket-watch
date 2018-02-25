import { aws as wrapper } from 'serverless-api-handlers';
import * as handlers from './product-handler';

export const getProduct = wrapper.wrap(handlers.getProduct);
export const search = wrapper.wrap(handlers.search);
