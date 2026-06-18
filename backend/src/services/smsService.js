/**
 * Sends an SMS using the new SMS-Gate API Gateway.
 * @param {string} mobile - Recipient mobile number
 * @param {string} message - Message text
 * @returns {Promise<any>}
 */
const sendSMS = async (mobile, message) => {
  try {
    const username = process.env.SMS_GATEWAY_USERNAME || "D5UBP-";
    const password = process.env.SMS_GATEWAY_PASSWORD || "1vsxknasonkcsl";
    
    // Clean and format the number for Pakistan (expects +923xxxxxxxxx format)
    let formattedMobile = mobile.replace(/\s+/g, '').replace(/-/g, '').replace(/\+/g, '');
    if (formattedMobile.startsWith('03')) {
      formattedMobile = '92' + formattedMobile.substring(1);
    }
    if (!formattedMobile.startsWith('+')) {
      formattedMobile = '+' + formattedMobile;
    }
    
    console.log(`📤 [SMS Service] Attempting to send SMS to: ${formattedMobile} using SMS-Gate`);
    
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    const url = "https://api.sms-gate.app/3rdparty/v1/messages";
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        "textMessage": { "text": message },
        "phoneNumbers": [formattedMobile]
      })
    });
    
    const status = response.status;
    const data = await response.text();
    console.log(`✅ [SMS Service] Gateway Response (Status ${status}):`, data);
    
    if (status >= 400) {
      throw new Error(`Gateway returned status ${status}: ${data}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ [SMS Service] Failed to send SMS:', error.message);
    throw error;
  }
};

module.exports = { sendSMS };
