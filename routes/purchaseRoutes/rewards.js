import User from '../../models/user.js';
import mongoose from 'mongoose';

// Rewards API endpoint
export const claimReward = async (req, res) => {
  try {
    const { userId, reward, max } = req.body;


    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } }, // Use 'new' keyword here
      {
        $lookup: {
          from: 'users',
          localField: 'referals',
          foreignField: '_id',
          as: 'referrals',
        },
      },
      { $unwind: '$referrals' },
      { $match: { 'referrals.wallet.invested.balance': { $gt: 1000 } } },
      { $count: 'totalInvites' },
    ]);
    // Extract the totalInvites count safely
    const totalInvites =
      result.length > 0 && result[0].totalInvites ? result[0].totalInvites : 0;

    const rewardAmount = parseRewardToNumber(reward);

    const isClaimable = totalInvites >= max;
    const hasClaimed = user.wallet.income.balance >= parseInt(rewardAmount);

    if (isClaimable && hasClaimed) {
      return res.status(401).json({ message: 'Aready claimed' });
    }

    if (!isClaimable || hasClaimed) {
      return res.status(401).json({ message: 'Cannot be claimed' });
    }

    user.wallet.income.balance += rewardAmount;
    await user.save();
    return res.status(200).json({ message: 'Reward claimed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const team = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameters

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Calculate total invites with specific conditions
    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } }, // Use 'new' keyword here
      {
        $lookup: {
          from: 'users',
          localField: 'referals',
          foreignField: '_id',
          as: 'referrals',
        },
      },
      { $unwind: '$referrals' },
      { $match: { 'referrals.wallet.invested.balance': { $gt: 1000 } } },
      { $count: 'totalInvites' },
    ]);

    // Extract the totalInvites count
    const totalInvites = result.length > 0 ? result[0].totalInvites : 0;
    // Prepare data to be sent back to the frontend
    const data = {
      inviteGoals: [
        { min: 1, max: 10, reward: '1K' },
        { min: 11, max: 30, reward: '4K' },
        { min: 31, max: 90, reward: '20K' },
        { min: 91, max: 300, reward: '100K' },
        { min: 301, max: 1000, reward: '500K' },
        { min: 1001, max: 3000, reward: '3M' },
      ],
      totalInvites, // Send the total invites
      totalIncome: user.wallet.income.balance, // Send user's total income
    };

    return res.status(200).json(data); // Send the data as response
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to parse reward amount from string
function parseRewardToNumber(reward) {
  const multiplier = reward.includes('K')
    ? 1000
    : reward.includes('M')
    ? 1000000
    : 1;
  return parseFloat(reward) * multiplier;
}
