document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');
  const currentUser = profileEmail || localStorage.getItem("currentUser") || "Guest";
  const isViewingOtherProfile = profileEmail && profileEmail !== localStorage.getItem("currentUser");

  // DOM Elements
  const fileInput = document.getElementById("edit-upload");
  const bgInput = document.getElementById("bg-upload");
  const profileImage = document.getElementById("profile-preview");
  const header = document.getElementById("profile-header");
  const usernameEl = document.getElementById("profile-username");
  const bioEl = document.getElementById("profile-bio");
  
  // Friend request buttons
  const addFriendBtn = document.getElementById("add-friend-btn");
  const requestSentBtn = document.getElementById("request-sent-btn");
  const acceptRequestBtn = document.getElementById("accept-request-btn");
  const declineRequestBtn = document.getElementById("decline-request-btn");
  const connectedBtn = document.getElementById("connected-btn");

  const displayElements = {
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
  };

  // Initialize
  loadInitialProfile();
  loadProfileInfo();
  setupFriendRequestButton();

  function loadInitialProfile() {
    if (isViewingOtherProfile) {
      fileInput.style.display = 'none';
      bgInput.style.display = 'none';
      usernameEl.style.pointerEvents = 'none';
      bioEl.style.pointerEvents = 'none';
      const editCoverBtn = document.querySelector('label[for="bg-upload"]');
      if (editCoverBtn) editCoverBtn.style.display = 'none';
    } else {
      hideAllFriendButtons();
    }

    const savedProfilePic = localStorage.getItem(`profilePic_${currentUser}`);
    if (savedProfilePic) {
      profileImage.src = savedProfilePic;
    } else if (profileEmail) {
      profileImage.src = `https://www.gravatar.com/avatar/${md5(profileEmail)}?d=identicon&s=200`;
    }

    const savedBgImage = localStorage.getItem(`bgImage_${currentUser}`);
    if (savedBgImage) applyBackgroundImage(savedBgImage);

    const savedUsername = localStorage.getItem(`username_${currentUser}`);
    usernameEl.textContent = savedUsername || (profileEmail ? profileEmail.split('@')[0] : 'Unknown');

    const savedBio = localStorage.getItem(`bio_${currentUser}`);
    if (savedBio) bioEl.textContent = savedBio;
  }

  function setupFriendRequestButton() {
    if (!isViewingOtherProfile) return;

    const loggedInUser = localStorage.getItem("currentUser");
    if (!loggedInUser || loggedInUser === "Guest") {
      hideAllFriendButtons();
      return;
    }

    // Check if already friends
    const friends = JSON.parse(localStorage.getItem(`friends_${loggedInUser}`) || '[]');
    if (friends.includes(profileEmail)) {
      showButton(connectedBtn);
      return;
    }

    // Check requests from both perspectives
    const myRequests = JSON.parse(localStorage.getItem(`friendRequests_${loggedInUser}`) || '[]');
    const theirRequests = JSON.parse(localStorage.getItem(`friendRequests_${profileEmail}`) || '[]');
    
    // Check if I sent a request to them
    const sentRequest = myRequests.find(req => 
      req.from === loggedInUser && req.to === profileEmail && req.status === 'pending'
    );
    
    // Check if they sent a request to me
    const receivedRequest = theirRequests.find(req => 
      req.from === profileEmail && req.to === loggedInUser && req.status === 'pending'
    );

    if (sentRequest) {
      showButton(requestSentBtn);
      requestSentBtn.onclick = () => {
        if (confirm("Are you sure you want to cancel the friend request?")) {
          cancelFriendRequest(sentRequest.id);
        }
      };
    } 
    else if (receivedRequest) {
      showButton(acceptRequestBtn);
      showButton(declineRequestBtn);
      
      acceptRequestBtn.onclick = () => acceptFriendRequest(receivedRequest.id);
      declineRequestBtn.onclick = () => declineFriendRequest(receivedRequest.id);
    } 
    else {
      showButton(addFriendBtn);
      addFriendBtn.onclick = sendFriendRequest;
    }
  }

  function sendFriendRequest() {
    const loggedInUser = localStorage.getItem("currentUser");
    if (!loggedInUser || loggedInUser === "Guest") return;

    const requestId = Date.now().toString();
    const request = {
      id: requestId,
      from: loggedInUser,
      to: profileEmail,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Save to both users' friend requests
    const recipientRequests = JSON.parse(localStorage.getItem(`friendRequests_${profileEmail}`) || '[]');
    recipientRequests.push(request);
    localStorage.setItem(`friendRequests_${profileEmail}`, JSON.stringify(recipientRequests));

    const senderRequests = JSON.parse(localStorage.getItem(`friendRequests_${loggedInUser}`) || '[]');
    senderRequests.push(request);
    localStorage.setItem(`friendRequests_${loggedInUser}`, JSON.stringify(senderRequests));

    // Update UI
    setupFriendRequestButton();
    localStorage.setItem('friendStatusUpdate', Date.now().toString());
    
    alert(`Friend request sent to ${profileEmail.split('@')[0]}`);
  }

  function acceptFriendRequest(requestId) {
    const loggedInUser = localStorage.getItem("currentUser");
    if (!loggedInUser || !profileEmail) return;

    // Update request status to 'accepted'
    updateRequestStatus(loggedInUser, profileEmail, requestId, 'accepted');
    updateRequestStatus(profileEmail, loggedInUser, requestId, 'accepted');

    // Add to each other's friends list
    addToFriendsList(loggedInUser, profileEmail);
    addToFriendsList(profileEmail, loggedInUser);

    // Update UI
    setupFriendRequestButton();
    localStorage.setItem('friendStatusUpdate', Date.now().toString());
    
    alert(`You are now connected with ${profileEmail.split('@')[0]}`);
  }

  function declineFriendRequest(requestId) {
    const loggedInUser = localStorage.getItem("currentUser");
    if (!loggedInUser || !profileEmail) return;

    // Remove the request from both users
    removeFriendRequest(loggedInUser, requestId);
    removeFriendRequest(profileEmail, requestId);

    // Update UI
    setupFriendRequestButton();
    localStorage.setItem('friendStatusUpdate', Date.now().toString());
  }

  function cancelFriendRequest(requestId) {
    const loggedInUser = localStorage.getItem("currentUser");
    if (!loggedInUser || !profileEmail) return;

    // Remove from both users' requests
    removeFriendRequest(profileEmail, requestId);
    removeFriendRequest(loggedInUser, requestId);

    // Update UI
    setupFriendRequestButton();
    localStorage.setItem('friendStatusUpdate', Date.now().toString());
  }

  // Helper functions
  function updateRequestStatus(userEmail, friendEmail, requestId, status) {
    const requests = JSON.parse(localStorage.getItem(`friendRequests_${userEmail}`) || '[]');
    const updatedRequests = requests.map(req => {
      if (req.id === requestId && req.from === friendEmail && req.to === userEmail) {
        return {...req, status};
      }
      return req;
    });
    localStorage.setItem(`friendRequests_${userEmail}`, JSON.stringify(updatedRequests));
  }

  function removeFriendRequest(userEmail, requestId) {
    const requests = JSON.parse(localStorage.getItem(`friendRequests_${userEmail}`) || '[]')
      .filter(req => req.id !== requestId);
    localStorage.setItem(`friendRequests_${userEmail}`, JSON.stringify(requests));
  }

  function addToFriendsList(userEmail, friendEmail) {
    const friends = JSON.parse(localStorage.getItem(`friends_${userEmail}`) || '[]');
    if (!friends.includes(friendEmail)) {
      friends.push(friendEmail);
      localStorage.setItem(`friends_${userEmail}`, JSON.stringify(friends));
    }
  }

  function hideAllFriendButtons() {
    [addFriendBtn, requestSentBtn, acceptRequestBtn, declineRequestBtn, connectedBtn].forEach(btn => {
      if (btn) btn.style.display = 'none';
    });
  }

  function showButton(btn) {
    hideAllFriendButtons();
    if (btn) btn.style.display = 'block';
  }

  function applyBackgroundImage(imageData) {
    header.style.background = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${imageData})`;
    header.style.backgroundSize = 'cover';
    header.style.backgroundPosition = 'center';
    header.style.backgroundRepeat = 'no-repeat';
  }

  function loadProfileInfo() {
    displayElements.fullname.textContent = localStorage.getItem(`fullName_${currentUser}`) || "Not specified";

    const dob = localStorage.getItem(`dob_${currentUser}`);
    displayElements.dob.textContent = dob ? new Date(dob).toLocaleDateString() : "Not specified";

    const gender = localStorage.getItem(`gender_${currentUser}`);
    displayElements.gender.textContent = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).replace(/-/g, " ") : "Not specified";

    displayElements.email.textContent = currentUser.includes("@") ? currentUser : "Not specified";
    displayElements.mobile.textContent = localStorage.getItem(`mobile_${currentUser}`) || "Not specified";
    displayElements.address.textContent = localStorage.getItem(`address_${currentUser}`) || "Not specified";

    updateLinkedAccountDisplay(displayElements.facebook, localStorage.getItem(`facebook_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.instagram, localStorage.getItem(`instagram_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.linkedin, localStorage.getItem(`linkedin_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.telegram, localStorage.getItem(`telegram_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.snapchat, localStorage.getItem(`snapchat_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.github, localStorage.getItem(`github_${currentUser}`));
    updateLinkedAccountDisplay(displayElements.portfolio, localStorage.getItem(`portfolio_${currentUser}`));
  }

  function updateLinkedAccountDisplay(element, url) {
    if (url && url.trim()) {
      element.textContent = url;
      element.href = url.startsWith('http') ? url : 'https://' + url;
      element.target = '_blank';
    } else {
      element.textContent = "Not connected";
      element.href = "#";
      element.removeAttribute('target');
    }
  }

  // Image editor functionality
  let cropper = null;
  let currentEditType = "";
  const editorModal = document.getElementById("editor-modal");
  const editorImage = document.getElementById("editor-image");
  const brightnessSlider = document.getElementById("brightness-range");

  function openEditor(file, type) {
    if (isViewingOtherProfile) return;

    currentEditType = type;
    const reader = new FileReader();
    reader.onload = (e) => {
      editorImage.src = e.target.result;
      editorModal.classList.remove("hidden");
      brightnessSlider.value = 1;
      editorImage.style.filter = "brightness(1)";

      if (cropper) cropper.destroy();

      cropper = new Cropper(editorImage, {
        viewMode: 1,
        aspectRatio: type === "profile" ? 1 : 16 / 9,
        autoCropArea: 1,
        responsive: true
      });
    };
    reader.readAsDataURL(file);
  }

  if (!isViewingOtherProfile) {
    usernameEl.addEventListener("click", () => {
      const newName = prompt("Enter your name:", usernameEl.textContent.trim());
      if (newName?.trim()) {
        usernameEl.textContent = newName.trim();
        localStorage.setItem(`username_${currentUser}`, newName.trim());
      }
    });

    bioEl.addEventListener("click", () => {
      const newBio = prompt("Edit your bio:", bioEl.textContent.trim());
      if (newBio !== null) {
        bioEl.textContent = newBio.trim();
        localStorage.setItem(`bio_${currentUser}`, newBio.trim());
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) openEditor(file, "profile");
      fileInput.value = "";
    });

    bgInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) openEditor(file, "background");
      bgInput.value = "";
    });
  }

  brightnessSlider.addEventListener("input", (e) => {
    editorImage.style.filter = `brightness(${e.target.value})`;
  });

  document.getElementById("zoom-in").onclick = () => cropper?.zoom(0.1);
  document.getElementById("zoom-out").onclick = () => cropper?.zoom(-0.1);
  document.getElementById("cancel-edit").onclick = () => {
    cropper?.destroy();
    cropper = null;
    editorModal.classList.add("hidden");
  };

  document.getElementById("apply-edit").onclick = () => {
    if (!cropper || isViewingOtherProfile) return;

    const canvas = cropper.getCroppedCanvas({
      width: currentEditType === "profile" ? 500 : header.offsetWidth * 2,
      height: currentEditType === "profile" ? 500 : header.offsetHeight * 2,
      fillColor: '#000'
    });

    const brightness = parseFloat(brightnessSlider.value);
    const filteredCanvas = document.createElement("canvas");
    filteredCanvas.width = canvas.width;
    filteredCanvas.height = canvas.height;
    const ctx = filteredCanvas.getContext("2d");
    ctx.filter = `brightness(${brightness})`;
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = filteredCanvas.toDataURL("image/png");

    if (currentEditType === "profile") {
      profileImage.src = dataUrl;
      localStorage.setItem(`profilePic_${currentUser}`, dataUrl);
    } else {
      applyBackgroundImage(dataUrl);
      localStorage.setItem(`bgImage_${currentUser}`, dataUrl);
    }

    cropper?.destroy();
    cropper = null;
    editorModal.classList.add("hidden");
  };

  function md5(string) {
    return string ? CryptoJS.MD5(string.trim().toLowerCase()).toString() : '';
  }

  // Listen for updates from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'friendStatusUpdate') {
      setupFriendRequestButton();
    }
  });
});