let generatedOTP = "";

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!email || !password || !phone) {
    alert("Please fill all fields correctly.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      generatedOTP = result.otp || "";
      document.getElementById("otp-section").classList.remove("hidden");
      alert("📧 OTP has been sent to your email.");
    } else {
      alert("❌ " + (result.message || "Failed to send OTP."));
    }
  } catch (err) {
    alert("⚠️ Server error: " + err.message);
  }
});

async function verifyOTP() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();
  const password = document.getElementById("password").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const resultText = document.getElementById("otp-result");

  if (!otp || otp.length !== 6) {
    resultText.textContent = "❌ Enter a valid 6-digit OTP.";
    resultText.className = "text-red-400 mt-2";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const result = await response.json();

    if (response.ok) {
      resultText.textContent = "✅ OTP Verified!";
      resultText.className = "text-green-400 mt-2";

      // ✅ Save user to backend
      const saveResponse = await fetch("http://localhost:5000/save-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, phone }),
      });

      const saveResult = await saveResponse.json();

      if (saveResponse.ok) {
        // Optional UI feedback
        resultText.textContent = "🎉 Account created successfully! Redirecting to Sign In...";
        document.getElementById("signin-button").disabled = true;

        // Delay + redirect
        setTimeout(() => {
          window.location.href = "signin.html";
        }, 2000);
      } else {
        alert("⚠️ " + (saveResult.message || "Could not save user."));
      }
    } else {
      resultText.textContent = "❌ " + (result.message || "OTP Incorrect");
      resultText.className = "text-red-400 mt-2";
    }
  } catch (err) {
    alert("⚠️ Verification failed: " + err.message);
  }
}
