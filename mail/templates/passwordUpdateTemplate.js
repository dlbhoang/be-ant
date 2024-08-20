const passwordUpdateTemplate = (email, name) => {
  return `
	<!DOCTYPE html>
	<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Xác nhận cập nhật mật khẩu</title>

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
        <p class="message">Xác nhận cập nhật mật khẩu</p>

        <p>Chào ${name},</p>
        <p>Mật khẩu của bạn đã được cập nhật thành công cho email <span class="highlight">${email}</span>.</p>
        <p>Nếu bạn không yêu cầu thay đổi mật khẩu này, vui lòng liên hệ ngay với chúng tôi để bảo mật tài khoản của bạn.</p>
      </div>

      <!-- Footer -->
      <div class="support">
        <p>Nếu bạn có thắc mắc hoặc cần hỗ trợ, vui lòng liên hệ với chúng tôi theo địa chỉ<a href="ant.create@gmail.com">ant.create@gmail.com</a>.Chúng tôi ở đây để giúp đỡ!</p>
      </div>
    </div>
	</body>
	</html>
`;
};

module.exports = passwordUpdateTemplate;
