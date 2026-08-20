// authLogic.js
import { auth } from '/frontend/scripts/config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { ENDPOINTS } from './config.js';

let isRegistering = false;

onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    if (isRegistering) return;
    if (user && currentPath.includes('login.html')) {
        window.location.href = './dashboard.html';
    } else if (!user && currentPath.includes('dashboard.html')) {
        window.location.href = './login.html';
    }
});

async function claimUserProjects(user) {
    try {
        const token = await user.getIdToken();
        const response = await fetch(ENDPOINTS.claimProjects, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (data.success) console.log('✅ Projects claimed successfully');
    } catch (error) {
        console.error('Error claiming projects:', error);
    }
}

window.handleLogin = async function (event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            showAuthModal('warning', 'Email Not Verified', 'Please verify your email before logging in. Check your inbox for the verification link.', [
                { text: 'Resend Verification Email', action: () => { resendVerificationEmail(user); } },
                { text: 'Close', action: closeAuthModal, primary: true }
            ]);
            await signOut(auth);
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
            return;
        }

        console.log('Login successful:', user.email);
        await claimUserProjects(user);
        showAuthModal('success', 'Login Successful!', 'Redirecting to your dashboard...');
        setTimeout(() => { window.location.href = './dashboard.html'; }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        }
        showAuthModal('error', 'Login Failed', errorMessage);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
};

window.handleLogout = async function () {
    try {
        await signOut(auth);
        console.log('Logout successful');
        window.location.href = './login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showAuthModal('error', 'Logout Error', 'Error logging out. Please try again.');
    }
};

function showAuthModal(type, title, message, customButtons = null) {
    const modal = document.getElementById('authModal');
    const icon = document.getElementById('authIcon');
    const titleEl = document.getElementById('authTitle');
    const messageEl = document.getElementById('authMessage');
    const buttonContainer = document.getElementById('authModalButtons');

    if (!modal) return;

    if (type === 'success') {
        icon.textContent = '✓';
        icon.style.background = 'var(--secondary)';
    } else if (type === 'error') {
        icon.textContent = '✕';
        icon.style.background = '#ef4444';
    } else if (type === 'warning') {
        icon.textContent = '⚠';
        icon.style.background = '#f59e0b';
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    if (customButtons && buttonContainer) {
        buttonContainer.innerHTML = '';
        customButtons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = btn.primary ? 'btn btn-primary' : 'btn btn-secondary';
            button.onclick = btn.action;
            button.style.margin = '0 0.5rem';
            buttonContainer.appendChild(button);
        });
    } else if (buttonContainer) {
        buttonContainer.innerHTML = '<button class="btn btn-primary" onclick="closeAuthModal()">Close</button>';
    }

    modal.classList.add('show');
}

window.closeAuthModal = function () {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('show');
};

window.handleRegister = async function (event) {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const registerBtn = document.getElementById('registerBtn');

    if (password.length < 6) {
        showAuthModal('error', 'Validation Error', 'Password must be at least 6 characters long.');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';
    isRegistering = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Account created:', user.email);
        await updateProfile(user, { displayName: name });
        const actionCodeSettings = {
            url: window.location.origin + '/login.html',
            handleCodeInApp: false
        };
        await sendEmailVerification(user, actionCodeSettings);
        console.log('Verification email sent to:', email);
        await signOut(auth);
        await new Promise(resolve => setTimeout(resolve, 500));
        isRegistering = false;

        showAuthModal('success', 'Account Created Successfully!', `A verification email has been sent to ${email}. Please check your inbox (and spam folder) and click the verification link before logging in.`, [
            { text: 'Go to Login', action: () => { closeAuthModal(); showLoginForm(); }, primary: true }
        ]);
        form.reset();

    } catch (error) {
        console.error('Registration error:', error);
        isRegistering = false;
        let errorMessage = 'Failed to create account. ';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'An account with this email already exists.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address format.';
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMessage += 'Email/password accounts are not enabled. Please contact support.';
        } else {
            errorMessage += error.message;
        }
        showAuthModal('error', 'Registration Failed', errorMessage);
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
};

async function resendVerificationEmail(user) {
    try {
        await sendEmailVerification(user);
        showAuthModal('success', 'Verification Email Sent', 'Please check your inbox for the verification link.');
    } catch (error) {
        console.error('Error resending verification email:', error);
        showAuthModal('error', 'Error', 'Failed to resend verification email. Please try again later.');
    }
}

window.handlePasswordReset = async function (emailParam = null) {
    let email = emailParam;
    if (!email) {
        showPasswordResetModal();
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthModal('error', 'Invalid Email', 'Please enter a valid email address.');
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showAuthModal('success', 'Password Reset Email Sent', `A password reset link has been sent to ${email}. Please check your inbox and follow the instructions.`);
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send password reset email.';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email address.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address format.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many requests. Please try again later.';
        } else {
            errorMessage = 'An error occurred. Please contact support at (415) 691-7085.';
        }
        showAuthModal('error', 'Password Reset Failed', errorMessage);
    }
};

function showPasswordResetModal() {
    const modal = document.getElementById('authModal');
    const icon = document.getElementById('authIcon');
    const titleEl = document.getElementById('authTitle');
    const messageEl = document.getElementById('authMessage');
    const buttonContainer = document.getElementById('authModalButtons');

    if (!modal) return;

    icon.textContent = '🔒';
    icon.style.background = 'var(--primary)';
    titleEl.textContent = 'Reset Your Password';
    messageEl.innerHTML = `
        <div style="margin: 1.5rem 0;">
            <input type="email" id="resetEmailInput" placeholder="Enter your email address"
                style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; font-family: inherit;"/>
        </div>
    `;

    buttonContainer.innerHTML = '';
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send Reset Link';
    sendButton.className = 'btn btn-primary';
    sendButton.style.margin = '0 0.5rem';
    sendButton.onclick = async () => {
        const emailInput = document.getElementById('resetEmailInput');
        const email = emailInput.value.trim();
        if (!email) {
            emailInput.style.borderColor = '#ef4444';
            return;
        }
        closeAuthModal();
        await handlePasswordReset(email);
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.style.margin = '0 0.5rem';
    cancelButton.onclick = closeAuthModal;

    buttonContainer.appendChild(sendButton);
    buttonContainer.appendChild(cancelButton);
    modal.classList.add('show');

    setTimeout(() => {
        const input = document.getElementById('resetEmailInput');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendButton.click(); });
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) closeAuthModal();
        });
    }
});