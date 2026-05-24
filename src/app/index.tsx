<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Login | Cure And Care CRM</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

    <style>
        :root { --primary: #0f172a; --secondary: #10b981; --bg-color: #f8fafc; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: var(--bg-color); display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        
        .login-wrapper { background: #fff; width: 100%; max-width: 420px; padding: 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05); }
        .logo-area { text-align: center; margin-bottom: 30px; }
        .logo-area img { max-width: 180px; margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 12px; }
        .logo-area h2 { font-size: 24px; font-weight: 800; color: var(--primary); }
        
        .input-group { margin-bottom: 20px; position: relative; }
        .input-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #475569; }
        .input-group input { width: 100%; padding: 14px 15px 14px 40px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; background: #f8fafc; }
        .input-group i { position: absolute; left: 15px; top: 38px; color: #94a3b8; font-size: 16px; }
        
        .btn-login { width: 100%; padding: 15px; border-radius: 12px; background: var(--primary); color: #fff; border: none; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .btn-login:hover { background: #1e293b; transform: translateY(-2px); }
        #error-msg { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; margin-top: 15px; display: none; border: 1px solid #fca5a5; }
        
        .forgot-link { display: block; text-align: center; margin-top: 20px; color: #00a2ed; font-size: 13px; font-weight: 700; text-decoration: none; transition: 0.2s; }
        .forgot-link:hover { color: #008ecc; text-decoration: underline; }
    </style>
</head>
<body>

    <div class="login-wrapper">
        <div class="logo-area">
            <img src="logon.png" alt="Logo" onerror="this.src='https://cdn-icons-png.flaticon.com/512/2966/2966327.png'">
            <h2>Staff CRM Portal</h2>
        </div>

        <div id="loginBox">
            <div class="input-group">
                <label>Username</label>
                <input type="text" id="username" placeholder="e.g. admin or staff username">
                <i class="fas fa-user"></i>
            </div>
            <div class="input-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="••••••••">
                <i class="fas fa-lock"></i>
            </div>

            <button type="button" class="btn-login" id="loginBtn" onclick="processLogin()">Authenticate <i class="fas fa-arrow-right ms-2"></i></button>
            <div id="error-msg"><i class="fas fa-exclamation-circle"></i> Invalid Username or Password.</div>
            
            <a href="crm-forgot-password.html" class="forgot-link">Forgot Password?</a>
        </div>
    </div>

    <script>
        // 🚀 FIREBASE SETUP
        const firebaseConfig = {
            apiKey: "AIzaSyC-Ito4dNRQ45IjIOWL63Hqk9sKzbvKe-M",
            authDomain: "cureandcare-crm.firebaseapp.com",
            databaseURL: "https://cureandcare-crm-default-rtdb.firebaseio.com",
            projectId: "cureandcare-crm"
        };
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        const auth = firebase.auth(); // INITIALIZED FIREBASE AUTH

        // 🚀 SECURE LOGIN LOGIC
        function processLogin() {
            let usernameInput = document.getElementById('username').value.toLowerCase().trim().replace(/\s/g, '');
            const passwordInput = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-msg');
            const btn = document.getElementById('loginBtn');

            if(!usernameInput || !passwordInput) {
                showError(btn, errorMsg, 'Please enter both fields.');
                return;
            }

            // Firebase Auth requires email. If user types "admin", we format it to "admin@cureandcare.com" internally.
            let emailInput = usernameInput;
            if (!emailInput.includes('@')) {
                emailInput = usernameInput + "@cureandcare.com";
            }

            errorMsg.style.display = "none";
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            // 🚀 FIREBASE SECURE AUTHENTICATION
            auth.signInWithEmailAndPassword(emailInput, passwordInput)
                .then((userCredential) => {
                    // Auth successful! Now fetch their role from Realtime DB
                    database.ref('users/' + usernameInput).get().then((snapshot) => {
                        if(snapshot.exists()) {
                            const userData = snapshot.val();
                            loginSuccess(usernameInput, userData.role, userData.name);
                        } else {
                            // Fallback if user exists in Auth but not in Realtime DB
                            loginSuccess(usernameInput, 'Staff Member', usernameInput);
                        }
                    }).catch(() => {
                        loginSuccess(usernameInput, 'Staff Member', usernameInput);
                    });
                })
                .catch((error) => {
                    showError(btn, errorMsg, 'Invalid Username or Password.');
                });
        }

        function showError(btn, errorMsg, msgText) {
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + msgText;
            errorMsg.style.display = "block";
            btn.innerHTML = 'Authenticate <i class="fas fa-arrow-right ms-2"></i>';
        }

        function loginSuccess(username, role, name) {
            const activeUser = { username: username, role: role, name: name };
            localStorage.setItem('currentUser', JSON.stringify(activeUser));
            
            setTimeout(() => {
                if(role === 'admin' || role === 'manager' || role === 'System Admin') {
                    window.location.href = 'crm-home.html'; 
                } else {
                    window.location.href = 'crm.html';
                }
            }, 800);
        }

        // AUTO-LOGIN CHECK
        window.onload = () => {
            const activeUser = JSON.parse(localStorage.getItem('currentUser'));
            if(activeUser) {
                if(activeUser.role === 'admin' || activeUser.role === 'manager' || activeUser.role === 'System Admin') {
                    window.location.href = 'crm-home.html';
                } else {
                    window.location.href = 'crm.html';
                }
            }
        };

        // Press Enter to login
        document.addEventListener("keyup", function(event) {
            if (event.key === "Enter") processLogin();
        });
    </script>
</body>
</html>