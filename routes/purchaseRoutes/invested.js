import { perfData } from './data.js';
import User from '../../models/user.js';
import Transaction from '../../models/transaction.js';

const investedItem = async (req, res, next) => {
  const { mode, userId } = req.body;

  try {
    // Validate required fields
    if (!mode || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the item in perfData
    const item = perfData.find((p) => p.mode === mode);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate the total available balance
    const totalBalance =
      user.wallet.recharged.balance +
      user.wallet.income.balance -
      user.wallet.withDrawn.balance -
      user.wallet.invested.balance;

    // Convert item amount to a number
    const itemAmount = parseFloat(item.amount.replace(/,/g, ''));
    if (isNaN(itemAmount)) {
      return res.status(400).json({ message: 'Invalid amount format' });
    }

    // Check if the total balance is sufficient for the purchase
    if (totalBalance < itemAmount) {
      return res
        .status(400)
        .json({ message: 'Insufficient funds, Please Recharge' });
    }

    const totalIncome = 0;

    // Create a new transaction
    const transaction = new Transaction({
      mode: item.mode,
      name: item.name,
      amount: itemAmount,
      dailyIncome: parseFloat(item.dailyIncome),
      totalIncome: parseFloat(totalIncome),
      maturity: parseInt(item.maturity, 10),
      buyer: user._id,
    });

    // Save the transaction
    const savedTransaction = await transaction.save();

    // Update the user's wallet
    user.wallet.invested.refs.push(savedTransaction._id);
    user.wallet.invested.balance += itemAmount;
    await user.save();

    // Send a success response
    res.status(200).json({
      message: 'Purchase successful',
      transaction: savedTransaction,
    });
  } catch (err) {
    next(err); // Pass any errors to the error handling middleware
  }
};

export default investedItem;
