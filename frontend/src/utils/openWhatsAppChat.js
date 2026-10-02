export const openWhatsAppChat = (mobile) => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  
  // 10 अंकों का वैलिडेशन
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const finalPhone = `91${cleanPhone}`;
  
  // 📱 मोबाइल और कैपेसिटर ऐप के लिए यूआरएल
  const whatsappUrl = `https://wa.me/${finalPhone}`;
  
  const isCapacitor = window.Capacitor;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isCapacitor || isMobileDevice) {
    // 📱 मोबाइल और कैपेसिटर ऐप के लिए सीधे ऐप ट्रिगर होगी
    window.location.href = whatsappUrl;
  } else {
    // 💻 PC / Desktop के लिए:
    // अब यहाँ \${finalPhone} बिल्कुल सही तरीके से बैकटिक्स के साथ लिखा है
    const pcWhatsappUrl = `https://whatsapp.com/${finalPhone}`;
    
    let link = document.getElementById("whatsapp-share-link");
    
    if (!link) {
      link = document.createElement("a");
      link.id = "whatsapp-share-link";
      link.target = "WhatsAppChatWindow"; // यह फिक्स नाम हर बार इसी टैब को रीयूज़ करेगा
      link.style.display = "none";
      document.body.appendChild(link);
    }
    
    link.href = pcWhatsappUrl;
    link.click(); // वर्चुअल क्लिक ट्रिगर करें
  }
};
