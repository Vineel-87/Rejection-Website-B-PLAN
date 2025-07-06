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

    async function loadProfileInfo() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/user/profile`);
        const profile = response; // No need to access .data or other properties
        
        // Update profile image
        if (elements.profileImage) {
          elements.profileImage.src = getProfileImageUrl(profile);
        }
        
        // Update username and bio
        if (elements.usernameEl) {
          elements.usernameEl.textContent = getDisplayName(profile);
        }
        if (elements.bioEl) {
          elements.bioEl.textContent = profile.bio || 'No bio yet';
        }
        
        // Update background if available
        if (profile.background_image && elements.header) {
          applyBackgroundImage(profile.background_image);
        }

        // Update display elements
        updateDisplayElements(profile);
      } catch (error) {
        console.error("Failed to load profile info:", error);
        handleAuthError(error);
      }
    }

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

    async function handleNameEdit() {
      const currentName = elements.usernameEl?.textContent.trim() || '';
      const newName = prompt("Enter your name:", currentName);
      
      if (newName?.trim() && newName !== currentName) {
        try {
          await fetchWithAuth(`${API_BASE_URL}/api/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim() })
          });
          
          if (elements.usernameEl) {
            elements.usernameEl.textContent = newName.trim();
          }
        } catch (error) {
          console.error("Error updating name:", error);
          handleAuthError(error);
        }
      }
    }

    async function handleBioEdit() {
      const currentBio = elements.bioEl?.textContent.trim() || '';
      const newBio = prompt("Edit your bio:", currentBio);
      
      if (newBio !== null && newBio !== currentBio) {
        try {
          await fetchWithAuth(`${API_BASE_URL}/api/user/bio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bio: newBio.trim() })
          });
          
          if (elements.bioEl) {
            elements.bioEl.textContent = newBio.trim();
          }
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
        } else if (currentEditType === "background") {
          applyBackgroundImage(result.background);
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
      alert(message); // Replace with your preferred error display method
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