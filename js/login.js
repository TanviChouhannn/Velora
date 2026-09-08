import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    auth
} from "./firebase.js";
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const togglePassword =
    document.getElementById("togglePassword");
const forgotPassword =
    document.getElementById("forgotPassword");
function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = type;
}
togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "👁";
    }
});
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    showMessage("", "");
    if (!email || !password) {
        showMessage(
            "Please enter email and password.",
            "error"
        );
        return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    try {
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        showMessage(
            "Login successful! ✨",
            "success"
        );
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);
    } catch (error) {
        console.error("Login error:", error);
        let message =
            "Unable to login. Please try again.";
        switch (error.code) {
            case "auth/invalid-credential":
            case "auth/invalid-login-credentials":
                message =
                    "Incorrect email or password.";
                break;
            case "auth/user-not-found":
                message =
                    "No account found with this email.";
                break;
            case "auth/wrong-password":
                message =
                    "Incorrect password.";
                break;
            case "auth/invalid-email":
                message =
                    "Please enter a valid email.";
                break;
            case "auth/too-many-requests":
                message =
                    "Too many attempts. Please try again later.";
                break;
        }
        showMessage(message, "error");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
});
forgotPassword.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
        showMessage(
            "Enter your email first to reset your password.",
            "error"
        );
        emailInput.focus();
        return;
    }
    try {
        await sendPasswordResetEmail(
            auth,
            email
        );
        showMessage(
            "Password reset email sent! Check your inbox 💗",
            "success"
        );
    } catch (error) {
        console.error(
            "Password reset error:",
            error
        );
        if (error.code === "auth/user-not-found") {
            showMessage(
                "No account found with this email.",
                "error"
            );
        } else {
            showMessage(
                "Could not send reset email. Try again.",
                "error"
            );
        }
    }
});