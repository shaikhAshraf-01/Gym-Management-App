import { BrevoClient } from "@getbrevo/brevo";

// Initialize the modern Brevo API client directly using the constructor class
const brevo = new BrevoClient({ 
  apiKey: process.env.BREVO_API_KEY 
});

const sendOTPEmails = async (email, otp) => {
  try {
    // Deliver transactional payload using v6 namespace architecture
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: { 
        name: "GymOpsFlow", 
        email: "gymopsflow@gmail.com" // Must match your active single sender address in Brevo
      },
      to: [{ email: email }],
      subject: "Your OTP for Login - GymOpsFlow",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">GymOpsFlow Login Verification</h2>
          <p style="font-size: 16px; color: #555;">Use the following One-Time Password (OTP) to complete your login.</p>
          <div style="background-color: #f4f4f6; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This OTP is valid for <strong>5 minutes</strong> only. Please do not share it with anyone.</p>
        </div>
      `,
    });

    console.log("OTP email sent successfully via Brevo v6 engine.");
    return true;

  } catch (error) {
    console.error("System error caught during Brevo dispatch:", error.message);
    return false;
  }
};

export default sendOTPEmails;
