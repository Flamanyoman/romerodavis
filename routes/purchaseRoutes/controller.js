import express from 'express';
import rechargedWallet from './recharged.js';
import investedItem from './invested.js';
import withdrawFunds from './withdrawn.js';

const purchaseRouter = express.Router();

// Define the route for recharging the wallet
purchaseRouter.post('/recharge', rechargedWallet);

// Define the route for investing in an item
purchaseRouter.post('/invest', investedItem);

// Define the route for withdrawing funds
purchaseRouter.post('/withdraw', withdrawFunds);

export default purchaseRouter;
