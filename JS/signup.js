document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin">↻</span> Sending OTP...';

    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        email, 
        password,
        name: email.split('@')[0],
        phone
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    document.getElementById("otp-section").classList.remove("hidden");
    showAlert("OTP sent to your email!", "success");
  } catch (err) {
    showAlert(`Error: ${err.message}`, "error");
    console.error("Registration error:", err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

async function verifyOTP() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const resultText = document.getElementById("otp-result");
  const verifyBtn = document.querySelector("#otp-section button");
  const originalBtnText = verifyBtn.innerHTML;

  try {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="inline-block animate-spin">↻</span> Verifying...';

    const response = await fetch("http://localhost:5000/api/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "OTP verification failed");
    }

    const result = await response.json();
    resultText.textContent = "Account verified successfully!";
    resultText.className = "text-green-400 text-center";
    
    // Enable sign in button
    document.getElementById("signin-button").disabled = false;
    document.getElementById("signin-button").onclick = () => {
      window.location.href = "signin.html";
    };
  } catch (err) {
    resultText.textContent = err.message;
    resultText.className = "text-red-400 text-center";
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = originalBtnText;
  }
}

function showAlert(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
    type === "error" ? "bg-red-600" : 
    type === "success" ? "bg-green-600" : "bg-blue-600"
  } text-white`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => alertDiv.remove(), 500);
  }, 3000);
}