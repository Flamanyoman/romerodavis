import mongoose from 'mongoose';

// Helper function to round down to nearest multiple of 5
const roundDownToNearest5 = (value) => Math.floor(value / 5) * 5;

// Define the User schema
const userSchema = new mongoose.Schema({
  phoneNum: { type: Number, required: true, unique: true },
  password: { type: String, required: true },

  referals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  accountDetails: {
    bank: { type: String },
    accountNum: { type: Number },
    accountName: { type: String },
  },

  wallet: {
    recharged: {
      refs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
      balance: { type: Number, default: 0, required: true },
    },
    invested: {
      refs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
      balance: { type: Number, default: 0, required: true },
    },
    income: {
      refs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
      balance: { type: Number, default: 0, required: true },
    },
    withDrawn: {
      refs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
      balance: { type: Number, default: 0, required: true },
    },
  },
});

// Pre-save middleware to round down balances to the nearest multiple of 5
userSchema.pre('save', function (next) {
  // Round down wallet balances
  this.wallet.recharged.balance = roundDownToNearest5(this.wallet.recharged.balance);
  this.wallet.invested.balance = roundDownToNearest5(this.wallet.invested.balance);
  this.wallet.income.balance = roundDownToNearest5(this.wallet.income.balance);
  this.wallet.withDrawn.balance = roundDownToNearest5(this.wallet.withDrawn.balance);

  next();
});

// Pre-update middleware to handle rounding during update operations
userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.wallet) {
    if (update.wallet.recharged && update.wallet.recharged.balance) {
      update.wallet.recharged.balance = roundDownToNearest5(update.wallet.recharged.balance);
    }
    if (update.wallet.invested && update.wallet.invested.balance) {
      update.wallet.invested.balance = roundDownToNearest5(update.wallet.invested.balance);
    }
    if (update.wallet.income && update.wallet.income.balance) {
      update.wallet.income.balance = roundDownToNearest5(update.wallet.income.balance);
    }
    if (update.wallet.withDrawn && update.wallet.withDrawn.balance) {
      update.wallet.withDrawn.balance = roundDownToNearest5(update.wallet.withDrawn.balance);
    }
  }

  this.setUpdate(update);
  next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

export default User;
