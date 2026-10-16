const BASE_URL = (window.location.port === '5500')
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`;

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

// Generic API GET
const apiGet = async (endpoint) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
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
            headers: getHeaders(true), // true for multipart
            body: formData
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        
        return data;
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
        // Redirect based on actual role
        if (user.role === 'admin') window.location.href = '../admin/dashboard.html';
        else if (user.role === 'rescuer') window.location.href = '../rescuer/dashboard.html';
        else window.location.href = '../user/dashboard.html';
        return null;
    }
    
    return user;
};
