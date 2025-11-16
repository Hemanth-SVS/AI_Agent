const puppeteer = require('puppeteer');
const VOTER_PORTAL_URL = process.env.VOTER_PORTAL_URL || 'http://localhost:5000';

class AutomationService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.timeout = 60000; // Increased to 60 seconds for slow operations
  }

  // Helper function to replace deprecated waitForTimeout
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getBrowser() {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    try {
      this.browser = await puppeteer.launch({
        headless: isProduction ? true : false,
        slowMo: isProduction ? 0 : 50,
        devtools: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process'
        ],
        timeout: this.timeout
      });
      
      this.browser.on('disconnected', () => {
        console.log('[🤖 AUTOMATION] Browser disconnected');
        this.browser = null;
        this.page = null;
        this.isLoggedIn = false;
      });
      
      return this.browser;
    } catch (error) {
      console.error('[🤖 AUTOMATION] Failed to launch browser:', error.message);
      throw new Error(`Browser launch failed: ${error.message}`);
    }
  }

  async getPage() {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }
    
    const browser = await this.getBrowser();
    
    try {
      this.page = await browser.newPage();
      this.page.setDefaultTimeout(this.timeout);
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      return this.page;
    } catch (error) {
      console.error('[🤖 AUTOMATION] Failed to create page:', error.message);
      throw new Error(`Page creation failed: ${error.message}`);
    }
  }

  async closeBrowser() {
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isLoggedIn = false;
      console.log('[🤖 AUTOMATION] Browser closed');
    } catch (error) {
      console.error('[🤖 AUTOMATION] Error closing browser:', error.message);
    }
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout, visible: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  async waitForElementDisplayed(selector, timeout = 10000) {
    try {
      await this.page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return el && window.getComputedStyle(el).display !== 'none';
        },
        { timeout },
        selector
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async autoSignupAndLogin(email, password, mobile) {
    if (this.isLoggedIn) {
      console.log('[🤖 AUTOMATION] Already logged in, skipping login/signup');
      return { success: true, message: 'Already logged in.' };
    }
    
    console.log(`[🤖 AUTOMATION] Starting login/signup process for ${email}...`);
    const page = await this.getPage();
    
    try {
      // Navigate to portal
      console.log('[🤖 AUTOMATION] Navigating to portal...');
      await page.goto(VOTER_PORTAL_URL, { 
        waitUntil: 'networkidle0',
        timeout: this.timeout 
      });
      
      await this.delay(2000);
      
      // Check if already logged in
      const isAlreadyLoggedIn = await page.evaluate(() => {
        const appContainer = document.getElementById('app-container');
        return appContainer && window.getComputedStyle(appContainer).display !== 'none';
      });
      
      if (isAlreadyLoggedIn) {
        console.log('[🤖 AUTOMATION] Already logged in on page');
        this.isLoggedIn = true;
        return { success: true, message: 'Already logged in.' };
      }
      
      // Wait for auth container
      console.log('[🤖 AUTOMATION] Waiting for auth container...');
      await this.waitForElement('#auth-container', 10000);
      
      // Try to Login first
      console.log('[🤖 AUTOMATION] Attempting login...');
      await this.waitForElement('#loginEmail', 10000);
      
      await page.evaluate(() => {
        const emailField = document.getElementById('loginEmail');
        const passwordField = document.getElementById('loginPassword');
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
      });
      
      await page.type('#loginEmail', email, { delay: 50 });
      await page.type('#loginPassword', password, { delay: 50 });
      await page.click('#loginForm button[type="submit"]');
      
      // Wait for response
      await this.delay(3000);
      
      // Check for login error message first
      const loginError = await page.evaluate(() => {
        const responseEl = document.getElementById('loginResponse');
        if (!responseEl) return null;
        const text = responseEl.textContent || '';
        const isError = responseEl.classList.contains('error') || responseEl.classList.contains('show');
        return isError && text.toLowerCase().includes('invalid') ? text : null;
      });
      
      // Check if login was successful
      const loginSuccess = await page.evaluate(() => {
        const appContainer = document.getElementById('app-container');
        return appContainer && window.getComputedStyle(appContainer).display !== 'none';
      });
      
      if (loginSuccess) {
        console.log('[🤖 AUTOMATION] ✅ Login successful');
        this.isLoggedIn = true;
        return { success: true, message: 'Logged in successfully.' };
      }
      
      // Login failed - check if it's invalid credentials (account doesn't exist or wrong password)
      if (loginError) {
        console.log('[🤖 AUTOMATION] Login failed with error:', loginError);
        // If invalid credentials, proceed to signup
        console.log('[🤖 AUTOMATION] Invalid credentials detected, proceeding to signup...');
      } else {
        // No clear error, but login didn't succeed - proceed to signup anyway
        console.log('[🤖 AUTOMATION] Login did not succeed, proceeding to signup...');
      }
      
      // Click signup button
      await this.waitForElement('#show-signup', 5000);
      await page.click('#show-signup');
      await this.delay(1500);
      
      // Wait for signup view to be displayed
      await this.waitForElementDisplayed('#signup-view', 5000);
      
      // OTP Flow - Step 1: Send OTP
      console.log('[🤖 AUTOMATION] Sending OTP to', mobile);
      await this.waitForElement('#signupMobile', 5000);
      
      await page.evaluate(() => {
        const mobileField = document.getElementById('signupMobile');
        if (mobileField) mobileField.value = '';
      });
      
      await page.type('#signupMobile', mobile, { delay: 50 });
      await page.click('#otpSendForm button[type="submit"]');
      
      // Wait for OTP response (check for success class or visible response)
      console.log('[🤖 AUTOMATION] Waiting for OTP response...');
      
      // Wait for response element to appear and have content
      await page.waitForFunction(
        () => {
          const responseEl = document.getElementById('otpResponse');
          if (!responseEl) return false;
          const text = responseEl.textContent || '';
          const isVisible = window.getComputedStyle(responseEl).display !== 'none';
          const hasContent = text.trim().length > 0;
          return isVisible && hasContent;
        },
        { timeout: 15000 }
      );
      
      // Extract OTP from response - try multiple patterns
      const otpData = await page.evaluate(() => {
        const responseEl = document.getElementById('otpResponse');
        if (!responseEl) return null;
        const text = responseEl.textContent || '';
        const hasSuccess = responseEl.classList.contains('success');
        const isVisible = window.getComputedStyle(responseEl).display !== 'none';
        
        // Try multiple patterns to extract OTP
        let otp = null;
        
        // Pattern 1: "Demo: 123456" or "Demo:123456"
        const demoMatch = text.match(/Demo:\s*(\d{6})/i);
        if (demoMatch) {
          otp = demoMatch[1];
        }
        
        // Pattern 2: Just 6 digits anywhere in the text
        if (!otp) {
          const digitMatch = text.match(/\b(\d{6})\b/);
          if (digitMatch) {
            otp = digitMatch[1];
          }
        }
        
        // Pattern 3: Any 6 consecutive digits
        if (!otp) {
          const anyMatch = text.match(/(\d{6})/);
          if (anyMatch) {
            otp = anyMatch[1];
          }
        }
        
        return { text, hasSuccess, isVisible, otp };
      });
      
      if (!otpData || !otpData.isVisible) {
        throw new Error('OTP response not received or not visible');
      }
      
      if (!otpData.hasSuccess) {
        throw new Error(`OTP send failed: ${otpData.text}`);
      }
      
      if (!otpData.otp) {
        throw new Error(`Could not extract OTP from response: ${otpData.text}`);
      }
      
      const otp = otpData.otp;
      console.log(`[🤖 AUTOMATION] ✅ OTP extracted from UI: ${otp}`);
      console.log(`[🤖 AUTOMATION] Full response text: ${otpData.text}`);
      
      // Wait for OTP verify form to be displayed
      await this.waitForElementDisplayed('#otpVerifyForm', 10000);
      
      // Automatically enter OTP
      console.log('[🤖 AUTOMATION] Automatically entering OTP:', otp);
      await page.evaluate((otp) => {
        const otpField = document.getElementById('signupOtp');
        if (otpField) {
          otpField.value = '';
          otpField.value = otp;
          // Trigger input event to ensure form validation
          otpField.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, otp);
      
      // Small delay to ensure value is set
      await this.delay(500);
      
      // Verify OTP by clicking submit
      console.log('[🤖 AUTOMATION] Submitting OTP for verification...');
      await page.click('#otpVerifyForm button[type="submit"]');
      
      // Wait for signup phase 2
      console.log('[🤖 AUTOMATION] Waiting for account details form...');
      await this.waitForElementDisplayed('#signup-phase-2', 15000);
      
      console.log('[🤖 AUTOMATION] ✅ OTP verified, filling account details...');
      
      // Fill account details
      await this.waitForElement('#signupEmail', 5000);
      await this.waitForElement('#signupPassword', 5000);
      
      await page.evaluate(() => {
        const emailField = document.getElementById('signupEmail');
        const passwordField = document.getElementById('signupPassword');
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
      });
      
      await page.type('#signupEmail', email, { delay: 50 });
      await page.type('#signupPassword', password, { delay: 50 });
      await page.click('#signupForm button[type="submit"]');
      
      // Wait for successful signup and login
      console.log('[🤖 AUTOMATION] Waiting for login after signup...');
      await this.delay(2000);
      
      const appContainerVisible = await page.evaluate(() => {
        const appContainer = document.getElementById('app-container');
        return appContainer && window.getComputedStyle(appContainer).display !== 'none';
      });
      
      if (!appContainerVisible) {
        // Check for signup error
        const signupError = await page.evaluate(() => {
          const responseEl = document.getElementById('signupResponse');
          if (!responseEl) return null;
          return responseEl.textContent || '';
        });
        
        if (signupError) {
          throw new Error(`Signup failed: ${signupError}`);
        }
        throw new Error('Signup completed but login failed - app container not found');
      }
      
      console.log('[🤖 AUTOMATION] ✅ Signup and login successful');
      this.isLoggedIn = true;
      return { success: true, message: 'Account created and logged in successfully.' };

    } catch (error) {
      console.error('[🤖 AUTOMATION] Login/Signup failed:', error.message);
      console.error('[🤖 AUTOMATION] Stack:', error.stack);
      
      // Take screenshot for debugging
      try {
        const timestamp = Date.now();
        await page.screenshot({ path: `error-screenshot-${timestamp}.png`, fullPage: true });
        console.log(`[🤖 AUTOMATION] Error screenshot saved: error-screenshot-${timestamp}.png`);
        
        // Also log page HTML for debugging
        const html = await page.content();
        console.log('[🤖 AUTOMATION] Page HTML length:', html.length);
      } catch (screenshotError) {
        console.error('[🤖 AUTOMATION] Screenshot failed:', screenshotError.message);
      }
      
      this.isLoggedIn = false;
      
      // Provide more helpful error message
      let errorMessage = error.message;
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Request timed out. The portal may be slow. Please try again.';
      } else if (error.message.includes('Invalid credentials') || error.message.includes('invalid')) {
        errorMessage = 'Invalid credentials. If you don\'t have an account, the system will create one automatically.';
      }
      
      return { 
        success: false, 
        message: `Login/signup failed: ${errorMessage}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  async submitVoterRegistration(details) {
    if (!this.isLoggedIn) {
      return { success: false, message: 'You must be logged in to register. Please login first.' };
    }
    
    const requiredFields = ['aadhaar', 'fullName', 'fatherName', 'dob', 'gender', 'mobile', 'email', 'address', 'state', 'district'];
    const missingFields = requiredFields.filter(field => !details[field]);
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }
    
    console.log(`[🤖 AUTOMATION] Submitting registration for ${details.fullName}...`);
    const page = await this.getPage();
    
    try {
      await page.goto(VOTER_PORTAL_URL, { 
        waitUntil: 'networkidle0',
        timeout: this.timeout 
      });
      
      await this.delay(1000);
      
      // Verify we're logged in
      const isLoggedIn = await page.evaluate(() => {
        const appContainer = document.getElementById('app-container');
        return appContainer && window.getComputedStyle(appContainer).display !== 'none';
      });
      
      if (!isLoggedIn) {
        this.isLoggedIn = false;
        return { success: false, message: 'Session expired. Please login again.' };
      }
      
      // Click register tab
      console.log('[🤖 AUTOMATION] Opening registration form...');
      await page.click('#register-tab-btn');
      await this.delay(1000);
      
      // Wait for Aadhaar form
      await this.waitForElement('#aadhaar', 10000);
      
      // Enter Aadhaar
      await page.evaluate(() => {
        const aadhaarField = document.getElementById('aadhaar');
        if (aadhaarField) aadhaarField.value = '';
      });
      await page.type('#aadhaar', details.aadhaar, { delay: 50 });
      await page.click('#aadhaarForm button[type="submit"]');
      
      // Wait for registration form
      await this.waitForElementDisplayed('#registrationStep', 15000);
      await this.delay(500); // Small delay for form to fully render
      
      console.log('[🤖 AUTOMATION] Filling registration form...');
      
      // Fill ALL form fields - use evaluate for all to ensure values are set
      await page.evaluate((details) => {
        const fields = {
          fullName: details.fullName || '',
          fatherName: details.fatherName || '',
          dob: details.dob || '',
          gender: details.gender || '',
          email: details.email || '',
          mobile: details.mobile || '',
          address: details.address || '',
          state: details.state || '',
          district: details.district || ''
        };
        
        // Set all field values
        Object.keys(fields).forEach(key => {
          const field = document.getElementById(key);
          if (field) {
            field.value = fields[key];
            // Trigger input event for validation
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, details);
      
      // Also type in editable fields to ensure they're properly filled
      await this.delay(300);
      const fatherNameField = await page.$('#fatherName');
      if (fatherNameField) {
        await page.evaluate(el => el.value = '', fatherNameField);
        await page.type('#fatherName', details.fatherName, { delay: 30 });
      }
      
      const stateField = await page.$('#state');
      if (stateField) {
        await page.evaluate(el => el.value = '', stateField);
        await page.type('#state', details.state, { delay: 30 });
      }
      
      const districtField = await page.$('#district');
      if (districtField) {
        await page.evaluate(el => el.value = '', districtField);
        await page.type('#district', details.district, { delay: 30 });
      }
      
      await this.delay(500); // Ensure all fields are filled
      
      // Submit form
      console.log('[🤖 AUTOMATION] Submitting registration...');
      await page.click('#registrationForm button[type="submit"]');
      
      // Wait for response
      await this.delay(2000);
      
      const responseVisible = await this.waitForElementDisplayed('#registrationResponse.show', 20000);
      if (!responseVisible) {
        throw new Error('Registration response not received');
      }
      
      const responseText = await page.$eval('#registrationResponse', el => el.textContent);
      const responseClass = await page.$eval('#registrationResponse', el => el.className);
      
      const appIdMatch = responseText.match(/APP\d+X\d+/);
      const applicationId = appIdMatch ? appIdMatch[0] : null;
      
      // Extract voter ID from response
      const voterIdMatch = responseText.match(/Voter ID[:\s]+([A-Z0-9]+)/i) || 
                          responseText.match(/\b(VOT\d{6})\b/i) ||
                          responseText.match(/Your Voter ID is[:\s]+([A-Z0-9]+)/i);
      const voterId = voterIdMatch ? voterIdMatch[1] : null;
      
      const isSuccess = responseClass.includes('success');
      
      console.log('[🤖 AUTOMATION] Registration response:', responseText.substring(0, 150));
      if (voterId) {
        console.log('[🤖 AUTOMATION] ✅ Voter ID extracted:', voterId);
      }
      
      return { 
        success: isSuccess, 
        message: responseText,
        applicationId: applicationId,
        voterId: voterId
      };
    } catch (error) {
      console.error('[🤖 AUTOMATION] Registration failed:', error.message);
      console.error('[🤖 AUTOMATION] Stack:', error.stack);
      
      return { 
        success: false, 
        message: `Registration automation failed: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new AutomationService();
