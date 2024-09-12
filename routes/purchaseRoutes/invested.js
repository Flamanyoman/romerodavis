import Transaction from '../../models/transaction.js';
import User from '../../models/user.js';
import { perfData } from './data.js';

const investedItem = async (req, res, next) => {
  const { mode, userId } = req.body;

  try {
    if (!mode || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const item = perfData.find((p) => p.mode === mode);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalBalance =
      parseFloat(user.wallet.recharged.balance) +
      parseFloat(user.wallet.income.balance) -
      parseFloat(user.wallet.invested.balance);

    const itemAmount = parseFloat(item.amount.replace(/,/g, ''));
    if (isNaN(itemAmount)) {
      return res.status(400).json({ message: 'Invalid amount format' });
    }

    if (totalBalance < itemAmount) {
      return res
        .status(400)
        .json({ message: `You have ₦${totalBalance}, Please Recharge` });
    }

    // Handle multi-level referral bonus logic
    let currentUser = user;
    let bonusPercentages = [15, 5, 1]; // Corresponds to each level

    while (currentUser.referedBy && bonusPercentages.length > 0) {
      const referrer = await User.findById(currentUser.referedBy);

      if (referrer) {
        const bonusPercentage = bonusPercentages.shift(); // Get the top bonus percentage
        const bonusAmount = (itemAmount * bonusPercentage) / 100;

        referrer.wallet.income.balance += bonusAmount;
        await referrer.save();

        // Move up the chain
        currentUser = referrer;
      } else {
        break; // No more referrers
      }
    }

    // Proceed with the original investment process
    const totalIncome = 0;

    const transaction = new Transaction({
      mode: item.mode,
      name: item.name,
      amount: itemAmount,
      dailyIncome: parseFloat(item.dailyIncome),
      totalIncome: parseFloat(totalIncome),
      maturity: parseInt(item.maturity, 10),
      buyer: user._id,
    });

    const savedTransaction = await transaction.save();

    user.wallet.invested.refs.push(savedTransaction._id);
    user.wallet.invested.balance += itemAmount;
    await user.save();

    res.status(200).json({
      message: 'Purchase successful',
      transaction: savedTransaction,
    });
  } catch (err) {
    next(err);
  }
};

export default investedItem;
