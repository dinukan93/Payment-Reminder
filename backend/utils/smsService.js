import fetch from 'node-fetch';

/**
 * Send SMS OTP using Text.lk API
 * @param {string} phone - Phone number (Sri Lankan format: 94XXXXXXXXX)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Success status
 */
export const sendOtpSms = async (phone, otp) => {
  try {
    const token = process.env.TEXTLK_API_TOKEN;
    const senderId = process.env.TEXTLK_SENDER_ID;
    
    if (!token) {
      console.error('Text.lk API token not configured');
      // In development, log OTP to console
      console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
      return true; // Return true in dev mode to not block testing
    }

    // Format phone number (ensure it starts with 94)
    let formattedPhone = phone.replace(/\D/g, ''); 
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '94' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('94')) {
      formattedPhone = '94' + formattedPhone;
    }

    const message = `Your verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do not share this code.`;

    const response = await fetch('https://app.text.lk/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        recipient: formattedPhone,
        sender_id: senderId,
        message: message
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`SMS OTP sent successfully to ${formattedPhone}`);
      return true;
    } else {
      console.error('Text.lk API error:', data);
      // Still log OTP in console for development
      console.log(`[FALLBACK] OTP for ${phone}: ${otp}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    // Log OTP to console for development/testing
    console.log(`[ERROR FALLBACK] OTP for ${phone}: ${otp}`);
    return false;
  }
};

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate OTP expiry time
 * @param {number} minutes - Minutes until expiry
 * @returns {Date} - Expiry date
 */
export const getOtpExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
