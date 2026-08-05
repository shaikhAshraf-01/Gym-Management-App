import transporter from "../config/nodemailer.js";

const sendOTPEmails = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Login GymOpsFlow",
      html: `
        <h2>GymOpsFlow Login Verification</h2>
        <p>Your OTP is : <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes only. Please do not share it with anyone.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

export default sendOTPEmails;
