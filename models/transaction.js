import mongoose from 'mongoose';

// Helper function to round down to the nearest multiple of 5
const roundDownToNearest5 = (value) =>
  typeof value === 'number' ? Math.floor(value / 5) * 5 : value;

// Define the transaction schema
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
  { timestamps: true } // This includes 'createdAt' and 'updatedAt'
);

// Pre-save middleware to round down amount and totalIncome
transactionSchema.pre('save', function (next) {
  // Round down amount and totalIncome if modified
  if (this.isModified('amount')) {
    this.amount = roundDownToNearest5(this.amount);
  }
  if (this.isModified('totalIncome')) {
    this.totalIncome = roundDownToNearest5(this.totalIncome);
  }
  next();
});

// Pre-update middleware to round down amount and totalIncome during updates
transactionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  // Handle $set operator to round down fields
  if (update.$set) {
    if (update.$set.amount !== undefined) {
      update.$set.amount = roundDownToNearest5(update.$set.amount);
    }
    if (update.$set.totalIncome !== undefined) {
      update.$set.totalIncome = roundDownToNearest5(update.$set.totalIncome);
    }
  }

  this.setUpdate(update); // Apply the modified update object
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
