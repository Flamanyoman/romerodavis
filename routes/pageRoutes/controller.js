import express from 'express';
import userRoute from './userRoute.js';
import {
  approveTransactions,
  toggleTransactionApproval,
} from './approveTransaction.js';
import { investmentRoute } from './investmentRoute.js';

const pagesRouter = express.Router();

// Route to get user information upon login or page access
pagesRouter.post('/user-info', userRoute);
pagesRouter.post('/transactionsInfo', approveTransactions);
pagesRouter.post('/toggleApproval', toggleTransactionApproval);
pagesRouter.post('/allInvestments', investmentRoute);

export default pagesRouter;
