import axios from 'axios';

async function run() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/verify-otp', {
      email: 'customer2@example.com',
      otp: '157162'
    });
    console.log('TOKEN:' + res.data.accessToken);
  } catch (e: any) {
    console.error(e.message);
    if (e.response) console.error(e.response.data);
  }
}

run();
