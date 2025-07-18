const API_BASE_URL = 'http://localhost:5000';

let birthdayInterval = null;  // Add this line
let allFriendBirthdays = [];
let visibleBirthdays = [];  // Also move this here for better organization


document.addEventListener("DOMContentLoaded", async () => {
  try {
    const token = localStorage.getItem("token");
    const currentUserEmail = localStorage.getItem("currentUserEmail");
    
    if (!token) {
      redirectToLogin();
      return;
    }

    // Load current user profile
    const currentProfile = await loadCurrentUserProfile(token);
    updateProfileElements(currentProfile);
    
    // Load friends list and requests
    await loadFriendsList(token);
    await loadFriendRequests(token);
    
    // Setup tab switching
    setupTabs();
    
    // Setup search functionality
    setupSearch();

    // Setup profile edit functionality
    setupProfileEdit();

  } catch (error) {
    console.error("Initialization error:", error);
    showError("Failed to initialize friends page");
    updateProfileElements(null);
  }
});

async function loadCurrentUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      showError("Session expired. Please sign in again.");
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const profile = await response.json();
    
    // Apply background image if it exists
    if (profile.background_image) {
      const header = document.getElementById('profile-header');
      if (header) {
        header.style.background = `
          linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), 
          url(${API_BASE_URL}${profile.background_image}?t=${Date.now()})
        `;
        header.style.backgroundSize = 'cover';
        header.style.backgroundPosition = 'center';
        header.style.backgroundRepeat = 'no-repeat';
      }
    }
    
    return profile;
  } catch (error) {
    console.error("Error loading current user profile:", error);
    showError("Failed to load profile information");
    return null;
  }
}

async function loadFriendsList(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/friends`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const friends = await response.json();
    displayFriends(friends);
    
    // Update friend count
    const countElement = document.getElementById("friend-count-number");
    if (countElement) {
      countElement.textContent = friends.length;
    }
  } catch (error) {
    console.error("Error loading friends list:", error);
    showError("Failed to load friends list");
  }
}

async function loadFriendRequests(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/friend-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const requests = await response.json();
    displayFriendRequests(requests);
    
    // Update notification dot
    const notificationDot = document.getElementById('requests-notification');
    if (notificationDot) {
      const hasRequests = requests.received && requests.received.length > 0;
      notificationDot.classList.toggle('hidden', !hasRequests);
    }
  } catch (error) {
    console.error("Error loading friend requests:", error);
    showError("Failed to load friend requests");
  }
}


function displayFriends(friends) {
  const friendsList = document.getElementById('friends-list');
  if (!friendsList) return;

  friendsList.innerHTML = '';

  if (friends.length === 0) {
    friendsList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">You don't have any connections yet.</p>
      </div>
    `;
    return;
  }

  friends.forEach(friend => {
    const friendCard = document.createElement('div');
    friendCard.className = 'bg-[#1E1E1E] p-4 rounded-lg border border-[#8E44AD]/30 friend-card transition duration-300';
    friendCard.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getProfileImageUrl(friend)}" 
             class="w-16 h-16 rounded-full object-cover border-2 border-[#8E44AD]"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'Friend')}&background=random'">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-[#E6E6FA] truncate">${friend.name || friend.email.split('@')[0]}</h4>
            <span class="text-xs text-gray-400">Connected ${formatConnectionTime(friend.created_at)}</span>
          </div>
          <p class="text-sm text-[#E6E6FA] mt-2 whitespace-pre-line">${friend.bio || 'No bio yet'}</p>
          <div class="mt-3 flex gap-2">
            <button class="bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg">
              Message
            </button>
            <button class="remove-friend-btn bg-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg border border-[#8E44AD]/30 hover:bg-[#2A0E35]" data-email="${friend.email}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
    friendsList.appendChild(friendCard);
  });

  // Add event listeners to remove friend buttons
  document.querySelectorAll('.remove-friend-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const friendEmail = e.target.getAttribute('data-email');
      const confirmed = confirm(`Remove ${friendEmail} from your friends?`);
      
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_BASE_URL}/api/user/friends/remove`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ friendEmail })
          });
          
          showAlert("Friend removed successfully", "success");
          await loadFriendsList(token);
          await loadFriendRequests(token);
        } catch (error) {
          console.error("Error removing friend:", error);
          showError("Failed to remove friend");
        }
      }
    });
  });
}

function displayFriendRequests(requests) {
  const requestsList = document.getElementById('requests-list');
  if (!requestsList) return;

  requestsList.innerHTML = '';

  // Only show received requests in this view
  const receivedRequests = requests.received || [];

  if (receivedRequests.length === 0) {
    requestsList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">You don't have any friend requests.</p>
      </div>
    `;
    return;
  }

  receivedRequests.forEach(request => {
    const requestCard = document.createElement('div');
    requestCard.className = 'bg-[#1E1E1E] p-4 rounded-lg border border-[#8E44AD]/30 transition duration-300';
    requestCard.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getProfileImageUrl(request)}" 
             class="w-16 h-16 rounded-full object-cover border-2 border-[#8E44AD]"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(request.name || 'User')}&background=random'">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-[#E6E6FA] truncate">${request.name || request.email.split('@')[0]}</h4>
            <span class="text-xs text-gray-400">Requested ${formatConnectionTime(request.created_at)}</span>
          </div>
          <p class="text-sm text-[#E6E6FA] mt-2 whitespace-pre-line">${request.bio || 'No bio yet'}</p>
          <div class="mt-3 flex gap-2">
            <button class="accept-request-btn bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg" data-email="${request.email}">
              Accept
            </button>
            <button class="decline-request-btn bg-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg border border-[#8E44AD]/30 hover:bg-[#2A0E35]" data-email="${request.email}">
              Decline
            </button>
          </div>
        </div>
      </div>
    `;
    requestsList.appendChild(requestCard);
  });


  // Add event listeners to accept/decline buttons
  document.querySelectorAll('.accept-request-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const friendEmail = e.target.getAttribute('data-email');
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/user/friends/accept`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendEmail })
        });
        
        showAlert("Friend request accepted", "success");
        await loadFriendsList(token);
        await loadFriendRequests(token);
      } catch (error) {
        console.error("Error accepting friend request:", error);
        showError("Failed to accept friend request");
      }
    });
  });

  document.querySelectorAll('.decline-request-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const friendEmail = e.target.getAttribute('data-email');
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/user/friends/decline`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendEmail })
        });
        
        showAlert("Friend request declined", "success");
        await loadFriendRequests(token);
      } catch (error) {
        console.error("Error declining friend request:", error);
        showError("Failed to decline friend request");
      }
    });
  });
}

function formatConnectionTime(connectedAt) {
  if (!connectedAt) return "recently";
  
  const now = new Date();
  const connectedTime = new Date(connectedAt);
  const diffInSeconds = Math.floor((now - connectedTime) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
}

function setupTabs() {
  const tabs = {
    connected: document.getElementById('connected-tab'),
    requests: document.getElementById('requests-tab'),
    favorites: document.getElementById('favorites-tab'),
    suggestions: document.getElementById('suggestions-tab'),
    bookmarks: document.getElementById('bookmarks-tab'),
    birthdays: document.getElementById('birthdays-tab') // Add this line
  };

  const contents = {
    connected: document.getElementById('connected-content'),
    requests: document.getElementById('requests-content'),
    favorites: document.getElementById('favorites-content'),
    suggestions: document.getElementById('suggestions-content'),
    bookmarks: document.getElementById('bookmarks-content'),
    birthdays: document.getElementById('birthdays-content') // Add this line
  };

  // Show connected tab by default
  contents.connected.classList.remove('hidden');

  Object.entries(tabs).forEach(([tabName, tabElement]) => {
    if (tabElement) {
      tabElement.addEventListener('click', async () => {
        // Reset all tabs and contents
        Object.values(tabs).forEach(tab => {
          tab.classList.remove('text-[#8E44AD]', 'border-b-2', 'border-[#8E44AD]');
          tab.classList.add('text-[#E6E6FA]', 'hover:text-[#8E44AD]');
        });
        Object.values(contents).forEach(content => {
          content.classList.add('hidden');
        });

        // Activate selected tab
        tabElement.classList.add('text-[#8E44AD]', 'border-b-2', 'border-[#8E44AD]');
        tabElement.classList.remove('text-[#E6E6FA]', 'hover:text-[#8E44AD]');
        contents[tabName].classList.remove('hidden');

        // Load content if needed
        const token = localStorage.getItem("token");
        if (tabName === 'favorites') {
          await loadFavorites(token);
        } else if (tabName === 'suggestions') {
          await loadFriendSuggestions(token);
        } else if (tabName === 'bookmarks') {
          await loadBookmarks(token);
        } else if (tabName === 'birthdays') {  // Add this block
          await loadBirthdays(token);
        }
      });
    }
  });
}

function setupSearch() {
  const searchInput = document.getElementById('friend-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length < 2) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/user/search/${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      // You can implement search results display here if needed
    } catch (error) {
      console.error("Search error:", error);
    }
  });
}

//Add this favourite function and button handling - event listening
async function loadFavorites(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const favorites = await response.json();
    displayFavorites(favorites);
  } catch (error) {
    console.error("Error loading favorites:", error);
    showError("Failed to load favorites");
  }
}

function displayFavorites(favorites) {
  const favoritesList = document.getElementById('favorites-list');
  if (!favoritesList) return;

  favoritesList.innerHTML = '';

  if (favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">You don't have any favorites yet.</p>
      </div>
    `;
    return;
  }

  favorites.forEach(favorite => {
    const favoriteCard = document.createElement('div');
    favoriteCard.className = 'bg-[#1E1E1E] p-4 rounded-lg border border-[#8E44AD]/30 transition duration-300';
    favoriteCard.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getProfileImageUrl(favorite)}" 
             class="w-16 h-16 rounded-full object-cover border-2 border-[#8E44AD]"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(favorite.name || 'User')}&background=random'">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-[#E6E6FA] truncate">${favorite.name || favorite.email.split('@')[0]}</h4>
            <span class="text-xs text-gray-400">Your favorite</span>
          </div>
          <p class="text-sm text-[#E6E6FA] mt-2 whitespace-pre-line">${favorite.bio || 'No bio yet'}</p>
          <div class="mt-3 flex gap-2">
            <button class="bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg">
              Message
            </button>
            <button class="remove-favorite-btn bg-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg border border-[#8E44AD]/30 hover:bg-[#2A0E35]" data-id="${favorite.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
    favoritesList.appendChild(favoriteCard);
  });

  // Add event listeners to remove favorite buttons
  document.querySelectorAll('.remove-favorite-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const favoriteId = e.target.getAttribute('data-id');
      const confirmed = confirm(`Remove this user from your favorites?`);
      
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_BASE_URL}/api/user/favorite`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              targetUserId: favoriteId,
              isFavorite: false
            })
          });
          
          showAlert("Favorite removed successfully", "success");
          await loadFavorites(token);
        } catch (error) {
          console.error("Error removing favorite:", error);
          showError("Failed to remove favorite");
        }
      }
    });
  });
}

// Add this function to load friend suggestions
async function loadFriendSuggestions(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/friend-suggestions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const suggestions = await response.json();
    displaySuggestions(suggestions);
  } catch (error) {
    console.error("Error loading suggestions:", error);
    showError("Failed to load suggestions");
  }
}

// Update the displaySuggestions function to properly handle the suggestions data
function displaySuggestions(suggestions) {
  const suggestionsList = document.getElementById('suggestions-list');
  if (!suggestionsList) return;

  suggestionsList.innerHTML = '';

  if (suggestions.length === 0) {
    suggestionsList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">No suggestions available at this time.</p>
      </div>
    `;
    return;
  }

  suggestions.forEach(suggestion => {
    const suggestionCard = document.createElement('div');
    suggestionCard.className = 'bg-[#1E1E1E] p-4 rounded-lg border border-[#8E44AD]/30 suggestion-card transition duration-300';
    suggestionCard.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getProfileImageUrl(suggestion)}" 
             class="w-16 h-16 rounded-full object-cover border-2 border-[#8E44AD]"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name || 'User')}&background=random'">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-[#E6E6FA] truncate">${suggestion.name || suggestion.email.split('@')[0]}</h4>
            ${suggestion.mutualCount ? `<span class="text-xs text-gray-400">${suggestion.mutualCount} mutual friends</span>` : ''}
          </div>
          <p class="text-sm text-[#E6E6FA] mt-2 whitespace-pre-line">${suggestion.bio || 'No bio yet'}</p>
          <div class="mt-3 flex gap-2">
            <button class="add-friend-btn bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg" data-email="${suggestion.email}">
              Add Friend
            </button>
            <button class="remove-suggestion-btn bg-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg border border-[#8E44AD]/30 hover:bg-[#2A0E35]" data-id="${suggestion.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
    suggestionsList.appendChild(suggestionCard);
  });

  // Add event listeners to add friend buttons
  document.querySelectorAll('.add-friend-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const friendEmail = e.target.getAttribute('data-email');
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/user/friends`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendEmail })
        });
        
        showAlert("Friend request sent", "success");
        // Remove the suggestion card after sending request
        e.target.closest('.suggestion-card').remove();
        
        // Update friend count
        const countElement = document.getElementById("friend-count-number");
        if (countElement) {
          countElement.textContent = parseInt(countElement.textContent) + 1;
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
        showError("Failed to send friend request");
      }
    });
  });

  // Add event listeners to remove suggestion buttons
  document.querySelectorAll('.remove-suggestion-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const suggestionId = e.target.getAttribute('data-id');
      try {
        // Remove the suggestion card immediately for better UX
        e.target.closest('.suggestion-card').remove();
        
        // Optional: Send to server to remember this preference
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/user/suggestions/dismiss`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ suggestionId })
        });
        
        showAlert("Suggestion removed", "success");
      } catch (error) {
        console.error("Error removing suggestion:", error);
        showError("Failed to remove suggestion");
      }
    });
  });
}

// Add these new functions to friends.js
async function loadBookmarks(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/bookmarks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookmarks = await response.json();
    displayBookmarks(bookmarks);
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    showError("Failed to load bookmarks");
  }
}

async function checkFriendStatus(friendEmail) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/user/friend-status/${encodeURIComponent(friendEmail)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.status || "none";
  } catch (error) {
    console.error("Error checking friend status:", error);
    return "none";
  }
}

// Update the displayBookmarks function in friends.js
// Update the displayBookmarks function
function displayBookmarks(bookmarks) {
  const bookmarksList = document.getElementById('bookmarks-list');
  if (!bookmarksList) return;

  bookmarksList.innerHTML = '';

  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">You don't have any bookmarks yet.</p>
      </div>
    `;
    return;
  }

  bookmarks.forEach(bookmark => {
    const bookmarkCard = document.createElement('div');
    bookmarkCard.className = 'bg-[#1E1E1E] p-4 rounded-lg border border-[#8E44AD]/30 transition duration-300';
    
    // Create the card HTML
    bookmarkCard.innerHTML = `
      <div class="flex items-start gap-4">
        <img src="${getProfileImageUrl(bookmark)}" 
             class="w-16 h-16 rounded-full object-cover border-2 border-[#8E44AD]"
             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(bookmark.name || 'User')}&background=random'">
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start">
            <h4 class="font-bold text-[#E6E6FA] truncate">${bookmark.name || bookmark.email.split('@')[0]}</h4>
            <span class="text-xs text-gray-400">Bookmarked</span>
          </div>
          <p class="text-sm text-[#E6E6FA] mt-2 whitespace-pre-line">${bookmark.bio || 'No bio yet'}</p>
          <div class="mt-3 flex gap-2">
            <button class="message-btn bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg hidden" data-email="${bookmark.email}">
              Message
            </button>
            <button class="add-friend-btn bg-gradient-to-r from-[#1E1E1E] to-[#8E44AD] hover:from-[#8E44AD] hover:to-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg hidden" data-email="${bookmark.email}">
              Add Friend
            </button>
            <button class="remove-bookmark-btn bg-[#1E1E1E] text-[#E6E6FA] px-3 py-1 rounded text-sm transition shadow-lg border border-[#8E44AD]/30 hover:bg-[#2A0E35]" data-id="${bookmark.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `;
    bookmarksList.appendChild(bookmarkCard);

    // Check friend status and update buttons
    checkFriendStatus(bookmark.email).then(status => {
      const messageBtn = bookmarkCard.querySelector('.message-btn');
      const addFriendBtn = bookmarkCard.querySelector('.add-friend-btn');
      
      if (status === 'friends') {
        if (messageBtn) messageBtn.classList.remove('hidden');
        if (addFriendBtn) addFriendBtn.classList.add('hidden');
      } else {
        if (messageBtn) messageBtn.classList.add('hidden');
        if (addFriendBtn) addFriendBtn.classList.remove('hidden');
      }
    });
  });

  // Rest of your existing event listeners...
  document.querySelectorAll('.remove-bookmark-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const bookmarkId = e.target.getAttribute('data-id');
      const confirmed = confirm(`Remove this user from your bookmarks?`);
      
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          await fetch(`${API_BASE_URL}/api/user/bookmark`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              targetUserId: bookmarkId,
              isBookmarked: false
            })
          });
          
          showAlert("Bookmark removed successfully", "success");
          await loadBookmarks(token);
        } catch (error) {
          console.error("Error removing bookmark:", error);
          showError("Failed to remove bookmark");
        }
      }
    });
  });

  document.querySelectorAll('.add-friend-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const friendEmail = e.target.getAttribute('data-email');
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/user/friends`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendEmail })
        });
        
        showAlert("Friend request sent", "success");
        e.target.textContent = "Request Sent";
        e.target.classList.remove('bg-gradient-to-r', 'from-[#1E1E1E]', 'to-[#8E44AD]', 'hover:from-[#8E44AD]', 'hover:to-[#1E1E1E]');
        e.target.classList.add('bg-[#1E1E1E]', 'cursor-default');
      } catch (error) {
        console.error("Error sending friend request:", error);
        showError("Failed to send friend request");
      }
    });
  });
}

// Update the loadBirthdays function in friends.js
async function loadBirthdays(token) {
  try {
    // Clear any existing interval
    if (birthdayInterval) {
      clearInterval(birthdayInterval);
      birthdayInterval = null;
    }

    // First get friends list
    const friendsResponse = await fetch(`${API_BASE_URL}/api/user/friends`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!friendsResponse.ok) {
      throw new Error('Failed to fetch friends list');
    }
    
    const friends = await friendsResponse.json();
    
    // Now get profile data for each friend to get their DOB
    allFriendBirthdays = [];
    
    for (const friend of friends) {
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/user/by-email/${encodeURIComponent(friend.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) continue;
        
        const profile = await profileResponse.json();
        
        if (!profile.dob) continue;
        
        const dob = new Date(profile.dob);
        if (isNaN(dob.getTime())) continue;
        
        allFriendBirthdays.push({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar ? 
            `${API_BASE_URL}${profile.avatar}?t=${Date.now()}` : 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email.split('@')[0])}&background=random`,
          dob: profile.dob,
          originalDob: new Date(profile.dob)
        });
      } catch (error) {
        console.error('Error processing friend:', friend, error);
      }
    }
    visibleBirthdays = allFriendBirthdays; 
    // Start the countdown timer
    startBirthdayCountdown();
    
    // Setup month filter - this is the fixed part
    const monthFilter = document.getElementById('birthday-month-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', function() {
        const selectedMonth = this.value === 'all' ? null : parseInt(this.value);
        
        if (selectedMonth === null) {
          visibleBirthdays = allFriendBirthdays;
        } else {
          visibleBirthdays = allFriendBirthdays.filter(bday => {
            const dob = new Date(bday.dob);
            return dob.getMonth() === selectedMonth;
          });
        }
        
        displayBirthdaysWithCountdown(visibleBirthdays);

      });
    }
    
  } catch (error) {
    console.error('Error loading birthdays:', error);
    showError('Failed to load birthdays');
    document.getElementById('birthdays-list').innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">Failed to load birthdays. Please try again later.</p>
      </div>
    `;
  }
}

// New function to start the countdown
function startBirthdayCountdown() {
  // Clear any existing interval
  if (birthdayInterval) {
    clearInterval(birthdayInterval);
    birthdayInterval = null;
  }
  
  // Update immediately
  displayBirthdaysWithCountdown(allFriendBirthdays);
  
  // Then update every second
  birthdayInterval = setInterval(() => {
    displayBirthdaysWithCountdown(visibleBirthdays);
  }, 1000);
}

// Updated display function with live countdown
function displayBirthdaysWithCountdown(birthdays) {
  const container = document.getElementById('birthdays-list');
  
  if (!birthdays || birthdays.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-[#E6E6FA]">No upcoming birthdays found</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  const now = new Date();
  
  birthdays.forEach(bday => {
    const dob = new Date(bday.originalDob);
    const formattedDate = dob.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Calculate next birthday
    let nextBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBirthday < now) {
      nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    
    // Calculate time remaining
    const diff = nextBirthday - now;
    const isToday = nextBirthday.toDateString() === now.toDateString();
    
    // Calculate days, hours, minutes, seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Format countdown text
    let countdownText = '';
    if (isToday) {
      countdownText = 'Today! 🎉';
    } else if (days > 0) {
      countdownText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      countdownText = `${hours}h ${minutes}m ${seconds}s`;
    }
    
    html += `
      <div class="bg-[#1E1E1E] p-4 rounded-lg border ${isToday ? 'border-[#8E44AD]' : 'border-[#8E44AD]/30'} transition duration-300">
        <div class="flex items-start gap-4">
          <img src="${bday.avatar}" 
               class="w-16 h-16 rounded-full object-cover border-2 ${isToday ? 'border-[#8E44AD] animate-pulse' : 'border-[#8E44AD]/30'}"
               onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(bday.name || 'User')}&background=random'">
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <h4 class="font-bold text-[#E6E6FA] truncate">${bday.name || bday.email.split('@')[0]}</h4>
              <span class="text-xs ${isToday ? 'bg-[#8E44AD] text-[#1E1E1E] px-2 py-1 rounded-full font-bold' : 'text-[#8E44AD]'}">
                ${countdownText}
              </span>
            </div>
            <div class="mt-2 text-sm text-[#E6E6FA]">
              <p>Birthday: ${formattedDate}</p>
              ${isToday ? `
                <p class="text-[#8E44AD] font-bold mt-1">It's their birthday today! 🎂</p>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function setupProfileEdit() {
  const fileInput = document.getElementById('edit-upload');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => handleImageUpload(e, "profile"));
  }

  const brightnessSlider = document.getElementById('brightness-range');
  if (brightnessSlider) {
    brightnessSlider.addEventListener('input', handleBrightnessChange);
  }

  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const cancelEditBtn = document.getElementById('cancel-edit');
  const applyEditBtn = document.getElementById('apply-edit');

  if (zoomInBtn) zoomInBtn.onclick = () => cropper?.zoom(0.1);
  if (zoomOutBtn) zoomOutBtn.onclick = () => cropper?.zoom(-0.1);
  if (cancelEditBtn) cancelEditBtn.onclick = closeEditor;
  if (applyEditBtn) applyEditBtn.onclick = applyImageEdit;
}

let cropper = null;
let currentEditType = "";

function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (file && file.type.startsWith("image/")) {
    openEditor(file, type);
  }
  event.target.value = "";
}

function openEditor(file, type) {
  const editorModal = document.getElementById('editor-modal');
  const editorImage = document.getElementById('editor-image');
  if (!editorModal || !editorImage) return;

  currentEditType = type;
  const reader = new FileReader();
  
  reader.onload = (e) => {
    editorImage.src = e.target.result;
    editorModal.classList.remove("hidden");
    
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

function handleBrightnessChange(e) {
  const editorImage = document.getElementById('editor-image');
  if (editorImage) {
    editorImage.style.filter = `brightness(${e.target.value})`;
  }
}

async function applyImageEdit() {
  if (!cropper) return;

  try {
    const canvas = cropper.getCroppedCanvas({
      width: currentEditType === "profile" ? 500 : 1200,
      height: currentEditType === "profile" ? 500 : 500,
      fillColor: '#000'
    });

    const brightness = parseFloat(document.getElementById('brightness-range')?.value || 1);
    const filteredCanvas = applyBrightnessFilter(canvas, brightness);

    const blob = await new Promise(resolve => {
      filteredCanvas.toBlob(resolve, 'image/jpeg', 0.9);
    });

    const formData = new FormData();
    const file = new File([blob], `${currentEditType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    formData.append('avatar', file);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    const profileImage = document.getElementById('profile-preview');
    if (profileImage) {
      profileImage.src = `${API_BASE_URL}${result.avatar}?t=${Date.now()}`;
    }

    showAlert("Profile picture updated successfully", "success");
    closeEditor();
  } catch (error) {
    console.error("Error updating image:", error);
    showError("Failed to update profile picture");
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
  const editorModal = document.getElementById('editor-modal');
  if (editorModal) editorModal.classList.add("hidden");
}

function updateProfileElements(profile) {
  if (!profile) {
    // Show default/placeholder data if profile is null
    const profileImage = document.getElementById('profile-preview');
    if (profileImage) {
      profileImage.src = `https://ui-avatars.com/api/?name=User&background=random`;
    }

    const usernameEl = document.getElementById('profile-username');
    if (usernameEl) {
      usernameEl.textContent = "User";
    }

    const bioEl = document.getElementById('profile-bio');
    if (bioEl) {
      bioEl.textContent = "Profile information unavailable";
    }
    return;
  }

  // Profile image
  const profileImage = document.getElementById('profile-preview');
  if (profileImage) {
    profileImage.src = profile.avatar 
      ? `${API_BASE_URL}${profile.avatar}?t=${Date.now()}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email.split('@')[0])}&background=random`;
    profileImage.onerror = function() {
      this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=random`;
    };
  }

  // Username
  const usernameEl = document.getElementById('profile-username');
  if (usernameEl) {
    usernameEl.textContent = profile.name || profile.email.split('@')[0] || 'User';
  }

  // Bio
  const bioEl = document.getElementById('profile-bio');
  if (bioEl) {
    bioEl.textContent = profile.bio || 'No bio yet';
  }
}

function getProfileImageUrl(profile) {
  return profile.avatar 
    ? `${API_BASE_URL}${profile.avatar}?t=${Date.now()}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email.split('@')[0])}&background=random`;
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "/SignIn.html";
}

function showError(message) {
  const alertDiv = document.createElement("div");
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 bg-red-600 text-white`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => alertDiv.remove(), 500);
  }, 3000);
}

function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
    type === "error" ? "bg-red-600" : "bg-purple-600"
  } text-white`;
  alertDiv.textContent = message;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => alertDiv.remove(), 500);
  }, 3000);
}