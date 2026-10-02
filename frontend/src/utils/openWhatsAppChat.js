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

  // व्हाट्सएप का ऑफिशियल और सही डायरेक्ट चैट लिंक
  const whatsappUrl = `https://wa.me/${finalPhone}`;

  if (isCapacitor || isMobileDevice) {
    // 📱 मोबाइल के लिए: सीधे ऐप ट्रिगर करेगा
    window.location.href = whatsappUrl;
  } else {
    // 💻 PC / Desktop के लिए:
    let link = document.getElementById("whatsapp-share-link");
    
    if (!link) {
      link = document.createElement("a");
      link.id = "whatsapp-share-link";
      // यह 'target' नाम यह सुनिश्चित करेगा कि बार-बार नए टैब न खुलें, 
      // बल्कि एक ही निर्धारित टैब रीयूज़ हो।
      link.target = "WhatsAppChatWindow"; 
      link.style.display = "none";
      document.body.appendChild(link);
    }
    
    link.href = whatsappUrl;
    link.click(); // डायरेक्ट चैट के लिए वर्चुअल क्लिक
  }
};