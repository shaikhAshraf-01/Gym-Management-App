export const openWhatsAppChat = (mobile, messageText = "") => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  
  // 10 अंकों का वैलिडेशन
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const finalPhone = `91${cleanPhone}`;
  
  const isCapacitor = window.Capacitor;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // मैसेज को सही तरीके से एन्कोड करना
  const encodedMessage = encodeURIComponent(messageText);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedMessage}`;

  if (isCapacitor || isMobileDevice) {
    // 📱 मोबाइल और कैपेसिटर ऐप के लिए: सीधे WhatsApp ऐप खुलेगा
    window.location.href = whatsappUrl;
  } else {
    // 💻 PC / Desktop के लिए: हमेशा एक ही टैब रीयूज़ होगा, नया टैब नहीं खुलेगा
    window.open(whatsappUrl, "WhatsAppChatWindow");
  }
};