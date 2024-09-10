import mongoose from 'mongoose';
import User from '../../models/user.js';
import Transaction from '../../models/transaction.js';

// Define the API handler function
export const getReferredUsers = async (req, res) => {
  try {
    const { userId } = req.query; // Get the referring user's ID from query parameters

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Aggregation pipeline to retrieve referred users with their phone numbers, balances, and last investment date
    const referredUsers = await User.aggregate([
      { $match: { referedBy: new mongoose.Types.ObjectId(userId) } }, // Match users referred by the specified user
      {
        $lookup: {
          from: 'transactions', // Join with the Transaction collection
          localField: 'wallet.invested.refs', // Field in User that refers to Transaction IDs
          foreignField: '_id', // Field in Transaction that matches User's refs
          as: 'investments', // Alias for the joined transactions
        },
      },
      {
        $addFields: {
          latestInvestmentDate: {
            $ifNull: [
              {
                $arrayElemAt: [
                  {
                    $reverseArray: [
                      {
                        $sortArray: {
                          input: '$investments',
                          sortBy: { createdAt: -1 }, // Sort investments by creation date
                        },
                      },
                    ],
                  },
                  0,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          phoneNum: 1,
          'wallet.invested.balance': 1,
          latestInvestmentDate: {
            $ifNull: ['$latestInvestmentDate.createdAt', null],
          }, // Extract the createdAt date
        },
      },
    ]);

    // Check if data was found
    if (referredUsers.length === 0) {
      return res.status(404).json({ message: 'No referred users found' });
    }

    // Send the result as a response
    res.status(200).json(referredUsers);
  } catch (err) {
    console.error('Error retrieving referred users data:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
