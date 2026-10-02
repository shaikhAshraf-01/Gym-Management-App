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
    // 📱 मोबाइल और कैपेसिटर ऐप के लिए: यह सीधे फ़ोन की WhatsApp ऐप खोल देगा
    window.location.href = `https://wa.me/${finalPhone}`;
  } else {
    // 💻 PC / Desktop के लिए:
    // '&app_absent=0' लगाने से "Continue to chat" वाला पेज बायपास हो जाएगा 
    // और यह सीधे खुले हुए WhatsApp Web के अंदर उस नंबर की चैट बॉक्स पर ले जाएगा।
    const pcWhatsappUrl = `https://whatsapp.com/${finalPhone}&app_absent=0`;
    
    let link = document.getElementById("whatsapp-share-link");
    
    if (!link) {
      link = document.createElement("a");
      link.id = "whatsapp-share-link";
      link.target = "WhatsAppChatWindow"; // यह नाम टैब को रीयूज़ (सिंगल टैब) रखेगा
      link.style.display = "none";
      document.body.appendChild(link);
    }
    
    link.href = pcWhatsappUrl;
    link.click(); // वर्चुअल क्लिक ट्रिगर करें
  }
};
