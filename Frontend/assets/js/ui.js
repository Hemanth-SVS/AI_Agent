// --- Global State ---
let currentAadhaar = '';
let isMobileVerified = false;

// --- Helpers ---
function getToken() {
    return localStorage.getItem('authToken');
}

function isLoggedIn() {
    return !!getToken();
}

// --- DOM Manipulation ---

/**
 * This is the main function that controls the UI.
 * It shows either the Login/Signup view OR the main App.
 */
function updateAuthUI() {
    const loggedIn = isLoggedIn();
    
    // Get main containers
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userStatus = document.getElementById('userStatus'); // In status bar

    if (loggedIn) {
        // Show the main application
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userStatus.style.display = 'block';
        
        // Default to the 'register' tab
        showAppTab('register');

    } else {
        // Show the authentication forms
        authContainer.style.display = 'block';
        appContainer.style.display = 'none';
        userStatus.style.display = 'none';
        
        // Default to the 'login' form
        showAuthForm('login');
    }
}

/**
 * Switches between the Login and Sign Up forms
 * (Only used when logged out)
 */
function showAuthForm(formName) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');

    if (formName === 'signup') {
        loginView.style.display = 'none';
        signupView.style.display = 'block';
    } else {
        loginView.style.display = 'block';
        signupView.style.display = 'none';
    }
}

/**
 * Switches between the tabs in the main application
 * (Only used when logged in)
 */
function showAppTab(tabName) {
  const tabs = document.querySelectorAll('#app-container .tab');
  const tabContents = document.querySelectorAll('#app-container .tab-content');
  
  // Hide all content
  tabContents.forEach(content => content.classList.remove('active'));
  // Deactivate all tab buttons
  tabs.forEach(tab => tab.classList.remove('active'));
  
  // Show the target content
  document.getElementById(tabName).classList.add('active');
  // Activate the target tab button
  document.getElementById(`${tabName}-tab-btn`).classList.add('active');
}


function toggleSearchType() {
  const searchType = document.getElementById('searchType').value;
  const voterIdInput = document.getElementById('searchVoterId');
  const nameInput = document.getElementById('searchName');
  
  if (searchType === 'voterId') {
    voterIdInput.style.display = 'block';
    nameInput.style.display = 'none';
    voterIdInput.required = true;
    nameInput.required = false;
  } else {
    voterIdInput.style.display = 'none';
    nameInput.style.display = 'block';
    voterIdInput.required = false;
    nameInput.required = true;
  }
}

function showResponse(id, payload, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  
  let message = payload;
  if (typeof payload === 'object') {
      message = JSON.stringify(payload, null, 2);
      if(payload.message) message = payload.message; 
  }

  el.textContent = message;
  el.className = `response show ${type}`;
  el.style.display = 'block';
}

function showLoading(id, text = 'Loading...') {
  showResponse(id, text, 'loading');
}

function hideResponse(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  el.textContent = '...';
}

function resetRegistration() {
  // Reset Aadhaar step
  document.getElementById('aadhaarStep').style.display = 'block';
  document.getElementById('aadhaarForm').reset();
  hideResponse('aadhaarResponse');

  // Reset Registration step
  document.getElementById('registrationStep').style.display = 'none';
  document.getElementById('registrationForm').reset();
  hideResponse('registrationResponse');
  
  currentAadhaar = '';

  // Reset OTP forms
  document.getElementById('otpSendForm').reset();
  document.getElementById('otpVerifyForm').reset();
  document.getElementById('signupMobile').readOnly = false;
  document.getElementById('sendOtpBtn').style.display = 'block';
  document.getElementById('otpVerifyForm').style.display = 'none';
  document.getElementById('signup-phase-1').style.display = 'block';
  document.getElementById('signup-phase-2').style.display = 'none';
  hideResponse('otpResponse');
  
  isMobileVerified = false;
}