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
  const currentUser = localStorage.getItem("currentUser") || "Guest";

  // Sidebar toggle functionality
  function toggleSidebar() {
    sidebar.classList.toggle("-translate-x-full");
    toggleBtn.style.display = sidebar.classList.contains("-translate-x-full") ? "block" : "none";
  }

  toggleBtn?.addEventListener("click", toggleSidebar);
  closeBtn?.addEventListener("click", toggleSidebar);

  // Page loader for internal navigation
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

  // Load user profile data
  function loadProfileData() {
    try {
      // Load profile picture
      loadProfilePicture();
      
      // Update username display
      if (userNameElement) {
        const displayName = localStorage.getItem(`username_${currentUser}`) || 
                         (currentUser.includes("@") ? currentUser.split("@")[0] : currentUser);
        userNameElement.textContent = displayName;
        
        if (verticalUsername) {
          verticalUsername.textContent = displayName;
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  }

  // Load user-specific profile picture
  function loadProfilePicture() {
    try {
      if (currentUser && currentUser !== "Guest") {
        const userProfileKey = `profilePic_${currentUser}`;
        const savedProfilePic = localStorage.getItem(userProfileKey);
        
        if (savedProfilePic) {
          profilePic.src = savedProfilePic;
          if (verticalProfilePic) {
            verticalProfilePic.src = savedProfilePic;
          }
        } else {
          // Use Gravatar as fallback
          const gravatarUrl = `https://www.gravatar.com/avatar/${CryptoJS.MD5(currentUser.trim().toLowerCase())}?d=identicon&s=200`;
          profilePic.src = gravatarUrl;
          if (verticalProfilePic) {
            verticalProfilePic.src = gravatarUrl;
          }
        }
      } else {
        profilePic.src = "Images/default-avatar.png";
        if (verticalProfilePic) {
          verticalProfilePic.src = "Images/default-avatar.png";
        }
      }
    } catch (error) {
      console.error("Error loading profile picture:", error);
    }
  }

  // Profile picture upload
  profileUpload?.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        try {
          const imageData = event.target.result;

          // Save with user-specific key
          localStorage.setItem(`profilePic_${currentUser}`, imageData);
          profilePic.src = imageData;
          if (verticalProfilePic) {
            verticalProfilePic.src = imageData;
          }

          // Show success feedback
          const originalBorder = profilePic.classList.toString();
          profilePic.classList.add("border-pink-500", "animate-pulse");
          setTimeout(() => {
            profilePic.className = originalBorder;
          }, 1000);
        } catch (error) {
          console.error("Error saving profile picture:", error);
          alert("Failed to upload profile picture. Please try again.");
        }
      };
      reader.onerror = () => {
        console.error("Error reading file");
        alert("Error reading image file. Please try another image.");
      };
      reader.readAsDataURL(file);
    }
  });

  // Friends list functionality
  function setupFriendsList() {
    const friendsItem = document.querySelector('a[href="#"]:has(svg[aria-label="Friends"])');
    if (!friendsItem) return;

    friendsItem.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFriendsDropdown(friendsItem);
    });
  }

  function toggleFriendsDropdown(friendsItem) {
    // Remove existing dropdown if any
    const existingDropdown = document.querySelector('.friends-dropdown');
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'friends-dropdown absolute left-0 mt-2 w-72 bg-[#1a1a1a] border border-[#50c878]/50 rounded-lg shadow-lg z-50 py-2';

    try {
      const friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || '[]');
      
      if (friends.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'px-4 py-2 text-gray-400 text-sm';
        emptyItem.textContent = 'No friends yet';
        dropdown.appendChild(emptyItem);
      } else {
        friends.forEach(friendEmail => {
          const friendItem = createFriendItem(friendEmail);
          dropdown.appendChild(friendItem);
        });
      }

      friendsItem.parentNode.appendChild(dropdown);

      // Close dropdown when clicking outside
      function closeDropdown(e) {
        if (!friendsItem.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener('click', closeDropdown);
        }
      }

      document.addEventListener('click', closeDropdown);
    } catch (error) {
      console.error("Error loading friends list:", error);
    }
  }

  // Theme toggle functionality
  function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const iconDark = document.getElementById('theme-icon-dark');
    const iconLight = document.getElementById('theme-icon-light');
    
    // Check for saved theme preference or use dark mode as default
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.add(currentTheme + '-mode');
    
    // Set initial icon state
    if (currentTheme === 'light') {
      iconDark?.classList.add('hidden');
      iconLight?.classList.remove('hidden');
    } else {
      iconDark?.classList.remove('hidden');
      iconLight?.classList.add('hidden');
    }
    
    themeToggle?.addEventListener('click', () => {
      // Toggle between dark and light
      if (document.documentElement.classList.contains('dark-mode')) {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        iconDark?.classList.add('hidden');
        iconLight?.classList.remove('hidden');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        iconDark?.classList.remove('hidden');
        iconLight?.classList.add('hidden');
      }
    });
    
    // Apply theme to other tabs if needed
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme') {
        document.documentElement.classList.remove('dark-mode', 'light-mode');
        document.documentElement.classList.add(event.newValue + '-mode');
        
        if (event.newValue === 'light') {
          iconDark?.classList.add('hidden');
          iconLight?.classList.remove('hidden');
        } else {
          iconDark?.classList.remove('hidden');
          iconLight?.classList.add('hidden');
        }
      }
    });
  }

  function createFriendItem(friendEmail) {
    const friendItem = document.createElement('a');
    friendItem.href = `profile.html?email=${encodeURIComponent(friendEmail)}`;
    friendItem.className = 'px-4 py-2 hover:bg-[#252525] flex items-center gap-2';
    
    const profilePic = document.createElement('img');
    profilePic.src = localStorage.getItem(`profilePic_${friendEmail}`) || 
                   `https://www.gravatar.com/avatar/${CryptoJS.MD5(friendEmail)}?d=identicon&s=200`;
    profilePic.className = 'w-8 h-8 rounded-full';
    
    const username = document.createElement('div');
    username.textContent = localStorage.getItem(`username_${friendEmail}`) || friendEmail.split('@')[0];
    
    friendItem.appendChild(profilePic);
    friendItem.appendChild(username);

    // Add click handler to show loading before navigation
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

  // Debounced search function
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

  // Close results when clicking outside
  document.addEventListener("click", (e) => {
    if (searchResults && !searchInput?.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.add("hidden");
    }
  });

  // Perform the search
  async function performSearch(term) {
    if (!searchLoading || !searchResultsList || !searchResults) return;
    
    searchLoading.classList.remove("hidden");
    searchResultsList.innerHTML = "";
    searchResults.classList.remove("hidden");
    
    try {
      // First check localStorage for usernames
      const localUsers = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('username_')) {
          const email = key.replace('username_', '');
          // Skip current user
          if (email === currentUser) continue;
          
          const username = localStorage.getItem(key);
          const profilePic = localStorage.getItem(`profilePic_${email}`) || 
                           `https://www.gravatar.com/avatar/${CryptoJS.MD5(email)}?d=identicon&s=200`;
          
          localUsers.push({
            email,
            username,
            profilePic
          });
        }
      }

      // Filter by search term
      const filteredUsers = localUsers.filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase()) || 
        user.email.toLowerCase().includes(term.toLowerCase())
      );

      displaySearchResults(filteredUsers);
    } catch (error) {
      console.error("Search error:", error);
      searchResultsList.innerHTML = `
        <div class="p-4 text-center text-red-400">
          Failed to load search results. Please try again.
        </div>
      `;
    } finally {
      searchLoading.classList.add("hidden");
    }
  }

  // Display search results
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
      userElement.className = "flex items-center gap-3 p-3 hover:bg-[#252525] transition cursor-pointer border-b border-[#50c878]/10 last:border-0";
      
      userElement.innerHTML = `
        <img src="${user.profilePic || 'Images/default-avatar.png'}" 
             class="w-10 h-10 rounded-full border border-[#50c878] object-cover">
        <div class="overflow-hidden">
          <div class="font-semibold text-white truncate">${escapeHtml(user.username || user.email.split('@')[0])}</div>
          <div class="text-sm text-gray-400 truncate">${escapeHtml(user.email)}</div>
        </div>
      `;
      
      // Add click handler to show loading before navigation
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
  function checkBirthdays() {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser || currentUser === "Guest") return;

    // Get friends list
    const friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || "[]");
    const todayBirthdays = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    friends.forEach(friendEmail => {
      const dobString = localStorage.getItem(`dob_${friendEmail}`);
      if (!dobString) return;

      // Parse date (handles dd/mm/yyyy format)
      const parts = dobString.split('/');
      let dob;
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        dob = new Date(year, month, day);
      } else {
        dob = new Date(dobString);
      }

      if (isNaN(dob.getTime())) return;

      // Create this year's birthday date
      const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      thisYearBirthday.setHours(0, 0, 0, 0);

      // Calculate difference in days
      const diffTime = thisYearBirthday - today;
      const daysUntil = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // If birthday is today (daysUntil === 0)
      if (daysUntil === 0) {
        const username = localStorage.getItem(`username_${friendEmail}`) || friendEmail.split('@')[0];
        todayBirthdays.push(username);
      }
    });

    // Update notification badge
    const badge = document.getElementById('birthday-notification-badge');
    const countElement = document.getElementById('birthday-count');
    
    if (todayBirthdays.length > 0) {
      badge.classList.remove('hidden');
      countElement.textContent = todayBirthdays.length;
    } else {
      badge.classList.add('hidden');
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

  // Initialize all functionality
  loadProfileData();
  setupFriendsList();
  checkBirthdays(); // Add this line to check for birthdays on load
  setupThemeToggle();
});