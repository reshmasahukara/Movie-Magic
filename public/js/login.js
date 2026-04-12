import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. LOGIN HANDLER
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Signing in...';
                
                const { user } = await API.fetch('/api/auth?action=login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                API.saveSession(user);
                UI.showMessage('Login successful!', 'success');
                setTimeout(() => window.location.href = '/', 1000);
            } catch (err) {
                UI.showMessage(err.message);
                submitBtn.disabled = false;
                submitBtn.innerText = 'Sign In';
            }
        };
    }

    // 2. GOOGLE LOGIN HANDLER
    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
        googleBtn.onclick = async () => {
            try {
                googleBtn.disabled = true;
                const result = await signInWithPopup(auth, googleProvider);
                const gUser = result.user;

                UI.showMessage('Authenticating with Google...', 'success');

                const { user } = await API.fetch('/api/auth?action=google-login', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: gUser.displayName,
                        email: gUser.email,
                        profile_pic: gUser.photoURL
                    })
                });

                API.saveSession(user);
                UI.showMessage('Welcome back, ' + user.name + '!', 'success');
                setTimeout(() => window.location.href = '/', 1000);

            } catch (error) {
                console.error("Google Auth Error:", error);
                if (error.code !== 'auth/popup-closed-by-user') {
                    UI.showMessage('Google Login Failed: ' + error.message);
                }
                googleBtn.disabled = false;
            }
        };
    }

    // 3. FORGOT PASSWORD FLOW
    const forgotModal = document.getElementById('forgotModal');
    const forgotBtn = document.getElementById('forgotPasswordBtn');
    
    // Inputs & Buttons
    const forgotEmailInput = document.getElementById('forgot-email');
    const forgotOtpInput = document.getElementById('forgot-otp');
    const newPassInput = document.getElementById('forgot-new-pass');
    const confirmPassInput = document.getElementById('forgot-confirm-pass');
    
    const sendOtpBtn = document.getElementById('forgot-send-btn');
    const verifyOtpBtn = document.getElementById('forgot-verify-btn');
    const resetPassBtn = document.getElementById('forgot-reset-btn');

    let resetEmail = '';
    let resetOtp = '';

    if (forgotBtn && forgotModal) {
        forgotBtn.onclick = (e) => {
            e.preventDefault();
            forgotModal.style.display = 'flex';
            setTimeout(() => forgotModal.classList.add('active'), 10);
            showStep(1);
        };
    }

    // Close logic
    window.closeForgotModal = () => {
        forgotModal.classList.remove('active');
        setTimeout(() => forgotModal.style.display = 'none', 300);
    };

    function showStep(step) {
        document.getElementById('forgot-step-1').style.display = step === 1 ? 'block' : 'none';
        document.getElementById('forgot-step-2').style.display = step === 2 ? 'block' : 'none';
        document.getElementById('forgot-step-3').style.display = step === 3 ? 'block' : 'none';
    }

    if (sendOtpBtn) {
        sendOtpBtn.onclick = async () => {
            resetEmail = forgotEmailInput.value;
            if (!resetEmail) return UI.showMessage('Enter email address');
            
            try {
                sendOtpBtn.disabled = true;
                sendOtpBtn.innerText = 'Sending...';
                
                const res = await API.fetch('/api/auth?action=forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email: resetEmail })
                });
                
                UI.showMessage(res.message, 'success');
                showStep(2);
            } catch (e) { 
                UI.showMessage(e.message); 
            } finally {
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerText = 'SEND OTP';
            }
        };
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.onclick = async () => {
            resetOtp = forgotOtpInput.value;
            if (resetOtp.length !== 6) return UI.showMessage('Enter 6-digit OTP');
            
            try {
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.innerText = 'Verifying...';
                
                await API.fetch('/api/auth?action=verify-reset-otp', {
                    method: 'POST',
                    body: JSON.stringify({ email: resetEmail, otp: resetOtp })
                });
                
                UI.showMessage('Verified!', 'success');
                showStep(3);
            } catch (e) { 
                UI.showMessage(e.message); 
            } finally {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerText = 'VERIFY & PROCEED';
            }
        };
    }

    if (resetPassBtn) {
        resetPassBtn.onclick = async () => {
            const pass = newPassInput.value;
            const confirm = confirmPassInput.value;
            
            if (!pass || pass.length < 8) return UI.showMessage('Password must be at least 8 chars');
            if (pass !== confirm) return UI.showMessage('Passwords do not match');
            
            try {
                resetPassBtn.disabled = true;
                resetPassBtn.innerText = 'Updating...';
                
                await API.fetch('/api/auth?action=reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ email: resetEmail, otp: resetOtp, password: pass })
                });
                
                UI.showMessage('Password updated! Redirecting...', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } catch (e) { 
                UI.showMessage(e.message); 
                resetPassBtn.disabled = false;
                resetPassBtn.innerText = 'UPDATE PASSWORD';
            }
        };
    }
});
