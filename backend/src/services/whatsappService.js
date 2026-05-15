const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;

const initWhatsApp = () => {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE FOR WHATSAPP LOGOUT:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('WhatsApp Web Client is READY!');
    isReady = true;
  });

  client.on('authenticated', () => {
    console.log('WhatsApp Authenticated Successfully');
  });

  client.on('auth_failure', (msg) => {
    console.error('WhatsApp Auth Failure:', msg);
  });

  client.initialize();
};

const sendWhatsAppNotification = async (phoneNumber, message) => {
  if (!isReady) {
    console.log('⚠️ WHATSAPP NOT READY: Please ensure you have scanned the QR code in the terminal.');
    return false;
  }

  try {
    // Format phone number (e.g., 03211234567 -> 923211234567@c.us)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '92' + formattedNumber.substring(1);
    }
    
    // Ensure it has a country code if it doesn't already
    if (formattedNumber.length === 10) {
      formattedNumber = '92' + formattedNumber;
    }

    const chatId = formattedNumber + '@c.us';
    console.log(`📤 Attempting to send WhatsApp to: ${chatId}`);
    
    await client.sendMessage(chatId, message);
    console.log(`✅ WhatsApp sent successfully to ${formattedNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp:', error);
    return false;
  }
};

module.exports = { initWhatsApp, sendWhatsAppNotification };
