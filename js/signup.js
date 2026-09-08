import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
    doc,
    setDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    auth,
    db
} from "./firebase.js";
const signupForm =
    document.getElementById("signupForm");
const nameInput =
    document.getElementById("name");
const usernameInput =
    document.getElementById("username");
const emailInput =
    document.getElementById("email");
const passwordInput =
    document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");
const signupBtn =
    document.getElementById("signupBtn");
const signupMessage =
    document.getElementById("signupMessage");
const togglePassword =
    document.getElementById("togglePassword");
const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");
if (togglePassword) {
    togglePassword.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁";
        }
    });
}
if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", () => {
        if (confirmPasswordInput.type === "password") {
            confirmPasswordInput.type = "text";
            toggleConfirmPassword.textContent = "🙈";
        } else {
            confirmPasswordInput.type = "password";
            toggleConfirmPassword.textContent = "👁";
        }
    });
}
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name =
            nameInput.value.trim();
        const username =
            usernameInput.value.trim().toLowerCase();
        const email =
            emailInput.value.trim().toLowerCase();
        const password =
            passwordInput.value;
        const confirmPassword =
            confirmPasswordInput.value;
        if (
            !name ||
            !username ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            showMessage(
                "Please fill in all fields.",
                "error"
            );
            return;
        }
        if (password.length < 6) {
            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );
            return;
        }
        if (password !== confirmPassword) {
            showMessage(
                "Passwords do not match.",
                "error"
            );
            return;
        }
        signupBtn.disabled = true;
        signupBtn.textContent =
            "Creating Account...";
        try {
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
            const user =
                userCredential.user;
            const teamRef =
                doc(collection(db, "teams"));
            const teamId =
                teamRef.id;
            await setDoc(
                doc(db, "users", user.uid),
                {
                    uid: user.uid,
                    name: name,
                    username: username,
                    email: email,
                    bio: "",
                    photoURL: "",
                    followers: [],
                    following: [],
                    teamId: teamId,
                    createdAt:
                        serverTimestamp()
                }
            );
            await setDoc(
                teamRef,
                {
                    name:
                        `${name}'s Team`,
                    ownerId:
                        user.uid,
                    ownerEmail:
                        email,
                    createdAt:
                        serverTimestamp()
                }
            );
            const memberRef =
                doc(
                    collection(
                        db,
                        "teamMembers"
                    )
                );
            await setDoc(
                memberRef,
                {
                    teamId:
                        teamId,
                    userId:
                        user.uid,
                    email:
                        email,
                    name:
                        name,
                    role:
                        "owner",
                    joinedAt:
                        serverTimestamp()
                }
            );
            showMessage(
                "Account created successfully! 💗",
                "success"
            );
            signupBtn.textContent =
                "Account Created ✓";
            setTimeout(() => {
                window.location.href =
                    "index.html";
            }, 1500);
        } catch (error) {
            console.error(
                "Signup error:",
                error
            );
            let message =
                "Something went wrong. Please try again.";
            if (
                error.code ===
                "auth/email-already-in-use"
            ) {
                message =
                    "This email is already registered.";
            }
            else if (
                error.code ===
                "auth/invalid-email"
            ) {
                message =
                    "Please enter a valid email.";
            }
            else if (
                error.code ===
                "auth/weak-password"
            ) {
                message =
                    "Password is too weak.";
            }
            else if (
                error.code ===
                "permission-denied" ||
                error.code ===
                "firestore/permission-denied"
            ) {
                message =
                    "Account created, but team setup was blocked by Firestore permissions.";
            }
            showMessage(
                message,
                "error"
            );
            signupBtn.disabled = false;
            signupBtn.textContent =
                "Create Account";
        }
    });
}
function showMessage(message, type) {
    if (!signupMessage) return;
    signupMessage.textContent =
        message;
    if (type === "success") {
        signupMessage.style.color =
            "#ad1457";
    } else {
        signupMessage.style.color =
            "#d32f2f";
    }
}