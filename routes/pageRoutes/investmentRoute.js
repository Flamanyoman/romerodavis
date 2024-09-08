import Transaction from '../../models/transaction.js';
import User from '../../models/user.js';

// API to fetch user's invested balance and transaction details
export const investmentRoute = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch transactions where user is the buyer
    const transactions = await Transaction.find({ buyer: userId })
      .select(
        'mode totalIncome matured withdrawn.amount withdrawn.refs createdAt dailyIncome maturity'
      )
      .populate('withdrawn.refs', 'amount createdAt')
      .exec();

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Error fetching invested balance:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
