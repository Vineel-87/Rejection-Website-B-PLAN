// linked-accounts.js - Complete Solution
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "SignIn.html";
    return;
  }

  const API_BASE_URL = 'http://localhost:5000';
  const linkedForm = document.getElementById("linked-accounts-form");
  const cancelBtn = document.getElementById("cancel-btn");
  const saveBtn = linkedForm.querySelector('button[type="submit"]');
  const originalSaveText = saveBtn.textContent;

  // Load user's linked accounts from API
  const loadLinkedAccounts = async () => {
    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Loading...";

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await response.json();

      // Populate form fields - only social media fields
      document.getElementById("facebook").value = userData.facebook || "";
      document.getElementById("instagram").value = userData.instagram || "";
      document.getElementById("linkedin").value = userData.linkedin || "";
      document.getElementById("telegram").value = userData.telegram || "";
      document.getElementById("snapchat").value = userData.snapchat || "";
      document.getElementById("github").value = userData.github || "";
      document.getElementById("portfolio").value = userData.portfolio || "";

    } catch (error) {
      console.error("Error loading linked accounts:", error);
      showAlert("Failed to load linked accounts. Please refresh the page.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalSaveText;
    }
  };

  // Show alert message
  const showAlert = (message, type = "success") => {
    const alertDiv = document.createElement("div");
    alertDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg ${
      type === "error" ? "bg-red-600" : "bg-green-600"
    } text-white`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  };

  // Form submission - Only updates social media fields
  linkedForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Create update object with only social media fields
    const updateData = {
      facebook: document.getElementById("facebook").value.trim(),
      instagram: document.getElementById("instagram").value.trim(),
      linkedin: document.getElementById("linkedin").value.trim(),
      telegram: document.getElementById("telegram").value.trim(),
      snapchat: document.getElementById("snapchat").value.trim(),
      github: document.getElementById("github").value.trim(),
      portfolio: document.getElementById("portfolio").value.trim()
    };

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      // Update only social media fields
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update linked accounts");
      }

      showAlert("Linked accounts updated successfully!");
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1500);

    } catch (error) {
      console.error("Update error:", error);
      showAlert(error.message || "Failed to save changes. Please try again.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalSaveText;
    }
  });

  // Cancel button
  cancelBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  // Initialize form
  loadLinkedAccounts();

  // Utility function to validate URLs (optional)
  function validateSocialUrl(url) {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
});