const automationService = require('./automationService');
const axios = require('axios');

const VOTER_PORTAL_URL = process.env.VOTER_PORTAL_URL || 'http://localhost:5000';

class VoterApiService {
  
  async autoSignupAndLogin(email, password, mobile) {
    return await automationService.autoSignupAndLogin(email, password, mobile);
  }

  async submitVoterRegistration(data) {
    return await automationService.submitVoterRegistration(data);
  }

  async checkApplicationStatus(applicationId) {
    try {
      console.log(`[🤖 AUTOMATION] Checking status for application: ${applicationId}`);
      
      // Try to get status via API if we have auth token
      // For now, use automation to check status
      const page = await automationService.getPage();
      
      if (!automationService.isLoggedIn) {
        return { 
          success: false, 
          message: 'Not logged in. Please login first to check status.' 
        };
      }

      await page.goto(VOTER_PORTAL_URL, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#app-container');
      
      // Navigate to status tab
      await page.click('#status-tab-btn');
      await page.waitForSelector('#statusForm', { timeout: 10000 });
      
      // Clear and enter application ID
      await page.evaluate(() => {
        const appIdField = document.getElementById('applicationId');
        if (appIdField) appIdField.value = '';
      });
      await page.type('#applicationId', applicationId);
      await page.click('#statusForm button[type="submit"]');
      
      // Wait for response
      await page.waitForSelector('#statusResponse.show', { timeout: 15000 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for JSON to render
      
      const responseText = await page.$eval('#statusResponse', el => el.textContent);
      const responseClass = await page.$eval('#statusResponse', el => el.className);
      
      const isSuccess = responseClass.includes('success');
      
      // Try to parse JSON response
      let statusData = {
        applicationId,
        status: 'Unknown',
        voterId: null,
        remarks: responseText
      };

      // Try to parse as JSON
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          statusData = {
            applicationId: parsed.applicationId || applicationId,
            status: parsed.status || 'Unknown',
            voterId: parsed.voterId || null,
            submittedDate: parsed.submittedDate || null,
            remarks: parsed.remarks || responseText
          };
        }
      } catch (e) {
        // If JSON parsing fails, try text extraction
        if (responseText.includes('Pending')) statusData.status = 'Pending';
        else if (responseText.includes('Approved')) statusData.status = 'Approved';
        else if (responseText.includes('Rejected')) statusData.status = 'Rejected';
        
        // Try to extract voter ID from text
        const voterIdMatch = responseText.match(/voterId["\s:]+([A-Z0-9]+)/i) || responseText.match(/\b([A-Z]{2}\d{7})\b/);
        if (voterIdMatch) {
          statusData.voterId = voterIdMatch[1];
        }
      }

      console.log('[🤖 AUTOMATION] Status data:', statusData);

      return {
        success: isSuccess,
        data: statusData,
        message: responseText
      };
    } catch (error) {
      console.error('[🤖 AUTOMATION] Status check failed:', error.message);
      return { 
        success: false, 
        message: 'Failed to check status: ' + error.message 
      };
    }
  }
  
  async searchVoter(voterId) {
    try {
      console.log(`[🤖 AUTOMATION] Searching for voter: ${voterId}`);
      
      // Use API call for search (public endpoint)
      const response = await axios.get(`${VOTER_PORTAL_URL}/api/search/voter`, {
        params: { voterId },
        timeout: 10000
      });

      if (response.data.success && response.data.data && response.data.data.length > 0) {
        return {
          success: true,
          data: response.data.data[0],
          message: `Found voter: ${response.data.data[0].fullName}`
        };
      } else {
        return {
          success: false,
          message: 'Voter not found'
        };
      }
    } catch (error) {
      console.error('[🤖 AUTOMATION] Voter search failed:', error.message);
      
      // Fallback: try via automation
      try {
        const page = await automationService.getPage();
        await page.goto(VOTER_PORTAL_URL, { waitUntil: 'networkidle0' });
        await page.waitForSelector('#app-container');
        
        await page.click('#search-tab-btn');
        await page.waitForSelector('#searchForm');
        
        // Select voter ID search
        await page.select('#searchType', 'voterId');
        await page.type('#searchVoterId', voterId);
        await page.click('#searchForm button[type="submit"]');
        
        await page.waitForSelector('#searchResponse.show', { timeout: 10000 });
        const responseText = await page.$eval('#searchResponse', el => el.textContent);
        
        return {
          success: true,
          data: { voterId, info: responseText },
          message: responseText
        };
      } catch (autoError) {
        return {
          success: false,
          message: 'Voter search failed: ' + error.message
        };
      }
    }
  }
}

module.exports = new VoterApiService();
