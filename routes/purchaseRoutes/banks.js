import axios from 'axios';

export const banks = async (req, res) => {
  const secret_key = process.env.PAYSTACK_SECRET;

  try {
    // Fetch the list of banks from the Paystack API
    const banksResponse = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${secret_key}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    // Respond with the page data and the list of banks
    res.status(200).json({ bank: banksResponse.data.data });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while processing your request.' });
  }
};

export const verifyBank = async (req, res) => {
  const { accountNumber, bank } = req.body;

  console.log(accountNumber, bank);

  try {
    const response = await axios.get(
      `https://nubapi.com/api/verify?account_number=${accountNumber}&bank_code=${bank}`,
      {
        headers: {
          Authorization:
            'Bearer 8M5iLxT5BVg305GyxkwBCctA7flKgRfqaSgKSPiUd1a74d3e',
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
    console.log(response.data);
  } catch (error) {
    res.status(500).json({
      message: 'Error verifying bank details',
      error: error.response?.data || error.message,
    });
    console.log(error);
  }
};
