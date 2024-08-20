exports.contactUsEmail = (
  email,
  firstName,
  lastName,
  message,
  phoneNo,
  countryCode
) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Xác nhận mẫu liên hệ</title>

    <style>
      body {
        background-color: #ffffff;
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.4;
        color: #333333;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        text-align: center;
      }

      .logo {
        max-width: 200px;
        margin-bottom: 20px;
      }

      .message {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .body {
        font-size: 16px;
        margin-bottom: 20px;
      }

      .cta {
        display: inline-block;
        padding: 10px 20px;
        background-color: #ffd60a;
        color: #000000;
        text-decoration: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        margin-top: 20px;
      }

      .support {
        font-size: 14px;
        color: #999999;
        margin-top: 20px;
      }

      .highlight {
        font-weight: bold;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <!-- Header -->
      <div>
        <a href="https://fe-ant-create.vercel.app/">
          <img class="logo" src="https://i.postimg.cc/qMRF0ctw/logo-yellow-email.png" alt="StudyNotion-Logo" />
        </a>
      </div>

      <!-- Body -->
      <div class="body">
        <p class="message">Xác nhận mẫu liên hệ</p>

        <p>Gửi ${firstName} ${lastName},</p>
        <p>Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi đã nhận được tin nhắn của bạn và sẽ trả lời bạn trong thời gian sớm nhất.</p>
        <p>Dưới đây là chi tiết bạn cung cấp:</p>
        <p>Tên: ${firstName} ${lastName}</p>
        <p>Email: ${email}</p>
        <p>Số điện thoại: ${countryCode} ${phoneNo}</p>
        <p>Tin nhắn: ${message}</p>
        <p>Chúng tôi đánh giá cao sự quan tâm của bạn và sẽ sớm liên hệ lại với bạn.</p>
      </div>

      <!-- Footer -->
      <div class="support">
        <p>Nếu bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi theo địa chỉ<a href="ant.create@gmail.com">ant.create@gmail.com</a>.Chúng tôi ở đây để giúp đỡ!</p>
      </div>
    </div>
  </body>
</html>

  `;
}
