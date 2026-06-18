/**
 * Sends an SMS using the SendPK API Gateway.
 * @param {string} mobile - Recipient mobile number
 * @param {string} message - Message text
 * @returns {Promise<any>}
 */
const sendSMS = async (mobile, message) => {
  try {
    const apiKey = process.env.SENDPK_API_KEY || "923316074329-c0bca775-1497-4b58-b1a6-df37765cdfba";
    const sender = process.env.SENDPK_SENDER || "SenderID";
    
    // Clean and format the number for Pakistan (sendpk expects 923xxxxxxxxx format)
    let formattedMobile = mobile.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    if (formattedMobile.startsWith('03')) {
      formattedMobile = '92' + formattedMobile.substring(1);
    }
    
    console.log(`📤 [SMS Service] Attempting to send SMS to: ${formattedMobile}`);
    
    const url = `https://sendpk.com/api/sms.php?api_key=${apiKey}`;
    const params = new URLSearchParams();
    params.append('sender', sender);
    params.append('mobile', formattedMobile);
    params.append('message', message);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)'
      },
      body: params.toString()
    });
    
    const data = await response.text();
    console.log(`✅ [SMS Service] Gateway Response:`, data);
    return data;
  } catch (error) {
    console.error('❌ [SMS Service] Failed to send SMS:', error.message);
    throw error;
  }
};

module.exports = { sendSMS };
