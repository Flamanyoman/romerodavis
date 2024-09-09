import User from '../../models/user.js';
import Transaction from '../../models/transaction.js';

const withdrawFunds = async (req, res, next) => {
  const { userId, amount, sentBankName, bankName, accountNum } = req.body;

  try {
    // Validate required fields
    if (!userId || !amount || isNaN(amount)) {
      return res.status(400).json({ message: 'Invalid or missing fields' });
    }

    // Find the user by ID
    const user = await User.findById(userId)
      .populate({
        path: 'wallet.invested.refs',
        select: 'totalIncome',
      })
      .populate({
        path: 'wallet.withDrawn.refs',
        select: 'amount',
      })
      .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total income from investments
    const incomeArray =
      user.wallet.invested?.refs?.map((ref) => Number(ref.totalIncome) || 0) ||
      [];
    const totalIncome = incomeArray.reduce((sum, income) => sum + income, 0);

    // Calculate the final amount available for withdrawal
    const finalAmount =
      totalIncome +
      (user.wallet.income?.balance || 0) -
      (user.wallet.withDrawn?.balance || 0);

    if (amount <= finalAmount) {
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

      // Update user wallet and account details
      user.wallet.withDrawn.refs.push(withdrawalTransaction._id);
      user.wallet.withDrawn.balance += parseFloat(amount);
      user.accountDetails.bank = sentBankName;
      user.accountDetails.accountName = bankName;
      user.accountDetails.accountNum = accountNum;

      try {
        await user.save();
      } catch (err) {
      }

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
