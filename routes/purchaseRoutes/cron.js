import cron from 'node-cron';
import moment from 'moment';
import Transaction from '../../models/transaction.js';

cron.schedule('0 0 * * *', async () => {
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
        approved: true,
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

      skip += batchSize;
    }

    console.log('Cron job completed at:', new Date());
  } catch (error) {
    console.error('Error running cron job:', error);
  }
});
