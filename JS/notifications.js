document.addEventListener("DOMContentLoaded", () => {
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    alert("You must log in first.");
    window.location.href = "SignIn.html";
  }

  const notificationsList = document.getElementById("notifications-list");
  const loadingIndicator = document.getElementById("loading-indicator");
  const markAllReadBtn = document.getElementById("mark-all-read");

  async function loadNotifications(filter = 'all') {
    loadingIndicator.classList.remove("hidden");
    notificationsList.innerHTML = "";

    try {
      const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser}`) || '[]');
      let filtered = notifications;

      if (filter === 'unread') {
        filtered = notifications.filter(n => !n.read);
      }

      if (filtered.length === 0) {
        showEmptyState();
        return;
      }

      filtered.forEach(notification => {
        const el = createNotificationElement(notification);
        notificationsList.appendChild(el);
      });
    } catch (error) {
      showErrorState(error);
    } finally {
      loadingIndicator.classList.add("hidden");
    }
  }

  function showEmptyState() {
    notificationsList.innerHTML = `
      <div class="p-8 text-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-[#50c878]/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p>No notifications yet</p>
      </div>
    `;
  }

  function showErrorState(error) {
    console.error("Error loading notifications:", error);
    notificationsList.innerHTML = `
      <div class="p-4 text-center text-red-400">
        Failed to load notifications. Please try again.
      </div>
    `;
  }

  function createNotificationElement(notification) {
    const element = document.createElement("div");
    element.className = `p-4 hover:bg-[#252525] transition cursor-pointer ${notification.read ? '' : 'bg-[#1a2a1a]'}`;

    let actionButtons = '';
    if (notification.type === 'friend_request') {
      actionButtons = `
        <div class="flex gap-2 mt-2">
          <button class="accept-friend-request text-xs bg-[#50c878] hover:bg-[#3daa5f] text-white px-3 py-1 rounded">
            Accept
          </button>
          <button class="decline-friend-request text-xs bg-[#ff4d4d] hover:bg-[#e63c3c] text-white px-3 py-1 rounded">
            Decline
          </button>
        </div>
      `;
    }

    element.innerHTML = `
      <div class="flex gap-3">
        <div class="flex-shrink-0">
          <img src="${notification.senderAvatar || 'Images/default-avatar.png'}" 
              class="w-10 h-10 rounded-full border border-[#50c878]">
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">${escapeHtml(notification.senderName)}</p>
          <p class="text-sm text-gray-300">${escapeHtml(notification.message)}</p>
          <p class="text-xs text-gray-500 mt-1">${formatDate(notification.timestamp)}</p>
          ${actionButtons}
        </div>
        ${!notification.read ? `
          <div class="flex-shrink-0">
            <span class="inline-block w-2 h-2 rounded-full bg-[#50c878]"></span>
          </div>
        ` : ''}
      </div>
    `;

    element.addEventListener("click", (e) => {
      if (e.target.closest('.accept-friend-request') || e.target.closest('.decline-friend-request')) {
        return;
      }
      markNotificationAsRead(notification, element);
      if (notification.link) window.location.href = notification.link;
    });

    if (notification.type === 'friend_request') {
      setupFriendRequestHandlers(element, notification);
    }

    return element;
  }

  function setupFriendRequestHandlers(element, notification) {
    const acceptBtn = element.querySelector('.accept-friend-request');
    const declineBtn = element.querySelector('.decline-friend-request');

    acceptBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleFriendRequestResponse(notification, true);
    });

    declineBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      handleFriendRequestResponse(notification, false);
    });
  }

  function handleFriendRequestResponse(notification, accepted) {
    const senderEmail = notification.link.split('email=')[1];
    const receiverEmail = localStorage.getItem("currentUser");

    // Update friend request status
    const friendRequests = JSON.parse(localStorage.getItem(`friendRequests_${receiverEmail}`) || []);
    const updatedRequests = friendRequests.map(req => {
      if (req.from === senderEmail && req.to === receiverEmail) {
        return { ...req, status: accepted ? 'accepted' : 'declined' };
      }
      return req;
    });
    localStorage.setItem(`friendRequests_${receiverEmail}`, JSON.stringify(updatedRequests));

    // Also update sender's friend requests
    const senderFriendRequests = JSON.parse(localStorage.getItem(`friendRequests_${senderEmail}`) || []);
    const updatedSenderRequests = senderFriendRequests.map(req => {
      if (req.from === senderEmail && req.to === receiverEmail) {
        return { ...req, status: accepted ? 'accepted' : 'declined' };
      }
      return req;
    });
    localStorage.setItem(`friendRequests_${senderEmail}`, JSON.stringify(updatedSenderRequests));

    if (accepted) {
      // Add to friends list for both users
      addToFriendsList(receiverEmail, senderEmail);
      addToFriendsList(senderEmail, receiverEmail);

      // Create acceptance notification for sender
      createResponseNotification(senderEmail, receiverEmail, true);
    } else {
      // Create decline notification for sender
      createResponseNotification(senderEmail, receiverEmail, false);
    }

    // Remove the original friend request notification
    removeNotification(notification.id);
    
    // Reload notifications
    loadNotifications();
    updateBadgeCount();

    // Trigger updates in other tabs
    localStorage.setItem('badgeUpdate', Date.now().toString());
    localStorage.setItem('friendStatusUpdate', Date.now().toString());
  }

  function addToFriendsList(userEmail, friendEmail) {
    const friends = JSON.parse(localStorage.getItem(`friends_${userEmail}`) || '[]');
    if (!friends.includes(friendEmail)) {
      friends.push(friendEmail);
      localStorage.setItem(`friends_${userEmail}`, JSON.stringify(friends));
    }
  }

  function createResponseNotification(recipientEmail, senderEmail, accepted) {
    const notification = {
      id: Date.now().toString(),
      type: accepted ? 'friend_request_accepted' : 'friend_request_declined',
      senderName: localStorage.getItem(`username_${senderEmail}`) || senderEmail.split('@')[0],
      senderAvatar: localStorage.getItem(`profilePic_${senderEmail}`) || `https://www.gravatar.com/avatar/${md5(senderEmail)}?d=identicon&s=200`,
      message: accepted ? 'accepted your friend request' : 'declined your friend request',
      timestamp: new Date().toISOString(),
      read: false,
      link: `profile.html?email=${senderEmail}`
    };

    const notifications = JSON.parse(localStorage.getItem(`notifications_${recipientEmail}`) || '[]');
    notifications.unshift(notification);
    localStorage.setItem(`notifications_${recipientEmail}`, JSON.stringify(notifications));
  }

  function removeNotification(notificationId) {
    const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser}`) || '[]');
    const updated = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(updated));
  }

  function markNotificationAsRead(notification, element) {
    if (!notification.read) {
      notification.read = true;
      updateNotification(notification);
      element.classList.remove('bg-[#1a2a1a]');
      element.querySelector('.bg-[#50c878]')?.remove();
      updateBadgeCount();
    }
  }

  function updateNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser}`) || '[]');
    const index = notifications.findIndex(n => n.id === notification.id);
    if (index !== -1) {
      notifications[index] = notification;
      localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(notifications));
    }
  }

  function updateBadgeCount() {
    localStorage.setItem('badgeUpdate', Date.now().toString());
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function md5(string) {
    return string ? CryptoJS.MD5(string.trim().toLowerCase()).toString() : '';
  }

  markAllReadBtn.addEventListener("click", () => {
    const notifications = JSON.parse(localStorage.getItem(`notifications_${currentUser}`) || '[]');
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(`notifications_${currentUser}`, JSON.stringify(updated));
    loadNotifications();
    updateBadgeCount();
  });

  document.querySelectorAll('.notification-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.notification-tab').forEach(t => {
        t.classList.remove('active', 'text-[#d4af37]', 'border-[#d4af37]');
        t.classList.add('text-gray-400');
      });

      this.classList.add('active', 'text-[#d4af37]', 'border-[#d4af37]');
      this.classList.remove('text-gray-400');

      const filter = this.textContent.trim().toLowerCase();
      loadNotifications(filter === 'unread' ? 'unread' : 'all');
    });
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'badgeUpdate' || e.key === 'friendStatusUpdate') {
      loadNotifications();
    }
  });

  // Initial load
  loadNotifications();
});