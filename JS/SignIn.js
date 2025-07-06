document.getElementById("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitBtn = document.querySelector("#signin-form button[type='submit']");
  const originalBtnText = submitBtn.innerHTML;

  if (!email || !password) {
    showAlert("Please enter both email and password.", "error");
    return;
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAlert("Please enter a valid email address.", "error");
    return;
  }

  try {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin">↻</span> Signing in...';

    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      // Store token and user data
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      showAlert("✔️ Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "job-links.html";
      }, 1500);
    } else {
      showAlert(`❌ ${result.message || "Login failed. Please check your credentials"}`, "error");
    }
  } catch (err) {
    console.error("Login error:", err);
    showAlert(`⚠️ Login failed: ${err.message || "Network error"}`, "error");
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});

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