// Automatically determine backend API URL
const getBaseUrl = () => {
    // If running on a deployed cloud host (e.g. onrender.com or custom domain)
    if (window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return `${window.location.origin}/api`;
    }
    // If running directly through Node server on port 5000
    if (window.location.port === '5000') {
        return `${window.location.origin}/api`;
    }
    // If running on VS Code Live Server (port 5500, 5501, 5502, 3000, etc.) or file:// protocol
    return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

// Helper to get headers
const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
};

// Safe JSON parser helper to prevent "Unexpected token '<'" errors
const safeParseResponse = async (response) => {
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (parseErr) {
        const cleanText = text.replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
        throw new Error(cleanText || `Server returned error (${response.status})`);
    }
    
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
};

// Generic API GET
const apiGet = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return await safeParseResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Generic API POST (JSON)
const apiPost = async (endpoint, body) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return await safeParseResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Generic API PUT
const apiPut = async (endpoint, body = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body)
        });
        return await safeParseResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Generic API DELETE
const apiDelete = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return await safeParseResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// API POST for Multipart/form-data (File Uploads)
const apiUpload = async (endpoint, formData) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(true),
            body: formData
        });
        return await safeParseResponse(response);
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Logout helper
const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../login.html';
};

// Check Auth helper
const checkAuth = (requiredRole = null) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        window.location.href = '../login.html';
        return null;
    }
    
    const user = JSON.parse(userStr);
    
    if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'admin') window.location.href = '../admin/dashboard.html';
        else if (user.role === 'rescuer') window.location.href = '../rescuer/dashboard.html';
        else window.location.href = '../user/dashboard.html';
        return null;
    }
    
    return user;
};
