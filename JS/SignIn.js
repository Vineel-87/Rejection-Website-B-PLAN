document.getElementById("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format from server.");
    }

    const result = await response.json();

    if (response.ok) {
      // Store user email in localStorage before redirecting
      localStorage.setItem('currentUser', email);
      // Clear any temporary profile picture storage
      localStorage.removeItem('tempProfilePic');
      
      alert("✅ " + result.message);
      window.location.href = "dashboard.html";
    } else {
      alert("❌ " + (result.message || "Login failed."));
    }
  } catch (err) {
    alert("⚠️ Login failed: " + err.message);
  }
});