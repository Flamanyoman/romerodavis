import User from '../../models/user.js';

const getUserDetails = async (req, res, next) => {
  const { phoneNum } = req.query;
  console.log(phoneNum);

  try {
    const user = await User.aggregate([
      { $match: { phoneNum: parseFloat(phoneNum) } }, // Match the user by phoneNum
      {
        $lookup: {
          from: 'users', // Referrer collection
          localField: 'referedBy',
          foreignField: '_id',
          as: 'referredBy',
        },
      },
      {
        $unwind: {
          path: '$referredBy',
          preserveNullAndEmptyArrays: true, // Ensure that if there's no referrer, it still returns the user
        },
      },
      {
        $lookup: {
          from: 'users', // Referrals collection
          localField: 'referals',
          foreignField: '_id',
          as: 'referals',
        },
      },
      {
        $lookup: {
          from: 'transactions', // Recharged refs collection
          localField: 'wallet.recharged.refs',
          foreignField: '_id',
          as: 'wallet.recharged.refs',
        },
      },
      {
        $lookup: {
          from: 'transactions', // Invested refs collection
          localField: 'wallet.invested.refs',
          foreignField: '_id',
          as: 'wallet.invested.refs',
        },
      },
      {
        $lookup: {
          from: 'transactions', // Income refs collection
          localField: 'wallet.income.refs',
          foreignField: '_id',
          as: 'wallet.income.refs',
        },
      },
      {
        $lookup: {
          from: 'transactions', // Withdrawn refs collection
          localField: 'wallet.withDrawn.refs',
          foreignField: '_id',
          as: 'wallet.withDrawn.refs',
        },
      },
      {
        $project: {
          referredBy: {
            $cond: {
              if: { $isArray: '$referredBy' },
              then: { $arrayElemAt: ['$referredBy.phoneNum', 0] },
              else: '$referredBy.phoneNum',
            },
          },
          referals: {
            $cond: {
              if: { $isArray: '$referals' },
              then: '$referals.phoneNum',
              else: [],
            },
          },
          accountDetails: '$accountDetails.accountName',
          'wallet.income.balance': 1,
          'wallet.recharged.balance': 1,
          'wallet.recharged.refs': {
            amount: 1,
            approved: 1,
            accountName: 1,
            timeStamp: 1,
          },
          'wallet.invested.balance': 1,
          'wallet.invested.refs': {
            mode: 1,
            totalIncome: 1,
            timeStamp: 1,
          },
          'wallet.withDrawn.balance': 1,
          'wallet.withDrawn.refs': {
            amount: 1,
            approved: 1,
            timeStamp: 1,
          },
        },
      },
    ]).exec();

    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
    console.log(err);
  }
};

export default getUserDetails;
