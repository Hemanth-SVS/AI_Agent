/**
 * Parse various date formats to YYYY-MM-DD
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Remove extra spaces and normalize
  dateString = dateString.trim().toLowerCase();
  
  // Try different formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // Month DD, YYYY or DD Month YYYY
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s,.-]+(\d{1,2})[\s,.-]+(\d{4})$/i,
    /^(\d{1,2})[\s,.-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s,.-]+(\d{4})$/i,
  ];
  
  const monthNames = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let year, month, day;
      
      if (format.source.includes('jan|feb')) {
        // Month name format
        if (match[1] in monthNames) {
          month = monthNames[match[1]];
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          day = parseInt(match[1]);
          month = monthNames[match[2]];
          year = parseInt(match[3]);
        }
      } else if (format.source.includes('^\\d{4}')) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        // MM-DD-YYYY or DD-MM-YYYY (assume MM-DD-YYYY)
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      // Validate
      if (year >= 1900 && year <= new Date().getFullYear() && 
          month >= 1 && month <= 12 && 
          day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

module.exports = { parseDate };

