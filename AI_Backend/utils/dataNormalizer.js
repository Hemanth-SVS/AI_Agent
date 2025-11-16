/**
 * Normalize user input data
 */
const { parseDate } = require('./dateParser');

function normalizeGender(gender) {
  if (!gender) return null;
  
  const normalized = gender.trim().toLowerCase();
  
  if (normalized.includes('male') || normalized === 'm' || normalized === 'man') {
    return 'Male';
  }
  if (normalized.includes('female') || normalized === 'f' || normalized === 'woman') {
    return 'Female';
  }
  if (normalized.includes('other') || normalized === 'o') {
    return 'Other';
  }
  
  return null;
}

function normalizeDate(dateString) {
  return parseDate(dateString);
}

function extractRegistrationData(message) {
  const data = {};
  
  // Extract Aadhaar (12 digits)
  const aadhaarMatch = message.match(/\b\d{12}\b/);
  if (aadhaarMatch) data.aadhaar = aadhaarMatch[0];
  
  // Extract Mobile (10 digits) - be more careful to get exactly 10 digits
  const mobileMatch = message.match(/\b(\d{10})\b/);
  if (mobileMatch) {
    const mobile = mobileMatch[1];
    // Validate it's exactly 10 digits and doesn't start with 0 (usually)
    if (mobile.length === 10) {
      data.mobile = mobile;
    }
  }
  
  // Extract Email
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) data.email = emailMatch[0];
  
  // Try to extract date
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s,.-]+\d{1,2}[\s,.-]+\d{4}\b/i,
    /\b\d{1,2}[\s,.-]+\d{1,2}[\s,.-]+\d{4}\b/,
    /\b\d{4}[\s,.-]+\d{1,2}[\s,.-]+\d{1,2}\b/
  ];
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      const parsed = parseDate(match[0]);
      if (parsed) {
        data.dob = parsed;
        break;
      }
    }
  }
  
  // Extract gender
  const genderMatch = message.match(/\b(male|female|other|m|f|o)\b/i);
  if (genderMatch) {
    data.gender = normalizeGender(genderMatch[0]);
  }
  
  return data;
}

module.exports = {
  normalizeGender,
  normalizeDate,
  extractRegistrationData
};

