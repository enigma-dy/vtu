import axios from 'axios';
import { config } from 'dotenv';
config();
async function makePayment() {
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: '123456789abc',
        amount: '7500',
        currency: 'NGN',
        redirect_url: 'https://example_company.com/success',
        customer: {
          email: 'developers@flutterwavego.com',
          name: 'Flutterwave Developers',
          phonenumber: '09012345678',
        },
        customizations: {
          title: 'Flutterwave Standard Payment',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Payment Link:', response.data.data.link);
  } catch (err) {
    const error = err as any;
    console.error('Error Code:', error.code);
    console.error('Error Response:', error.response?.data);
  }
}

makePayment();
