import mongoose from 'mongoose';

// Define the User schema
const userSchema = new mongoose.Schema({
  phoneNum: { type: Number, required: true, unique: true },
  password: { type: String, required: true },

  referals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

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

// Create the User model
const User = mongoose.model('User', userSchema);

export default User;
