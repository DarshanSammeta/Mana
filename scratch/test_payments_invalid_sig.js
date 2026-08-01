const axios = require('axios');
require('dotenv').config();

async function run() {
  console.log('--- TESTING PAYMENTS INVALID SIGNATURE ---');
  try {
    const response = await axios.post('http://localhost:3000/api/payments/verify', {
      razorpay_order_id: 'order_invalid',
      razorpay_payment_id: 'pay_invalid',
      razorpay_signature: 'sig_invalid',
      bookingId: 'book_invalid'
    }, {
      headers: {
        'Authorization': 'Bearer SOME_INVALID_TOKEN'
      },
      validateStatus: false
    });

    console.log('Status Code:', response.status);
    console.log('Response Body:', response.data);

    if (response.status === 401) {
      console.log('PASS: Correctly rejected with 401 Unauthorized.');
    } else {
      console.log('FAIL: Expected 401 Unauthorized.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
