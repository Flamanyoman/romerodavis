import express from 'express';
import rechargedWallet from './recharged.js';
import investedItem from './invested.js';
import withdrawFunds from './withdrawn.js';
import schedule from 'node-schedule';
import moment from 'moment';
import Transaction from '../../models/transaction.js';
import { banks, verifyBank } from './banks.js';
import { claimReward, team } from './rewards.js';

const purchaseRouter = express.Router();

// Define the route for recharging the wallet
purchaseRouter.post('/recharge', rechargedWallet);

// Define the route for investing in an item
purchaseRouter.post('/invest', investedItem);

// Define the route for withdrawing funds
purchaseRouter.post('/withdraw', withdrawFunds);

purchaseRouter.get('/banks', banks);

purchaseRouter.post('/verify-bank', verifyBank);

purchaseRouter.get('/team', team);

purchaseRouter.post('/claimReward', claimReward);

// Schedule job to run every minute
schedule.scheduleJob('0 0 * * *', async () => {
  try {
    const batchSize = 100; // Define a suitable batch size
    let skip = 0;
    const now = moment();

    while (true) {
      const transactions = await Transaction.find({
        mode: { $regex: 'BOND', $options: 'i' },
        matured: false,
        dailyIncome: { $gt: 0 },
        maturity: { $gt: 0 },
        $expr: {
          $lt: ['$totalIncome', { $multiply: ['$dailyIncome', '$maturity'] }],
        },
      })
        .skip(skip)
        .limit(batchSize);

      if (transactions.length === 0) break;

      await Promise.all(
        transactions.map(async (transaction) => {
          const expectedTotalIncome =
            transaction.dailyIncome * transaction.maturity;

          // Increment totalIncome by dailyIncome, ensuring it doesn't exceed the maximum
          transaction.totalIncome = Math.min(
            transaction.totalIncome + transaction.dailyIncome,
            expectedTotalIncome
          );

          // Check if maturity date has been reached and update matured field if necessary
          const maturityDate = moment(transaction.createdAt).add(
            transaction.maturity,
            'days'
          );
          if (now.isSameOrAfter(maturityDate)) {
            transaction.matured = true;
          }

          await transaction.save();
        })
      );

      skip += batchSize; // Increment skip to process the next batch
    }

    console.log('Job completed at:', new Date().toLocaleString());
  } catch (error) {
    console.error('Error running job:', error);
  }
});

export default purchaseRouter;
