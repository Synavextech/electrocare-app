import axios from 'axios';
export const getMpesaAccessToken = async () => {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        auth: {
            username: process.env.MPESA_CONSUMER_KEY,
            password: process.env.MPESA_CONSUMER_SECRET,
        },
    });
    return response.data.access_token;
};
// Implement Daraja API calls for STK Push, withdrawals, etc.
// Example stub for withdrawal
export async function initiateWithdrawal(phone, amount) {
    // Use axios to call M-Pesa APIs with consumer key/secret
    // Return transaction ID or error
}
//# sourceMappingURL=mpesa.js.map