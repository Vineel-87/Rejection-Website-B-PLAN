// birthday-reminders.js - Database Integrated Version
const API_BASE_URL = 'http://localhost:5000';

// Confetti functions (unchanged)
function createConfetti() {
  const colors = ['#d4af37', '#50c878', '#ff6b6b', '#48dbfb', '#f368e0'];
  const container = document.querySelector('.birthday-card');
  
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'birthday-confetti';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = -10 + 'px';
    confetti.style.width = Math.random() * 8 + 4 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    
    container.appendChild(confetti);
    
    const animationDuration = Math.random() * 3 + 2;
    
    confetti.style.animation = `drop ${animationDuration}s linear forwards`;
    confetti.style.setProperty('--random-x', Math.random() * 200 - 100 + 'px');
    
    setTimeout(() => {
      confetti.remove();
    }, animationDuration * 1000);
  }
}

function addConfettiStyle() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes drop {
      0% {
        transform: translateY(0) translateX(0);
        opacity: 1;
      }
      100% {
        transform: translateY(calc(100vh - 100px)) translateX(var(--random-x));
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Update marquee with today's birthdays
function updateBirthdayMarquee(todayBirthdays) {
  const marqueeContent = document.getElementById('marquee-content');
  const marqueeContainer = document.getElementById('birthday-marquee');
  
  if (todayBirthdays && todayBirthdays.length > 0) {
    marqueeContainer.style.display = 'flex';
    marqueeContainer.classList.add('birthday-header');
    
    let content = '';
    if (todayBirthdays.length === 1) {
      content = `🎉 Wishing ${todayBirthdays[0].username} a very Happy Birthday! May your day be filled with joy! 🎉`;
    } else {
      const names = todayBirthdays.map(bday => bday.username);
      const last = names.pop();
      content = `🎉 Wishing ${names.join(', ')} and ${last} a very Happy Birthday! 🎉`;
    }
    
    // Repeat the message 3 times for smooth marquee
    marqueeContent.innerHTML = `${content} • ${content} • ${content}`;
    createConfetti();
  } else {
    marqueeContainer.style.display = 'none';
  }
}

// Birthday Notes functionality with database
async function setupBirthdayNotes() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const notesTextarea = document.getElementById('birthday-notes');
  const saveButton = document.getElementById('save-notes');
  
  try {
    // Load saved notes from database
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      if (profile.birthday_notes) {
        notesTextarea.value = profile.birthday_notes;
      }
    }
  } catch (error) {
    console.error("Error loading birthday notes:", error);
  }
  
  // Save notes to database
  saveButton.addEventListener('click', async () => {
    const notes = notesTextarea.value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ birthday_notes: notes })
      });

      if (response.ok) {
        // Show confirmation
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved!';
        saveButton.classList.add('bg-[#3da865]');
        setTimeout(() => {
          saveButton.textContent = originalText;
          saveButton.classList.remove('bg-[#3da865]');
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving birthday notes:", error);
    }
  });
}

// Update sidebar with upcoming birthdays
function updateSidebarUpcoming(upcomingBirthdays) {
  const sidebarUpcoming = document.getElementById('sidebar-upcoming');
  
  if (upcomingBirthdays && upcomingBirthdays.length > 0) {
    let html = '';
    upcomingBirthdays.slice(0, 3).forEach(bday => {
      html += `
        <div class="flex items-center gap-3 p-2 bg-[#1a1a1a]/50 rounded-lg border border-[#50c878]/20">
          <img src="${bday.profilePic}" class="w-8 h-8 rounded-full border border-[#50c878]">
          <div>
            <div class="text-sm font-medium">${bday.username}</div>
            <div class="text-xs text-[#d4af37]">${bday.daysUntil === 1 ? 'Tomorrow' : `${bday.daysUntil} days`}</div>
          </div>
        </div>
      `;
    });
    
    if (upcomingBirthdays.length > 3) {
      html += `<div class="text-center text-xs text-gray-400">+${upcomingBirthdays.length - 3} more</div>`;
    }
    
    sidebarUpcoming.innerHTML = html;
  } else {
    sidebarUpcoming.innerHTML = '<p class="text-gray-400 text-sm">No upcoming birthdays</p>';
  }
}

// Load profile data for vertical container from database
async function loadVerticalProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const verticalProfilePic = document.getElementById("vertical-profile-pic");
  const verticalUsername = document.getElementById("vertical-username");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      // Handle avatar URL properly
      const avatarUrl = user.avatar 
        ? user.avatar.startsWith('http') 
          ? user.avatar 
          : `${API_BASE_URL}${user.avatar}`
        : `https://www.gravatar.com/avatar/${CryptoJS.MD5(user.email.trim().toLowerCase())}?d=identicon&s=200`;
      
      verticalProfilePic.src = avatarUrl;
      verticalUsername.textContent = user.name || user.email.split('@')[0];
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

// Calculate days until birthday
function getDaysUntilBirthday(birthday) {
  if (!birthday) return Infinity;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create this year's birthday date
  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  thisYearBirthday.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = thisYearBirthday - today;
  let daysUntil = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If birthday already passed this year, calculate for next year
  if (daysUntil < 0) {
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
    nextYearBirthday.setHours(0, 0, 0, 0);
    const nextDiffTime = nextYearBirthday - today;
    daysUntil = Math.floor(nextDiffTime / (1000 * 60 * 60 * 24));
  }
  
  return daysUntil;
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
  addConfettiStyle();
  await loadVerticalProfile();
  await setupBirthdayNotes();

  const token = localStorage.getItem("token");
  if (!token) {
    document.getElementById("today-birthdays").innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400 mb-4">Please sign in to view birthday reminders</p>
        <a href="signin.html" class="bg-[#50c878] hover:bg-[#3da865] text-white px-4 py-2 rounded-lg transition">Sign In</a>
      </div>
    `;
    return;
  }

  try {
    // Get friends list from database
    const friendsResponse = await fetch(`${API_BASE_URL}/api/user/friends`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!friendsResponse.ok) {
      throw new Error("Failed to fetch friends list");
    }
    
    const friends = await friendsResponse.json();
    const todayBirthdays = [];
    const upcomingBirthdays = [];
    const allBirthdays = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each friend's birthday
    for (const friend of friends) {
      if (!friend.dob) continue;

      const dob = new Date(friend.dob);
      if (isNaN(dob.getTime())) continue;

      const daysUntil = getDaysUntilBirthday(dob);

      // Generate proper avatar URL
      const avatarUrl = friend.avatar 
        ? friend.avatar.startsWith('http') 
          ? friend.avatar 
          : `${API_BASE_URL}${friend.avatar}`
        : `https://www.gravatar.com/avatar/${CryptoJS.MD5(friend.email.trim().toLowerCase())}?d=identicon&s=200`;

      const birthdayItem = {
        id: friend.id,
        email: friend.email,
        username: friend.name || friend.email.split('@')[0],
        profilePic: avatarUrl,
        date: dob,
        formattedDate: formatDate(dob),
        daysUntil,
        isToday: daysUntil === 0
      };

      allBirthdays.push(birthdayItem);

      if (daysUntil === 0) {
        todayBirthdays.push(birthdayItem);
      } else if (daysUntil > 0 && daysUntil <= 30) {
        upcomingBirthdays.push(birthdayItem);
      }
    }

    // Rest of the code remains the same...
    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
    allBirthdays.sort((a, b) => {
      const aMonth = a.date.getMonth();
      const aDay = a.date.getDate();
      const bMonth = b.date.getMonth();
      const bDay = b.date.getDate();
      return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
    });

    displayBirthdays(todayBirthdays, 'today-birthdays', true);
    displayBirthdays(upcomingBirthdays, 'upcoming-birthdays', true);
    displayBirthdays(allBirthdays, 'all-birthdays', false);

    updateBirthdayMarquee(todayBirthdays);
    updateSidebarUpcoming(upcomingBirthdays);

  } catch (error) {
    console.error("Initialization error:", error);
    document.getElementById("today-birthdays").innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400">Failed to load birthday data</p>
      </div>
    `;
  }
});

// Helper functions
function displayBirthdays(birthdays, containerId, showDaysUntil) {
  const container = document.getElementById(containerId);
  if (!birthdays || birthdays.length === 0) {
    if (containerId === 'today-birthdays') {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No birthdays today</p>';
    } else if (containerId === 'upcoming-birthdays') {
      container.innerHTML = '<p class="text-gray-400 text-center py-8">No upcoming birthdays in the next 30 days</p>';
    } else {
      container.innerHTML = '<p class="text-gray-400 text-center py-8 col-span-2">No birthdays found</p>';
    }
    return;
  }

  if (containerId === 'all-birthdays') {
    const grouped = groupByMonth(birthdays);
    container.innerHTML = Object.entries(grouped).map(([month, bdays]) => `
      <div class="col-span-2">
        <h3 class="text-lg font-semibold text-[#d4af37] mb-2">${month}</h3>
        <div class="space-y-3">
          ${bdays.map(bday => createBirthdayCard(bday, showDaysUntil)).join('')}
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = birthdays.map(bday => createBirthdayCard(bday, showDaysUntil)).join('');
  }
}

function createBirthdayCard(bday, showDaysUntil) {
  // Generate fallback avatar URL if no avatar is provided
  const avatarUrl = bday.profilePic || 
    `https://www.gravatar.com/avatar/${CryptoJS.MD5(bday.email.trim().toLowerCase())}?d=identicon&s=200`;
  
  return `
    <div class="flex items-center gap-4 p-3 hover:bg-[#252525] rounded-lg transition group cursor-pointer" onclick="window.location.href='profile.html?email=${encodeURIComponent(bday.email)}'">
      <div class="relative">
        <img src="${avatarUrl}" alt="${bday.username}" 
             class="w-12 h-12 rounded-full object-cover border-2 ${bday.isToday ? 'border-[#d4af37] animate-pulse' : 'border-[#50c878]'}">
        ${bday.isToday ? `
          <div class="absolute -top-1 -right-1 w-5 h-5 bg-[#d4af37] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        ` : ''}
      </div>
      <div class="flex-1">
        <h3 class="font-semibold group-hover:text-[#d4af37] transition">${bday.username}</h3>
        <p class="text-sm text-gray-400">${bday.formattedDate}</p>
      </div>
      ${showDaysUntil ? `
        <span class="bg-[#d4af37]/20 text-[#d4af37] px-3 py-1 rounded-full text-sm font-medium">
          ${bday.isToday ? 'Today!' : bday.daysUntil === 1 ? 'Tomorrow' : `${bday.daysUntil} days`}
        </span>
      ` : ''}
    </div>
  `;
}

function groupByMonth(birthdays) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return birthdays.reduce((acc, bday) => {
    const month = months[bday.date.getMonth()];
    if (!acc[month]) acc[month] = [];
    acc[month].push(bday);
    return acc;
  }, {});
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// Make functions available globally
window.updateBirthdayMarquee = updateBirthdayMarquee;
window.updateSidebarUpcoming = updateSidebarUpcoming;