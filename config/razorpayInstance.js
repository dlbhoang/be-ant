const Razorpay = require('razorpay');

// Thay thế các giá trị bên dưới bằng thông tin thực tế của bạn
const razorpayInstance = new Razorpay({
    key_id: 'your_key_id', // Thay 'your_key_id' bằng Key ID của bạn
    key_secret: 'your_key_secret', // Thay 'your_key_secret' bằng Key Secret của bạn
    headers: {
        "X-Razorpay-Account": 'your_merchant_id', // Thay 'your_merchant_id' bằng Merchant ID (nếu có)
    },
});

module.exports = razorpayInstance;
