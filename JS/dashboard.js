document.addEventListener("DOMContentLoaded", () => {
  // Sidebar toggle elements
  const toggleBtn = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("close-sidebar");
  const sidebar = document.getElementById("sidebar");
  
  // Page loader
  const pageLoader = document.getElementById("page-loader");
  
  // Profile elements
  const profilePic = document.getElementById("profile-pic");
  const profileUpload = document.getElementById("profile-upload");
  const userNameElement = document.getElementById("user-name");
  const verticalProfilePic = document.getElementById("vertical-profile-pic");
  const verticalUsername = document.getElementById("vertical-username");
  
  // Search elements
  const searchInput = document.getElementById("search-friends");
  const searchResults = document.getElementById("search-results");
  const searchLoading = document.getElementById("search-loading");
  const searchResultsList = document.getElementById("search-results-list");

  // Current user session
  const token = localStorage.getItem("token");
  let currentUser = null;

  // Initialize the dashboard
  initDashboard();

  async function initDashboard() {
    // Sidebar toggle functionality
    function toggleSidebar() {
      sidebar.classList.toggle("-translate-x-full");
      toggleBtn.style.display = sidebar.classList.contains("-translate-x-full") ? "block" : "none";
    }

    toggleBtn?.addEventListener("click", toggleSidebar);
    closeBtn?.addEventListener("click", toggleSidebar);

    // Load user data if logged in, otherwise show guest view
    if (token) {
      await loadProfileData();
      setupProfileUpload();
      fetchAndUpdateUserCount(); // Add this line
      // Update count every 30 seconds
      setInterval(fetchAndUpdateUserCount, 30000);
    } else {
      showGuestView();
    }

    setupPageLoaders();

    // Check if we're coming from profile edit
    checkProfileUpdate();
  }


  // Check if we're coming from profile edit and refresh data
  function checkProfileUpdate() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('profileUpdated') === 'true') {
      // Remove the parameter from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh profile data
      loadProfileData();
    }
  }

  // Show guest view when not logged in
  function showGuestView() {
    const guestName = "Guest";
    const guestAvatar = "Images/default-avatar.png";
    
    if (userNameElement) {
      userNameElement.textContent = guestName;
    }
    
    if (verticalUsername) {
      verticalUsername.textContent = guestName;
    }
    
    if (profilePic) {
      profilePic.src = guestAvatar;
    }
    
    if (verticalProfilePic) {
      verticalProfilePic.src = guestAvatar;
    }
    
    // Hide upload button for guests
    if (profileUpload) {
      profileUpload.style.display = "none";
    }
  }

  // Fetch current user data from API
  async function fetchCurrentUser() {
    try {
      const response = await fetch("http://localhost:5000/api/user/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        currentUser = user;
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }

  // Setup page loaders for navigation
  function setupPageLoaders() {
    const internalLinks = document.querySelectorAll(
      'a[href]:not([href^="mailto:"]):not([target="_blank"])'
    );

    internalLinks.forEach((link) => {
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
  }

  // Load user profile data
  async function loadProfileData() {
    try {
      const user = await fetchCurrentUser();
      if (!user) return;

      // Load profile picture
      await loadProfilePicture(user);
      
      // Update username display
      updateUsernameDisplay(user);
      
      // Load friends and check birthdays if logged in
      setupFriendsList();
      checkBirthdays();
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }

  // Update username display
  function updateUsernameDisplay(user) {
    if (userNameElement) {
      const displayName = user.name || (user.email.includes("@") ? user.email.split("@")[0] : user.email);
      userNameElement.textContent = displayName;
      
      if (verticalUsername) {
        verticalUsername.textContent = displayName;
      }
    }
  }

  // Load user-specific profile picture
  async function loadProfilePicture(user) {
    try {
      let avatarUrl;
      
      if (user.avatar) {
        avatarUrl = user.avatar.startsWith('http') ? 
          user.avatar : 
          `http://localhost:5000${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
      } else {
        avatarUrl = `https://www.gravatar.com/avatar/${CryptoJS.MD5(user.email.trim().toLowerCase())}?d=identicon&s=200`;
      }
      
      if (profilePic) {
        profilePic.src = avatarUrl;
      }
      
      if (verticalProfilePic) {
        verticalProfilePic.src = avatarUrl;
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
      const fallbackAvatar = "http://localhost:5000/Images/default-avatar.png";
      if (profilePic) {
        profilePic.src = fallbackAvatar;
      }
      if (verticalProfilePic) {
        verticalProfilePic.src = fallbackAvatar;
      }
    }
  }

  // Setup profile picture upload functionality
  function setupProfileUpload() {
    if (!profileUpload) return;
    
    profileUpload.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async function (event) {
          try {
            const formData = new FormData();
            formData.append("avatar", file);

            const response = await fetch("http://localhost:5000/api/user/avatar", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`
              },
              body: formData
            });

            if (response.ok) {
              const result = await response.json();
              
              if (profilePic) {
                profilePic.src = result.avatar;
              }
              if (verticalProfilePic) {
                verticalProfilePic.src = result.avatar;
              }

              if (profilePic) {
                const originalBorder = profilePic.classList.toString();
                profilePic.classList.add("border-[#FF073A]", "animate-pulse");
                setTimeout(() => {
                  profilePic.className = originalBorder;
                }, 1000);
              }
              
              showAlert("Profile picture updated successfully", "success");
            } else {
              throw new Error("Failed to upload avatar");
            }
          } catch (error) {
            console.error("Error saving profile picture:", error);
            showAlert("Failed to upload profile picture. Please try again.", "error");
          }
        };
        reader.onerror = () => {
          console.error("Error reading file");
          showAlert("Error reading image file. Please try another image.", "error");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Friends list functionality
  function setupFriendsList() {
    const friendsItem = document.querySelector('a[href="#"]:has(svg[aria-label="Friends"])');
    if (!friendsItem) return;

    friendsItem.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFriendsDropdown(friendsItem);
    });
  }

  async function toggleFriendsDropdown(friendsItem) {
    const existingDropdown = document.querySelector('.friends-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'friends-dropdown absolute left-0 mt-2 w-72 bg-[#0a0a0a] border border-[#FF073A]/50 rounded-lg shadow-lg z-50 py-2';

    try {
      const response = await fetch("http://localhost:5000/api/user/friends", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch friends");
      
      const friends = await response.json();

      if (friends.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'px-4 py-2 text-gray-400 text-sm';
        emptyItem.textContent = 'No friends yet';
        dropdown.appendChild(emptyItem);
      } else {
        friends.forEach(friend => {
          const friendItem = createFriendItem(friend);
          dropdown.appendChild(friendItem);
        });
      }

      friendsItem.parentNode.appendChild(dropdown);

      function closeDropdown(e) {
        if (!friendsItem.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      }

      document.addEventListener('click', closeDropdown);
    } catch (error) {
      console.error("Error loading friends list:", error);
      const errorItem = document.createElement('div');
      errorItem.className = 'px-4 py-2 text-[#FF073A] text-sm';
      errorItem.textContent = 'Error loading friends';
      dropdown.appendChild(errorItem);
      friendsItem.parentNode.appendChild(dropdown);
    }
  }

  function createFriendItem(friend) {
    const friendItem = document.createElement('a');
    friendItem.href = `profile.html?email=${encodeURIComponent(friend.email)}`;
    friendItem.className = 'px-4 py-2 hover:bg-[#0a0a0a] flex items-center gap-2';
    
    const profilePic = document.createElement('img');
    profilePic.src = friend.avatar || `https://www.gravatar.com/avatar/${CryptoJS.MD5(friend.email)}?d=identicon&s=200`;
    profilePic.className = 'w-8 h-8 rounded-full';
    
    const username = document.createElement('div');
    username.textContent = friend.name || friend.email.split('@')[0];
    
    friendItem.appendChild(profilePic);
    friendItem.appendChild(username);

    friendItem.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("page-loader").classList.remove("hidden");
      setTimeout(() => {
        window.location.href = friendItem.href;
      }, 500);
    });

    return friendItem;
  }


  // Search functionality
  let searchTimeout;
  let currentSearchTerm = '';

  searchInput?.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (currentSearchTerm.length < 2) {
      searchResults?.classList.add("hidden");
      return;
    }
    
    searchTimeout = setTimeout(() => {
      performSearch(currentSearchTerm);
    }, 300);
  });

  document.addEventListener("click", (e) => {
    if (searchResults && !searchInput?.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  async function performSearch(term) {
    if (!searchLoading || !searchResultsList || !searchResults) return;
    
    searchLoading.classList.remove("hidden");
    searchResultsList.innerHTML = "";
    searchResults.classList.remove("hidden");
    
    try {
      const response = await fetch(`http://localhost:5000/api/user/search/${encodeURIComponent(term)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Search failed");
      
      const users = await response.json();
      
      if (!users || users.length === 0) {
        searchResultsList.innerHTML = `
          <div class="p-4 text-center text-gray-400">
            No users found matching "${escapeHtml(term)}"
          </div>
        `;
      } else {
        displaySearchResults(users);
      }
    } catch (error) {
      console.error("Search error:", error);
      searchResultsList.innerHTML = `
        <div class="p-4 text-center text-[#FF073A]">
          Failed to load search results. Please try again.
        </div>
      `;
    } finally {
      searchLoading.classList.add("hidden");
    }
  }

  function displaySearchResults(users) {
    if (!searchResultsList) return;
  
    searchResultsList.innerHTML = '';
  
    if (!users || users.length === 0) {
      searchResultsList.innerHTML = `
        <div class="p-4 text-center text-gray-400">
          No users found for "${escapeHtml(currentSearchTerm)}"
        </div>
      `;
      return;
    }
  
    users.forEach(user => {
      const userElement = document.createElement("a");
      userElement.href = `profile.html?email=${encodeURIComponent(user.email)}`;
      userElement.className = "flex items-center gap-3 p-3 hover:bg-[#0a0a0a] transition cursor-pointer border-b border-[#FF073A]/10 last:border-0";
      
      let avatarUrl;
      if (user.avatar) {
        avatarUrl = user.avatar.startsWith('http') ? 
          user.avatar : 
          `http://localhost:5000${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
      } else {
        const emailHash = CryptoJS.MD5(user.email.trim().toLowerCase()).toString();
        avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=200`;
      }

      userElement.innerHTML = `
        <img src="${avatarUrl}" 
            class="w-10 h-10 rounded-full border border-[#FF073A] object-cover">
        <div class="font-semibold text-white truncate">
          ${escapeHtml(user.name || user.email.split('@')[0])}
        </div>
      `;
      
      userElement.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("page-loader").classList.remove("hidden");
        setTimeout(() => {
          window.location.href = userElement.href;
        }, 500);
      });
      
      searchResultsList.appendChild(userElement);
    });
  }

  // Check for today's birthdays
  async function checkBirthdays() {
    try {
      const response = await fetch("http://localhost:5000/api/user/friends", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) return;
      
      const friends = await response.json();
      const todayBirthdays = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      friends.forEach(friend => {
        if (!friend.dob) return;
        
        const dob = new Date(friend.dob);
        if (isNaN(dob.getTime())) return;

        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        thisYearBirthday.setHours(0, 0, 0, 0);

        const diffTime = thisYearBirthday - today;
        const daysUntil = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
          todayBirthdays.push(friend.name || friend.email.split('@')[0]);
        }
      });

      const badge = document.getElementById('birthday-notification-badge');
      const countElement = document.getElementById('birthday-count');
      
      if (todayBirthdays.length > 0) {
        badge?.classList.remove('hidden');
        if (countElement) countElement.textContent = todayBirthdays.length;
      } else {
        badge?.classList.add('hidden');
      }
    } catch (error) {
      console.error("Error checking birthdays:", error);
    }
  }

  async function fetchAndUpdateUserCount() {
  try {
    const response = await fetch("http://localhost:5000/api/user-count", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const userCountElement = document.getElementById('user-count');
      if (userCountElement) {
        userCountElement.textContent = `${data.count} Users Joined`;
      }
    }
  } catch (error) {
    console.error("Error fetching user count:", error);
  }
}

  // Simple HTML escape function for security
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});