// Robust profile.js with complete error handling and API integration
const API_BASE_URL = 'http://localhost:5000';

document.addEventListener("DOMContentLoaded", async () => {
  // Authentication and Initialization
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const profileEmail = urlParams.get('email');
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    const isViewingOtherProfile = profileEmail && profileEmail !== currentUserEmail;
    const token = localStorage.getItem("token");

    // Validate authentication
    if (!token && !isViewingOtherProfile) {
      console.error("No authentication token found");
      redirectToLogin();
      return;
    }

    // DOM Elements
    const elements = {
      fileInput: document.getElementById("edit-upload"),
      bgInput: document.getElementById("bg-upload"),
      profileImage: document.getElementById("profile-preview"),
      header: document.getElementById("profile-header"),
      usernameEl: document.getElementById("profile-username"),
      bioEl: document.getElementById("profile-bio"),
      editorModal: document.getElementById("editor-modal"),
      editorImage: document.getElementById("editor-image"),
      brightnessSlider: document.getElementById("brightness-range"),
      zoomInBtn: document.getElementById("zoom-in"),
      zoomOutBtn: document.getElementById("zoom-out"),
      cancelEditBtn: document.getElementById("cancel-edit"),
      applyEditBtn: document.getElementById("apply-edit"),
      displayElements: {
        fullname: document.getElementById("display-fullname"),
        dob: document.getElementById("display-dob"),
        gender: document.getElementById("display-gender"),
        email: document.getElementById("display-email"),
        mobile: document.getElementById("display-mobile"),
        address: document.getElementById("display-address"),
        facebook: document.getElementById("display-facebook"),
        instagram: document.getElementById("display-instagram"),
        linkedin: document.getElementById("display-linkedin"),
        telegram: document.getElementById("display-telegram"),
        snapchat: document.getElementById("display-snapchat"),
        github: document.getElementById("display-github"),
        portfolio: document.getElementById("display-portfolio")
      },
      friendButtons: {
        addFriend: document.getElementById("add-friend-btn"),
        requestSent: document.getElementById("request-sent-btn"),
        acceptRequest: document.getElementById("accept-request-btn"),
        declineRequest: document.getElementById("decline-request-btn"),
        connected: document.getElementById("connected-btn"),
        removeConnection: document.getElementById("remove-connection-btn")
      }
    };

    // Mobile sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
      });
    }

    // State management
    let cropper = null;
    let currentEditType = "";

    // Initialize
    await initializeProfile();
     

    // Core Functions
    async function initializeProfile() {
      try {
        if (isViewingOtherProfile) {
          disableEditingFeatures();
          await loadOtherProfileInfo(profileEmail);
          // Add the friend status check right here
          await checkFriendStatus(profileEmail);
        } else {
          hideAllFriendButtons();
          await loadProfileInfo();
          setupEditListeners();
        }
      } catch (error) {
        console.error("Initialization error:", error);
        showError("Failed to initialize profile");
      }
    }

    function disableEditingFeatures() {
      if (elements.fileInput) elements.fileInput.style.display = 'none';
      if (elements.bgInput) elements.bgInput.style.display = 'none';
      if (elements.usernameEl) elements.usernameEl.style.pointerEvents = 'none';
      if (elements.bioEl) elements.bioEl.style.pointerEvents = 'none';
      
      const editCoverBtn = document.querySelector('label[for="bg-upload"]');
      if (editCoverBtn) editCoverBtn.style.display = 'none';
    }

    // Helper function to fetch and update friend count
    async function loadOtherProfileInfo(email) {
    try {
      const profile = await fetchWithAuth(`${API_BASE_URL}/api/user/by-email/${encodeURIComponent(email)}`);
      
      // Update profile image
      if (elements.profileImage) {
        elements.profileImage.src = getProfileImageUrl(profile);
      }
      
      // Update username and bio
      if (elements.usernameEl) {
        elements.usernameEl.textContent = getDisplayName(profile);
      }
      if (elements.bioEl) {
        elements.bioEl.textContent = profile.bio || '';
      }
      
      // Update background if available
      if (profile.background_image && elements.header) {
        applyBackgroundImage(profile.background_image);
      }

      // Update display elements (only public info)
      updateDisplayElements(profile, true);
      
      // Update friend count - use fetchAndUpdateFriendCount instead
      await fetchAndUpdateFriendCount(profile.id);
    } catch (error) {
      console.error("Failed to load other profile info:", error);
      showError("Failed to load profile information");
    }
  }
        

    function updateDisplayElements(profile, isPublicView = false) {
      const { displayElements } = elements;
      
      if (displayElements.fullname) {
        displayElements.fullname.textContent = profile.name || "Not specified";
      }
      
      if (!isPublicView) {
        if (displayElements.email) {
          displayElements.email.textContent = profile.email || "Not specified";
        }
        if (displayElements.mobile) {
          displayElements.mobile.textContent = profile.phone || "Not specified";
        }
      }
      
      if (displayElements.dob) {
        displayElements.dob.textContent = profile.dob ? formatDate(profile.dob) : "Not specified";
      }
      
      if (displayElements.gender) {
        displayElements.gender.textContent = profile.gender ? 
          capitalizeFirstLetter(profile.gender.replace(/-/g, " ")) : "Not specified";
      }
      
      if (!isPublicView && displayElements.address) {
        displayElements.address.textContent = profile.address || "Not specified";
      }

      // Update bio display if available
      if (elements.bioEl && !isPublicView) {
        elements.bioEl.textContent = profile.bio || 'No bio yet';
      }
      
      updateLinkedAccountDisplay(displayElements.facebook, profile.facebook);
      updateLinkedAccountDisplay(displayElements.instagram, profile.instagram);
      updateLinkedAccountDisplay(displayElements.linkedin, profile.linkedin);
      updateLinkedAccountDisplay(displayElements.telegram, profile.telegram);
      updateLinkedAccountDisplay(displayElements.snapchat, profile.snapchat);
      updateLinkedAccountDisplay(displayElements.github, profile.github);
      updateLinkedAccountDisplay(displayElements.portfolio, profile.portfolio);
    }

    function updateLinkedAccountDisplay(element, url) {
      if (!element) return;
      
      if (url && url.trim()) {
        element.textContent = url;
        element.href = url.startsWith('http') ? url : 'https://' + url;
        element.target = '_blank';
        element.classList.remove('text-gray-400');
        element.classList.add('text-blue-400', 'hover:underline');
      } else {
        element.textContent = "Not connected";
        element.href = "#";
        element.removeAttribute('target');
        element.classList.add('text-gray-400');
        element.classList.remove('text-blue-400', 'hover:underline');
      }
    }

    function setupEditListeners() {
      // Username edit
      if (elements.usernameEl) {
        elements.usernameEl.addEventListener("click", () => handleNameEdit());
      }

      // Bio edit
      if (elements.bioEl) {
        elements.bioEl.addEventListener("click", () => handleBioEdit());
      }

      // Profile picture upload
      if (elements.fileInput) {
        elements.fileInput.addEventListener("change", (e) => handleImageUpload(e, "profile"));
      }

      // Background image upload
      if (elements.bgInput) {
        elements.bgInput.addEventListener("change", (e) => handleImageUpload(e, "background"));
      }

      // Image editor controls
      if (elements.brightnessSlider) {
        elements.brightnessSlider.addEventListener("input", handleBrightnessChange);
      }

      if (elements.zoomInBtn) elements.zoomInBtn.onclick = () => cropper?.zoom(0.1);
      if (elements.zoomOutBtn) elements.zoomOutBtn.onclick = () => cropper?.zoom(-0.1);
      
      if (elements.cancelEditBtn) {
        elements.cancelEditBtn.onclick = closeEditor;
      }

      if (elements.applyEditBtn) {
        elements.applyEditBtn.onclick = applyImageEdit;
      }
    }

    // In the handleNameEdit function
    async function handleNameEdit() {
      const currentName = elements.usernameEl?.textContent.trim() || '';
      const newName = prompt("Enter your name (max 30 characters):", currentName);
      
      if (newName?.trim() && newName !== currentName) {
        if (newName.length > 30) {
          showAlert("Name must be 30 characters or less", "error");
          return;
        }
        
        try {
          await fetchWithAuth(`${API_BASE_URL}/api/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
          });
          
          if (elements.usernameEl) {
            elements.usernameEl.textContent = newName.trim();
          }
          
          if (elements.displayElements.fullname) {
            elements.displayElements.fullname.textContent = newName.trim();
          }
          
          showAlert("Name updated successfully", "success");
        } catch (error) {
          console.error("Error updating name:", error);
          handleAuthError(error);
        }
      }
    }

    async function handleBioEdit() {
      const currentBio = elements.bioEl?.textContent.trim() || '';
      const newBio = prompt("Edit your bio (max 120 characters):", currentBio);
      
      if (newBio !== null && newBio !== currentBio) {
        if (newBio.length > 60) {
          showAlert("Bio must be 120 characters or less", "error");
          return;
        }
        
        try {
          await fetchWithAuth(`${API_BASE_URL}/api/user/bio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio: newBio.trim() })
          });
          
          if (elements.bioEl) {
            elements.bioEl.textContent = newBio.trim();
          }
          
          showAlert("Bio updated successfully", "success");
        } catch (error) {
          console.error("Error updating bio:", error);
          handleAuthError(error);
        }
      }
    }

    function handleImageUpload(event, type) {
      const file = event.target.files[0];
      if (file && file.type.startsWith("image/")) {
        openEditor(file, type);
      }
      event.target.value = "";
    }

    function openEditor(file, type) {
      if (!elements.editorModal || !elements.editorImage) return;

      currentEditType = type;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        elements.editorImage.src = e.target.result;
        elements.editorModal.classList.remove("hidden");
        
        if (elements.brightnessSlider) {
          elements.brightnessSlider.value = 1;
        }
        
        elements.editorImage.style.filter = "brightness(1)";

        if (cropper) cropper.destroy();

        cropper = new Cropper(elements.editorImage, {
          viewMode: 1,
          aspectRatio: type === "profile" ? 1 : 16 / 9,
          autoCropArea: 1,
          responsive: true
        });
      };
      
      reader.readAsDataURL(file);
    }

    function handleBrightnessChange(e) {
      if (elements.editorImage) {
        elements.editorImage.style.filter = `brightness(${e.target.value})`;
      }
    }

    async function applyImageEdit() {
      if (!cropper || !elements.header) return;

      try {
        const canvas = cropper.getCroppedCanvas({
          width: currentEditType === "profile" ? 500 : elements.header.offsetWidth * 2,
          height: currentEditType === "profile" ? 500 : elements.header.offsetHeight * 2,
          fillColor: '#000'
        });

        const brightness = parseFloat(elements.brightnessSlider?.value || 1);
        const filteredCanvas = applyBrightnessFilter(canvas, brightness);

        const blob = await new Promise(resolve => {
          filteredCanvas.toBlob(resolve, 'image/jpeg', 0.9);
        });

        const formData = new FormData();
        const file = new File([blob], `${currentEditType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const fieldName = currentEditType === "profile" ? "avatar" : "background";
        formData.append(fieldName, file);

        const endpoint = currentEditType === "profile" 
          ? `${API_BASE_URL}/api/user/avatar` 
          : `${API_BASE_URL}/api/user/background`;
        
        const result = await fetchWithAuth(endpoint, {
          method: 'POST',
          body: formData
        });

        if (currentEditType === "profile" && elements.profileImage) {
          elements.profileImage.src = result.avatar;
          // Show success message
          showAlert("Profile picture updated successfully", "success");
        } else if (currentEditType === "background") {
          applyBackgroundImage(result.background);
          // Show success message
          showAlert("Background image updated successfully", "success");
        }

        closeEditor();
      } catch (error) {
        console.error("Error updating image:", error);
        handleAuthError(error);
      }
    }

    function applyBrightnessFilter(canvas, brightness) {
      const filteredCanvas = document.createElement("canvas");
      filteredCanvas.width = canvas.width;
      filteredCanvas.height = canvas.height;
      const ctx = filteredCanvas.getContext("2d");
      ctx.filter = `brightness(${brightness})`;
      ctx.drawImage(canvas, 0, 0);
      return filteredCanvas;
    }

    function closeEditor() {
      cropper?.destroy();
      cropper = null;
      if (elements.editorModal) elements.editorModal.classList.add("hidden");
    }

    function applyBackgroundImage(imagePath) {
      if (!elements.header) return;
      elements.header.style.background = `
        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), 
        url(${API_BASE_URL}${imagePath}?t=${Date.now()})
      `;
      elements.header.style.backgroundSize = 'cover';
      elements.header.style.backgroundPosition = 'center';
      elements.header.style.backgroundRepeat = 'no-repeat';
    }

    function hideAllFriendButtons() {
      Object.values(elements.friendButtons).forEach(btn => {
        if (btn) btn.style.display = 'none';
      });
    }

    // Add these new functions to profile.js
    async function checkFriendStatus(targetEmail) {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/user/friend-status/${encodeURIComponent(targetEmail)}`);
        updateFriendButton(response.status);
      } catch (error) {
        console.error("Error checking friend status:", error);
        // Default to "Add Friend" if there's an error
        updateFriendButton('none');
      }
    }

    function updateFriendButton(status) {
      hideAllFriendButtons();
      
      switch(status) {
        case 'none':
          if (elements.friendButtons.addFriend) elements.friendButtons.addFriend.style.display = 'block';
          break;
        case 'pending_sent':
          if (elements.friendButtons.requestSent) elements.friendButtons.requestSent.style.display = 'block';
          break;
        case 'pending_received':
          if (elements.friendButtons.acceptRequest) elements.friendButtons.acceptRequest.style.display = 'block';
          if (elements.friendButtons.declineRequest) elements.friendButtons.declineRequest.style.display = 'block';
          break;
        case 'friends':
          if (elements.friendButtons.connected) elements.friendButtons.connected.style.display = 'block';
          if (elements.friendButtons.removeConnection) elements.friendButtons.removeConnection.style.display = 'block';
          break;
        default:
          if (elements.friendButtons.addFriend) elements.friendButtons.addFriend.style.display = 'block';
      }
    }

    // Add friend event listener
    if (elements.friendButtons.addFriend) {
      elements.friendButtons.addFriend.addEventListener('click', async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const profileEmail = urlParams.get('email');
          
          await fetchWithAuth(`${API_BASE_URL}/api/user/friends`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendEmail: profileEmail })
          });
          
          updateFriendButton('pending_sent');
          showAlert("Friend request sent", "success");
        } catch (error) {
          console.error("Error sending friend request:", error);
          showError(error.message || "Failed to send friend request");
        }
      });
    }

    // Accept friend request
    // Update the friend-related event listeners to always refresh the count
    if (elements.friendButtons.acceptRequest) {
      elements.friendButtons.acceptRequest.addEventListener('click', async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const profileEmail = urlParams.get('email');
          
          await fetchWithAuth(`${API_BASE_URL}/api/user/friends/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendEmail: profileEmail })
          });
          
          updateFriendButton('friends');
          // Always refresh the count from server after operation
          const profile = await fetchWithAuth(`${API_BASE_URL}/api/user/by-email/${encodeURIComponent(profileEmail)}`);
          await fetchAndUpdateFriendCount(profile.id);
          showAlert("Friend request accepted", "success");
        } catch (error) {
          console.error("Error accepting friend request:", error);
          showError(error.message || "Failed to accept friend request");
        }
      });
    }


    // Decline friend request
    if (elements.friendButtons.declineRequest) {
      elements.friendButtons.declineRequest.addEventListener('click', async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const profileEmail = urlParams.get('email');
          
          await fetchWithAuth(`${API_BASE_URL}/api/user/friends/decline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendEmail: profileEmail })
          });
          
          updateFriendButton('none');
          showAlert("Friend request declined", "success");
        } catch (error) {
          console.error("Error declining friend request:", error);
          showError(error.message || "Failed to decline friend request");
        }
      });
    }

    // Remove friend connection
    if (elements.friendButtons.removeConnection) {
      elements.friendButtons.removeConnection.addEventListener('click', async () => {
        const confirmed = confirm("Are you sure you want to remove this connection?");
        if (confirmed) {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const profileEmail = urlParams.get('email');
            
            await fetchWithAuth(`${API_BASE_URL}/api/user/friends/remove`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ friendEmail: profileEmail })
            });
            
            updateFriendButton('none');
            // Always refresh the count from server after operation
            const profile = await fetchWithAuth(`${API_BASE_URL}/api/user/by-email/${encodeURIComponent(profileEmail)}`);
            await fetchAndUpdateFriendCount(profile.id);
            showAlert("Friend removed", "success");
          } catch (error) {
            console.error("Error removing friend:", error);
            showError(error.message || "Failed to remove friend");
          }
        }
      });
    }

    async function fetchAndUpdateFriendCount(userId) {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/user/friends/count?userId=${userId}`);
        const count = response.count || 0;
        updateFriendCount(count);
        return count;
      } catch (error) {
        console.error("Error fetching friend count:", error);
        updateFriendCount(0);
        return 0;
      }
    }

    function updateFriendCount(count) {
      const friendCountElement = document.getElementById('friend-count-number');
      if (friendCountElement) {
        friendCountElement.textContent = count;
      }
    }

    // Utility Functions
    async function fetchWithAuth(url, options = {}) {
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      };

      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response.json();
    }

    function handleAuthError(error) {
      if (error.status === 401 || error.status === 403 || 
          error.message.includes("token") || error.message.includes("authentication")) {
        redirectToLogin();
      } else {
        showError(error.message || "An error occurred");
      }
    }

    function redirectToLogin() {
      localStorage.removeItem("token");
      window.location.href = "/SignIn.html";
    }

    function showError(message) {
      showAlert(message, "error");
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

    function getProfileImageUrl(profile) {
      return profile.avatar 
        ? `${API_BASE_URL}${profile.avatar}?t=${Date.now()}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName(profile))}&background=random`;
    }

    function getDisplayName(profile) {
      return profile.name || (profile.email ? profile.email.split('@')[0] : 'User');
    }

    function formatDate(dateString) {
      if (!dateString) return "";
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

  } catch (error) {
    console.error("Global error handler:", error);
    redirectToLogin();
  }
});