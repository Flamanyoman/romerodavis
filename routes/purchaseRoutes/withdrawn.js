import User from '../../models/user.js';
import Transaction from '../../models/transaction.js';

const withdrawFunds = async (req, res, next) => {
  const { userId, amount, investmentId } = req.body;

  try {
    // Validate required fields
    if (!userId || !amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid or missing fields' });
    }

    // Find the user by ID
    const user = await User.findById(userId).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate non-invested funds
    const nonInvestedFunds =
      user.wallet.recharged.balance -
      user.wallet.invested.balance -
      user.wallet.withDrawn.balance;

    if (amount <= nonInvestedFunds && !investmentId) {
      // Withdraw from non-invested funds

      // Create a new withdrawal transaction
      const withdrawalTransaction = new Transaction({
        mode: 'WAND',
        name: 'Withdraw',
        amount: parseFloat(amount),
        Daily: 0,
        dailyIncome: 0,
        totalIncome: 0,
        maturity: 0,
        buyer: user._id,
      });

      await withdrawalTransaction.save();

      user.wallet.withDrawn.refs.push(withdrawalTransaction._id);
      user.wallet.withDrawn.balance += amount;

      await user.save();

      return res.status(200).json({
        message: 'Withdrawal successful',
        transaction: withdrawalTransaction,
      });
    } else if (investmentId) {
      // Attempt to withdraw from matured investments
      const investment = await Transaction.findOne({
        _id: investmentId,
        buyer: user._id,
        matured: true,
        withdrawn: false,
        totalIncome: { $gt: 0 },
      });

      if (!investment) {
        return res
          .status(400)
          .json({ message: 'Investment not found or not matured' });
      }

      // Check if the requested amount is less than or equal to the investment's total income
      if (amount > investment.totalIncome) {
        return res
          .status(400)
          .json({ message: 'Requested amount exceeds investment balance' });
      }

      // Update the investment's withdrawn amount
      investment.withdrawn = true; // or update the specific withdrawn field if needed
      await investment.save();

      // Create a new withdrawal transaction
      const withdrawalTransaction = new Transaction({
        mode: 'WAND',
        name: 'Withdraw Funds',
        amount: parseFloat(amount),
        Daily: 0,
        dailyIncome: 0,
        totalIncome: 0,
        maturity: 0,
        buyer: user._id,
      });

      await withdrawalTransaction.save();

      user.wallet.withDrawn.refs.push(withdrawalTransaction._id);
      user.wallet.withDrawn.balance += amount;
      await user.save();

      return res.status(200).json({
        message: 'Withdrawal successful',
        transaction: withdrawalTransaction,
      });
    } else {
      return res
        .status(400)
        .json({ message: 'Insufficient funds or invalid request' });
    }
  } catch (err) {
    next(err); // Pass any errors to the error handling middleware
  }
};

export default withdrawFunds;
