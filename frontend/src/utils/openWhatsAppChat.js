export const openWhatsAppChat = (mobile) => {
  const cleanPhone = String(mobile || "").replace(/\D/g, "");
  
  // 10 अंकों का वैलिडेशन
  if (cleanPhone.length !== 10) {
    alert("Invalid WhatsApp mobile number.");
    return;
  }

  const finalPhone = `91${cleanPhone}`;
  
  const isCapacitor = window.Capacitor;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isCapacitor || isMobileDevice) {
    // 📱 मोबाइल और कैपेसिटर ऐप के लिए: (यहाँ \$ बिल्कुल सही बैकटिक्स के साथ है)
    window.location.href = `https://wa.me/${finalPhone}`;
  } else {
    // 💻 PC / Desktop के लिए:
    // URL को 'web.whatsapp.com' पर पूरी तरह सही किया गया है
    // और यहाँ भी \$ बिल्कुल सही बैकटिक्स के साथ लगाया गया है
    const pcWhatsappUrl = `https://whatsapp.com/${finalPhone}&app_absent=0`;
    
    let link = document.getElementById("whatsapp-share-link");
    
    if (!link) {
      link = document.createElement("a");
      link.id = "whatsapp-share-link";
      link.target = "WhatsAppChatWindow"; // यह एक ही टैब को रीयूज़ रखेगा
      link.style.display = "none";
      document.body.appendChild(link);
    }
    
    link.href = pcWhatsappUrl;
    link.click(); // वर्चुअल क्लिक ट्रिगर करें
  }
};
