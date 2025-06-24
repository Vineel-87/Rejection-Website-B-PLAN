document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-sidebar");
  const sidebar = document.getElementById("sidebar");
  const pageLoader = document.getElementById("page-loader");
  const profilePic = document.getElementById("profile-pic");
  const profileUpload = document.getElementById("profile-upload");
  const userNameElement = document.getElementById("user-name");

  // Sidebar toggle
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    toggleBtn.style.display = "none";
  });

  closeBtn.addEventListener("click", () => {
    sidebar.classList.add("-translate-x-full");
    toggleBtn.style.display = "block";
  });

  // Page loader effect
  const internalLinks = document.querySelectorAll('a[href]:not([href^="mailto:"]):not([target="_blank"])');
  internalLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      const targetUrl = link.getAttribute("href");
      if (targetUrl && targetUrl !== "#" && !targetUrl.startsWith("http")) {
        e.preventDefault();
        if (pageLoader) pageLoader.classList.remove("hidden");
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1200);
      }
    });
  });

  // User session handling
  const currentUser = localStorage.getItem('currentUser');
  
  // Redirect to login if no user is found (shouldn't happen on dashboard)
  if (!currentUser) {
    window.location.href = "signin.html";
    return;
  }

  // Load user-specific profile picture
  const userProfileKey = `profilePic_${currentUser}`;
  const savedProfilePic = localStorage.getItem(userProfileKey);
  if (savedProfilePic) {
    profilePic.src = savedProfilePic;
  } else {
    profilePic.src = "Images/default-avatar.png";
  }

  // Update username display
  if (userNameElement) {
    const displayName = currentUser.includes('@') 
      ? currentUser.split('@')[0] 
      : currentUser;
    userNameElement.textContent = displayName;
  }

  // Profile picture upload
  profileUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const imageData = event.target.result;
        // Save with user-specific key
        localStorage.setItem(`profilePic_${currentUser}`, imageData);
        profilePic.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  });
});