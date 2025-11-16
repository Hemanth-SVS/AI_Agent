const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- API Calls ---

function checkBackendApi() {
    return fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
    });
}

function sendOtpApi(mobile) {
    return fetch(`${API_BASE_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
    });
}

function verifyOtpApi(mobile, otp) {
    return fetch(`${API_BASE_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
    });
}

function signupApi(payload) {
    return fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

function loginApi(payload) {
    return fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

function fetchAadhaarApi(aadhaar) {
    return fetch(`${API_BASE_URL}/register/fetch-aadhaar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ aadhaar })
    });
}

function submitRegistrationApi(payload) {
    return fetch(`${API_BASE_URL}/register/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
}

function searchVoterApi(params) {
    return fetch(`${API_BASE_URL}/search/voter?${params.toString()}`);
}

function checkStatusApi(appId) {
    return fetch(`${API_BASE_URL}/register/status?applicationId=${encodeURIComponent(appId)}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
}