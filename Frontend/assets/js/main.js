// ===== BACKEND STATUS CHECK =====
async function checkBackend() {
  const statusEl = document.getElementById('backendStatus');
  if (!statusEl) return;
  try {
    const res = await checkBackendApi();
    const data = await res.json();
    if (res.ok && (data.status === 'ok' || data.success)) {
      statusEl.textContent = '✅ Backend: Connected';
      statusEl.style.color = '#10b981';
    } else {
      statusEl.textContent = '⚠️ Backend: Error';
      statusEl.style.color = '#facc15';
    }
  } catch (err) {
    // Don't show error if it's just a timeout or abort
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      statusEl.textContent = '⏳ Backend: Checking...';
      statusEl.style.color = '#6b7280';
    } else {
      statusEl.textContent = '❌ Backend: Not Connected';
      statusEl.style.color = '#ef4444';
    }
  }
}

// ===== AUTH VIEW TOGGLES =====
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('signup');
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthForm('login');
});


// ===== LOGOUT =====
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('authToken');
    updateAuthUI(); // This will show the login screen
    alert('Logged out successfully');
});

// ===== OTP FLOW (SIGNUP) =====

// 1. Send OTP
document.getElementById('otpSendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile = document.getElementById('signupMobile').value;
    showLoading('otpResponse', 'Sending OTP...');

    try {
        const res = await sendOtpApi(mobile);
        const data = await res.json();
        
        if (res.ok) {
            showResponse('otpResponse', data.message + (data.otp ? ` (Demo: ${data.otp})` : ''), 'success');
            document.getElementById('otpVerifyForm').style.display = 'block';
            document.getElementById('signupMobile').readOnly = true;
            document.getElementById('sendOtpBtn').style.display = 'none';
        } else {
            showResponse('otpResponse', data.message || 'Failed to send OTP', 'error');
        }
    } catch (err) {
        showResponse('otpResponse', err.message, 'error');
    }
});

// 2. Verify OTP
document.getElementById('otpVerifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile = document.getElementById('signupMobile').value;
    const otp = document.getElementById('signupOtp').value;
    showLoading('otpResponse', 'Verifying...');

    try {
        const res = await verifyOtpApi(mobile, otp);
        const data = await res.json();

        if (res.ok) {
            isMobileVerified = true;
            showResponse('otpResponse', 'Mobile Verified Successfully!', 'success');
            setTimeout(() => {
                document.getElementById('signup-phase-1').style.display = 'none';
                document.getElementById('signup-phase-2').style.display = 'block';
                document.getElementById('verifiedMobileDisplay').textContent = mobile;
                hideResponse('otpResponse');
            }, 1000);
        } else {
            showResponse('otpResponse', data.message || 'Invalid OTP', 'error');
        }
    } catch (err) {
        showResponse('otpResponse', err.message, 'error');
    }
});

// 3. Complete Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isMobileVerified) {
      alert('Please verify mobile number first');
      return;
  }
  showLoading('signupResponse', 'Creating account...');

  const payload = {
    email: document.getElementById('signupEmail').value,
    mobile: document.getElementById('signupMobile').value,
    password: document.getElementById('signupPassword').value
  };

  try {
    const res = await signupApi(payload);
    const data = await res.json();
    if (res.ok) {
        showResponse('signupResponse', 'Account created! Logging you in...', 'success');
        if(data.token) localStorage.setItem('authToken', data.token);
        
        // This is the key: update UI to show the main app
        setTimeout(() => {
            updateAuthUI();
            resetRegistration(); // Clear signup forms
        }, 1500);

    } else {
        showResponse('signupResponse', data.message || 'Signup failed', 'error');
    }
  } catch (err) {
    showResponse('signupResponse', { error: err.message }, 'error');
  }
});

// ===== LOGIN =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('loginResponse', 'Logging in...');
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value
  };

  try {
    const res = await loginApi(payload);
    const data = await res.json();
    
    if (res.ok && data.success && data.token) {
      showResponse('loginResponse', 'Login successful! Loading app...', 'success');
      localStorage.setItem('authToken', data.token);
      
      // This is the key: update UI to show the main app
      setTimeout(updateAuthUI, 1000);

    } else {
      showResponse('loginResponse', data.message || 'Invalid credentials', 'error');
    }
  } catch (err) {
    showResponse('loginResponse', { error: err.message }, 'error');
  }
});

// ===== AADHAAR FETCH (PROTECTED) =====
document.getElementById('aadhaarForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('aadhaarResponse', 'Fetching Aadhaar details...');
  const aadhaar = document.getElementById('aadhaar').value;
  currentAadhaar = aadhaar;

  try {
    const res = await fetchAadhaarApi(aadhaar);
    const result = await res.json();
    
    if (res.status === 401) {
        showResponse('aadhaarResponse', 'Session expired. Please login again.', 'error');
        localStorage.removeItem('authToken'); // Clear bad token
        updateAuthUI(); // Go back to login screen
        return;
    }
    if (!res.ok || !result.success) {
      showResponse('aadhaarResponse', result.message || 'Error fetching Aadhaar', 'error');
      return;
    }

    document.getElementById('aadhaarStep').style.display = 'none';
    document.getElementById('registrationStep').style.display = 'block';
    const data = result.data;

    if (data) {
      // Auto-fill and lock
      document.getElementById('fullName').value = data.fullName || '';
      document.getElementById('fullName').readOnly = true;
      document.getElementById('dob').value = data.dob ? data.dob.split('T')[0] : '';
      document.getElementById('dob').readOnly = true;
      document.getElementById('gender').value = data.gender || '';
      document.getElementById('gender').readOnly = true;
      document.getElementById('email').value = data.email || '';
      document.getElementById('email').readOnly = true;
      document.getElementById('mobile').value = data.mobile || '';
      document.getElementById('mobile').readOnly = true;
      document.getElementById('address').value = data.address || '';
      document.getElementById('address').readOnly = true;
      showResponse('aadhaarResponse', 'Aadhaar found. Details filled automatically.', 'success');
    } else {
      // Manual entry
      document.getElementById('fullName').readOnly = false;
      document.getElementById('dob').readOnly = false;
      document.getElementById('gender').readOnly = false;
      document.getElementById('email').readOnly = false;
      document.getElementById('mobile').readOnly = false;
      document.getElementById('address').readOnly = false;
      showResponse('aadhaarResponse', result.message, 'loading');
    }
  } catch (err) {
    showResponse('aadhaarResponse', { error: err.message }, 'error');
  }
});

// ===== REGISTRATION SUBMIT (PROTECTED) =====
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('registrationResponse', 'Submitting registration...');
  const genderValue = document.getElementById('gender').value;
  const payload = {
    aadhaar: currentAadhaar,
    fullName: document.getElementById('fullName').value,
    fatherName: document.getElementById('fatherName').value,
    dob: document.getElementById('dob').value,
    gender: genderValue.charAt(0).toUpperCase() + genderValue.slice(1).toLowerCase(),
    email: document.getElementById('email').value,
    mobile: document.getElementById('mobile').value,
    address: document.getElementById('address').value,
    state: document.getElementById('state').value,
    district: document.getElementById('district').value
  };

  try {
    const res = await submitRegistrationApi(payload);
    const result = await res.json();
    
    if (res.ok && result.success) {
      let successMessage = 'Registration Successful! Application ID: ' + result.data.applicationId;
      if (result.data.voterId) {
        successMessage += '\nYour Voter ID is: ' + result.data.voterId;
      }
      showResponse('registrationResponse', successMessage, 'success');
      setTimeout(() => resetRegistration(), 3000);
    } else {
      showResponse('registrationResponse', result.message || 'Submission failed', 'error');
    }
  } catch (err) {
    showResponse('registrationResponse', { error: err.message }, 'error');
  }
});

// ===== SEARCH VOTER (PUBLIC) =====
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('searchResponse', 'Searching voter...');
  const params = new URLSearchParams();
  params.append('voterId', document.getElementById('searchVoterId').value);

  try {
    const res = await searchVoterApi(params);
    const data = await res.json();
    if (res.ok && data.success) {
        showResponse('searchResponse', data.data, 'success'); // Show just the data array
    } else {
        showResponse('searchResponse', data.message || 'No voter found', 'error');
    }
  } catch (err) {
    showResponse('searchResponse', { error: err.message }, 'error');
  }
});

// ===== CHECK STATUS (PROTECTED) =====
document.getElementById('statusForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading('statusResponse', 'Checking status...');
  const appId = document.getElementById('applicationId').value;

  try {
    const res = await checkStatusApi(appId);
    const data = await res.json();
    if (res.ok && data.success) {
        showResponse('statusResponse', data.data, 'success');
    } else {
      if(res.status === 401) {
        localStorage.removeItem('authToken');
        updateAuthUI(); // Go back to login
      }
      showResponse('statusResponse', data.message || 'Application not found', 'error');
    }
  } catch (err) {
    showResponse('statusResponse', { error: err.message }, 'error');
  }
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  checkBackend();
  updateAuthUI(); // This is the most important call - shows login or app on load
  setInterval(checkBackend, 10000);
});