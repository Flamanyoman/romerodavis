import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    mode: { type: String, required: true },
    name: { type: String },
    amount: { type: Number, default: 0, required: true },
    dailyIncome: { type: Number },
    totalIncome: { type: Number },
    maturity: { type: Number }, // Maturity in number of days
    approved: { type: Boolean, default: false },
    matured: { type: Boolean, default: false },
    accountName: {
      type: String,
      required: function () {
        return this.mode === 'RAND';
      },
    },
    buyer: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true } // This includes 'createdAt' by default
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
