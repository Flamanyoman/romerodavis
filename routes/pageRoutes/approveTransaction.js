import Transaction from '../../models/transaction.js';
import User from '../../models/user.js';

// Function to approve or reverse a transaction
export const toggleTransactionApproval = async (req, res) => {
  try {
    const { transactionId, userId } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is authorized
    if (!['8126401373', '9068314394'].includes(user.phoneNum.toString())) {
      return res.status(403).json({ message: 'Leave this page' });
    }

    // Find the transaction by transactionId
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Toggle approval status
    transaction.approved = !transaction.approved;

    // Perform actions based on the approval status
    if (transaction.approved) {
      // Logic for when the transaction is approved
      console.log(`Transaction ${transactionId} approved.`);
      // Example: update user balance, notify user, etc.
      const buyer = await User.findById(transaction.buyer);
      buyer.wallet.recharged.balance += transaction.amount;
      await buyer.save();

      // Additional logic like sending a notification to the user can be added here
    } else {
      // Logic for when the transaction approval is reversed
      console.log(`Transaction ${transactionId} approval reversed.`);
      // Example: revert user balance, notify user, etc.
      const buyer = await User.findById(transaction.buyer);
      buyer.wallet.recharged.balance -= transaction.amount;
      await buyer.save();

      // Additional logic like sending a notification to the user can be added here
    }

    await transaction.save();

    // Return the updated transaction
    return res.status(200).json({ transaction });
  } catch (error) {
    console.error('Error toggling transaction approval:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Function to approve multiple transactions with pagination
export const approveTransactions = async (req, res) => {
  try {
    const { userId, skip = 0, limit = 50 } = req.body; // Default values for skip and limit

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is authorized
    if (!['8126401373', '9068314394'].includes(user.phoneNum.toString())) {
      return res.status(403).json({ message: 'Leave this page' });
    }

    // Fetch transactions with pagination
    const transactions = await Transaction.find({
      mode: { $in: ['WAND', 'RAND'] },
    })
      .select('amount approved accountName createdAt buyer mode')
      .sort({ createdAt: -1 })
      .skip(skip) // Skip the previous batch
      .limit(limit) // Limit to the specified number of items
      .populate('buyer', 'phoneNum');

    // Count total matching transactions
    const totalCount = await Transaction.countDocuments({
      mode: { $in: ['WAND', 'RAND'] },
    });

    // Determine if there are more transactions to load
    const hasMore = totalCount > skip + limit;

    // Return the transactions and whether more are available
    return res.status(200).json({
      transactions,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
