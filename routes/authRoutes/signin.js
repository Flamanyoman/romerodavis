import bcrypt from 'bcryptjs';
import User from '../../models/user.js';

const signin = (req, res, next) => {
  const { phoneNum, password } = req.body;

  // Find the user by phone number
  User.findOne({ phoneNum })
    .populate({
      path: 'wallet.invested.refs', // Path to the refs field you want to populate
      select: 'mode dailyIncome matured withdrawn', // Select only these fields
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: 'Phone number not found' });
      }

      // Compare the provided password with the hashed password in the database
      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid password' });
        }

        // If the credentials are valid, return the user information with selected fields populated
        res.status(200).json({
          message: 'Signin successful',
          user: {
            id: user._id,
            phoneNum: user.phoneNum,
            inviteCode: user.inviteCode,
            referalsCount: user.referals.length,
            accountDetails: user.accountDetails,
            wallet: {
              recharged: {
                balance: user.wallet.recharged.balance,
                refs: user.wallet.recharged.refs,
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
      });
    })
    .catch((err) => {
      next(err); // Pass any errors to the error handling middleware
    });
};

export default signin;
