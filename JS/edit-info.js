document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "SignIn.html";
    return;
  }

  const API_BASE_URL = 'http://localhost:5000'; // Add this line to define the base URL
  const editInfoForm = document.getElementById("edit-info-form");
  const cancelBtn = document.getElementById("cancel-btn");
  const saveBtn = editInfoForm.querySelector('button[type="submit"]');
  const originalSaveText = saveBtn.textContent;

  // Load user data from API
  const loadUserData = async () => {
    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Loading...";

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, { // Use the base URL
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();

      // Populate form fields
      document.getElementById("full-name").value = userData.name || "";
      document.getElementById("dob").value = formatDateForInput(userData.dob) || "";
      document.getElementById("gender").value = userData.gender || "";
      document.getElementById("email").value = userData.email || "";
      document.getElementById("mobile").value = userData.phone || "";
      document.getElementById("address").value = userData.address || "";

    } catch (error) {
      console.error("Error loading user data:", error);
      showAlert("Failed to load user data. Please refresh the page.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalSaveText;
    }
  };

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
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

  // Form submission
  editInfoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById("full-name").value;
    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const phone = document.getElementById("mobile").value;
    const address = document.getElementById("address").value;
    const email = document.getElementById("email").value;

    try {
      // Show loading state
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      // Update basic info (name, phone)
      const basicResponse = await fetch(`${API_BASE_URL}/api/user`, { // Use the base URL
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, phone })
      });

      if (!basicResponse.ok) {
        const errorData = await basicResponse.json();
        throw new Error(errorData.message || "Failed to update basic info");
      }

      // Update profile info (dob, gender, address)
      const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile`, { // Use the base URL
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ dob, gender, address })
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || "Failed to update profile info");
      }

      showAlert("Profile updated successfully!");
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
  loadUserData();
});