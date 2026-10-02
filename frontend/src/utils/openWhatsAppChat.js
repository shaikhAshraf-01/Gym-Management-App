export const openWhatsAppChat = (mobile) => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  
  // 10 अंकों का वैलिडेशन
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const finalPhone = `91${cleanPhone}`;
  
  // यूनिवर्सल लिंक (यह मोबाइल ऐप और पीसी दोनों के लिए बेस्ट है)
  const whatsappUrl = `https://wa.me/${finalPhone}`;
  
  const isCapacitor = window.Capacitor;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isCapacitor || isMobileDevice) {
    // मोबाइल ब्राउज़र और GymOpsFlow ऐप दोनों के लिए:
    // यह सीधे फ़ोन में इंस्टॉल असली WhatsApp ऐप को बिना किसी टाइमर के ट्रिगर कर देगा।
    window.location.href = whatsappUrl;
  } else {
    // PC / Desktop Web के लिए:
    // एक ही फिक्स टैब रीयूज़ होगा, जिससे बार-बार नया टैब नहीं खुलेगा।
    window.open(whatsappUrl, "WhatsAppChatWindow");
  }
};
