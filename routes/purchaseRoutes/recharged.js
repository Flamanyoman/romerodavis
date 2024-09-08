import User from '../../models/user.js';
import Transaction from '../../models/transaction.js';

const rechargedWallet = async (req, res, next) => {
  const { userId, amount, inputEntry } = req.body;

  try {
    // Validate required fields
    if (!userId || !amount || !inputEntry) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate the amount
    if (amount < 2000 || isNaN(amount)) {
      return res.status(400).json({
        message: 'Minimum recharge amount is 2000 and must be a valid number',
      });
    }

    // Validate inputEntry (Account Name)
    const validateInputEntry = () => {
      const trimmedEntry = inputEntry.trim();

      if (trimmedEntry.length < 3) {
        return 'Account name must be more than 2 characters.';
      }

      if (trimmedEntry.length > 100) {
        return 'Account name must not exceed 100 characters.';
      }

      if (/^\d+$/.test(trimmedEntry)) {
        return 'Account name cannot contain only numbers.';
      }

      return null; // No errors
    };

    const inputEntryError = validateInputEntry();
    if (inputEntryError) {
      return res.status(400).json({ message: inputEntryError });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new transaction for the recharge
    const transaction = new Transaction({
      mode: 'RAND',
      name: 'Recharge',
      amount: parseFloat(amount),
      dailyIncome: 0,
      totalIncome: 0,
      maturity: 0,
      accountName: inputEntry,
      buyer: user._id,
    });

    // Update the user's wallet
    user.wallet.recharged.refs.push(transaction._id);

    await transaction.save();
    await user.save();

    // Send a success response
    res.status(200).json({
      message: 'Recharge successful',
      transaction: transaction,
    });
  } catch (err) {
    next(err); // Pass any errors to the error handling middleware
  }
};

export default rechargedWallet;
