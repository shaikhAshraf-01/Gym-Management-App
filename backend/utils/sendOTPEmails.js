import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmails = async (email, otp) => {
  try {
    // 1. Check if the recipient matches your allowed Resend Sandbox email
    const allowedSandboxEmail = "gymopsflow@gmail.com";

    if (email.toLowerCase() !== allowedSandboxEmail.toLowerCase()) {
      // DEVELOPMENT BYPASS LOGIC:
      console.log("=========================================");
      console.log(`[SANDBOX BYPASS] OTP for ${email} is: ${otp}`);
      console.log("=========================================");
      
      // Return true so the backend treats it as a success!
      return true; 
    }

    // 2. If it IS your email, proceed to send the real email via Resend
    const { data, error } = await resend.emails.send({
      from: "GymOpsFlow <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP for Login - GymOpsFlow",
      html: `
        <h2>GymOpsFlow Login Verification</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 5 minutes only.</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    console.log("OTP email sent successfully via Resend:", data);
    return true;

  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

export default sendOTPEmails;
