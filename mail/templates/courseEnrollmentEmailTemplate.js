const courseEnrollmentEmailTemplate = (courseName, name) => {
	return `
	<!DOCTYPE html>
	<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Course Registration Confirmation</title>

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
        <p class="message">Course Registration Confirmation</p>

        <p>Gửi ${name},</p>
        <p>Bạn đã đăng ký khóa học thành công<span class="highlight">"${courseName}"</span>. Chúng tôi rất vui mừng khi có bạn là người tham gia!</p>
        <p>Vui lòng đăng nhập vào bảng thông tin học tập của bạn để truy cập tài liệu khóa học và bắt đầu hành trình học tập của bạn.</p>
        <a class="cta" href="https://fe-ant-create.vercel.app/dashboard/my-profile">Đi tới Trang tổng quan</a>
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

module.exports = courseEnrollmentEmailTemplate;
