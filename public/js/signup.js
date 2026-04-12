import { auth, googleProvider } from './firebase-config.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    let signupData = null;
    let timerInterval = null;

    // Initialize OTP Input Logic
    UI.setupOTPInput('otp-wrapper-signup');

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.onsubmit = async (e) => {
            e.preventDefault();
            
            signupData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                city: document.getElementById('city').value,
                contactno: document.getElementById('contactno').value
            };

            try {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerText = 'Sending OTP...';

                UI.showMessage('Contacting secure email server...');
                
                const res = await API.fetch('/api/auth?action=sendotp', {
                    method: 'POST',
                    body: JSON.stringify({ email: signupData.email })
                });

                if (res.success) {
                    document.getElementById('display-email').textContent = signupData.email;
                    const modal = document.getElementById('otpModal');
                    modal.style.display = 'flex';
                    setTimeout(() => modal.classList.add('active'), 10);
                    startTimer();
                    UI.showMessage('Success! Code sent to your email.', 'success');
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Register';
                }
            } catch (err) {
                UI.showMessage(err.message || 'Failed to send OTP. Try again.');
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerText = 'Register';
            }
        };
    }

    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    if (verifyOtpBtn) {
        verifyOtpBtn.onclick = async () => {
            const otp = UI.getOTPValue('otp-wrapper-signup');
            if (otp.length !== 6) return UI.showMessage('Enter valid 6-digit code');

            try {
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.innerText = 'Verifying & Registering...';

                const res = await API.fetch('/api/auth?action=register', {
                    method: 'POST',
                    body: JSON.stringify({ ...signupData, otp })
                });

                if (res.success) {
                    UI.showMessage('Registration Successful!', 'success');
                    setTimeout(() => window.location.href = '/login.html', 2000);
                }
            } catch (err) {
                UI.showMessage(err.message || 'Verification failed. Please try again.');
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerText = 'VERIFY OTP';
            }
        };
    }

    const resendBtn = document.getElementById('resend-btn');
    if (resendBtn) {
        resendBtn.onclick = async () => {
            try {
                await API.fetch('/api/auth?action=sendotp', {
                    method: 'POST',
                    body: JSON.stringify({ email: signupData.email })
                });
                UI.showMessage('Resent! Check your email.', 'success');
                startTimer();
            } catch (e) {
                UI.showMessage(e.message);
            }
        };
    }

    // Google Sign-In Handler
    const googleBtn = document.getElementById('google-signup-btn');
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
                UI.showMessage('Welcome, ' + user.name + '!', 'success');
                setTimeout(() => window.location.href = '/', 1000);

            } catch (error) {
                console.error("Google Auth Error:", error);
                if (error.code !== 'auth/popup-closed-by-user') {
                    UI.showMessage('Google Signup Failed: ' + error.message);
                }
                googleBtn.disabled = false;
            }
        };
    }

    function startTimer() {
        let timeLeft = 30;
        document.getElementById('resend-btn').style.display = 'none';
        document.getElementById('resend-timer-text').style.display = 'block';
        document.getElementById('timer').textContent = timeLeft;
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById('timer').textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                document.getElementById('resend-btn').style.display = 'block';
                document.getElementById('resend-timer-text').style.display = 'none';
            }
        }, 1000);
    }
});
