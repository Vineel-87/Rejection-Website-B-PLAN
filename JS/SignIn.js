document.getElementById("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitBtn = document.querySelector("#signin-form button[type='submit']");
  const originalBtnText = submitBtn.textContent;

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
    submitBtn.innerHTML = '<span class="inline-block animate-spin">⏳</span> Signing in...';

    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response from server");
    }

    const result = await response.json();

    if (response.ok) {
      // Store user email in localStorage before redirecting
      localStorage.setItem('currentUser', email);
      // Clear any temporary profile picture storage
      localStorage.removeItem('tempProfilePic');
      
      showAlert("✅ Login successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
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
    submitBtn.textContent = originalBtnText;
  }
});

// Custom alert function
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