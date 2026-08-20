// config.js - API Configuration with auto-detection and Firebase initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Detect environment
const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

const ENV = isLocalhost ? 'development' : 'production';

// API Configuration
const CONFIG = {
    development: {
        API_BASE_URL: 'http://localhost:8080',
        GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbzJOYtbHJRuIgQTT7BVhmzGvRaJ1TMBd-VDoe_DUk_Rbnyr9EBiB5W9Xutir8r8LcgUTg/exec',
        SITE_URL: 'http://localhost:5173'
    },
    production: {
        API_BASE_URL: 'https://api.alimi.ai',
        GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbzJOYtbHJRuIgQTT7BVhmzGvRaJ1TMBd-VDoe_DUk_Rbnyr9EBiB5W9Xutir8r8LcgUTg/exec',
        SITE_URL: 'https://alimi.ai'
    }
};

export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
export const GOOGLE_SHEETS_URL = CONFIG[ENV].GOOGLE_SHEETS_URL;
export const SITE_URL = CONFIG[ENV].SITE_URL;

export const ENDPOINTS = {
    // Payment & Projects
    createPaymentSession: `${API_BASE_URL}/create-payment-session`,
    stripeWebhook: `${API_BASE_URL}/webhook`,
    userProjects: (userId) => `${API_BASE_URL}/user-projects/${userId}`,
    claimProjects: `${API_BASE_URL}/claim-projects`,
    requestModification: `${API_BASE_URL}/request-modification`,
    createModificationCheckout: `${API_BASE_URL}/create-modification-checkout`,

    // Domain (existing - Namecheap)
    checkDomain: `${API_BASE_URL}/check-domain`,

    // Domain Connection (NEW - Cloudflare)
    connectOwnDomain: `${API_BASE_URL}/api/connect-own-domain`,
    verifyDomainConnection: `${API_BASE_URL}/api/verify-domain-connection`,
    domainConnectionStatus: (projectId) => `${API_BASE_URL}/api/domain-connection-status/${projectId}`,

    // Other
    deploy: `${API_BASE_URL}/deploy`,
    contactFormSubmission: GOOGLE_SHEETS_URL
};

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC0qVQm59S1_OFJcYLr2ILyGB9m-SoxHro",
    authDomain: "holysmokas-4ef36.firebaseapp.com",
    projectId: "holysmokas-4ef36",
    storageBucket: "holysmokas-4ef36.firebasestorage.app",
    messagingSenderId: "236391401471",
    appId: "1:236391401471:web:16780dc40257205caf09ca",
    measurementId: "G-LRKVZGKNLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Console logs
console.log(`🔧 Config Mode: ${ENV === 'development' ? '🛠️ LOCAL DEV' : '🚀 PRODUCTION'}`);
console.log(`📡 API URL: ${API_BASE_URL}`);
console.log('📋 Request Modification Endpoint:', ENDPOINTS.requestModification);
console.log('🔥 Firebase initialized');