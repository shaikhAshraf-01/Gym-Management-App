import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmails = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "GymOpsFlow <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP for Login - GymOpsFlow",
      html: `
        <h2>GymOpsFlow Login Verification</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes only. Please do not share it with anyone.</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("OTP email sent:", data);
    return true;

  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

export default sendOTPEmails;