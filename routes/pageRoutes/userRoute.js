import User from '../../models/user.js';

const userRoute = async (req, res, next) => {
  const { userId } = req.body; // Get userId from the request body

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId)
      .populate({
        path: 'wallet.recharged.refs',
        select: 'amount createdAt approved accountName',
      })
      .populate({
        path: 'wallet.invested.refs',
        select:
          'amount mode name totalIncome dailyIncome matured withdrawn createdAt',
      })
      .populate({
        path: 'wallet.income.refs',
        select: 'amount createdAt',
      })
      .populate({
        path: 'wallet.withDrawn.refs',
        select: 'amount createdAt approved',
      })
      .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        phoneNum: user.phoneNum,
        inviteCode: user.inviteCode,
        referalsCount: user.referals.length,
        accountDetails: user.accountDetails,
        wallet: {
          recharged: {
            balance: user.wallet.recharged.balance,
            refs: user.wallet.recharged.refs, // This will include the populated data
          },
          invested: {
            balance: user.wallet.invested.balance,
            refs: user.wallet.invested.refs, // This will include the populated data
          },
          income: {
            balance: user.wallet.income.balance,
            refs: user.wallet.income.refs,
          },
          withDrawn: {
            balance: user.wallet.withDrawn.balance,
            refs: user.wallet.withDrawn.refs,
          },
        },
      },
    });
  } catch (err) {
    next(err); // Pass any errors to the error handling middleware
  }
};

export default userRoute;
