import bcrypt from 'bcryptjs';
import User from '../../models/user.js'; // Adjust the import path as needed

const signup = async (req, res, next) => {
  const { phoneNum, password, invitedBy } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ phoneNum });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    let newUser = new User({
      phoneNum,
      password: hashedPassword,
    });

    // If an invitedBy was provided, process it
    if (invitedBy) {
      const referringUserId = invitedBy;

      // Search for the referring user by the extracted userId
      const referringUser = await User.findById(referringUserId);

      if (!referringUser) {
        // If referring user not found, return an error
        return res.status(400).json({ message: 'Wrong referral code' });
      }

      // Add the new user's ID to the referring user's referrals
      referringUser.referals.push(newUser._id);
      await referringUser.save();

      // Add referringUserId to the newUser and save it
      newUser.referedBy = referringUserId;
    }

    // Save the new user
    await newUser.save();

    // Fetch the newly created user with populated refs
    const populatedUser = await User.findById(newUser._id)
      .populate({
        path: 'wallet.recharged.refs',
        select: 'amount createdAt',
      })
      .populate({
        path: 'wallet.invested.refs',
        select: 'amount mode name totalIncome matured withdrawn',
      })
      .populate({
        path: 'wallet.income.refs',
        select: 'amount createdAt',
      })
      .populate({
        path: 'wallet.withDrawn.refs',
        select: 'amount createdAt',
      })
      .exec();

    // Respond with the populated user data
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: populatedUser._id,
        phoneNum: populatedUser.phoneNum,
        inviteCode: populatedUser.inviteCode,
        referalsCount: populatedUser.referals.length,
        accountDetails: populatedUser.accountDetails,
        wallet: {
          recharged: {
            balance: populatedUser.wallet.recharged.balance,
            refs: populatedUser.wallet.recharged.refs,
          },
          invested: {
            balance: populatedUser.wallet.invested.balance,
            refs: populatedUser.wallet.invested.refs, // This will include the populated data
          },
          income: {
            balance: populatedUser.wallet.income.balance,
            refs: populatedUser.wallet.income.refs,
          },
          withDrawn: {
            balance: populatedUser.wallet.withDrawn.balance,
            refs: populatedUser.wallet.withDrawn.refs,
          },
        },
      },
    });
  } catch (err) {
    console.log(err);
    // Handle errors and pass them to the error handling middleware
    if (!res.headersSent) {
      next(err);
    }
  }
};

export default signup;
