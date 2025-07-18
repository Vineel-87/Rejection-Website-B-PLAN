// birthday-reminders.js - Vanta Black + Infra Red Theme
const API_BASE_URL = 'http://localhost:5000';

let allBirthdays = []; // Add this at the top

const BIRTHDAYS_PER_PAGE = 30;
const BIRTHDAYS_PER_ROW = 5;

// Confetti functions (updated colors)
function createConfetti() {
  const colors = ['#FF073A', '#ff3860', '#ff073a', '#ff6b6b', '#ff073a'];
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

function updateBirthdayMarquee(todayBirthdays) {
  const marqueeContent = document.getElementById('marquee-content');
  const marqueeContainer = document.getElementById('birthday-marquee');
  
  if (todayBirthdays && todayBirthdays.length > 0) {
    marqueeContainer.style.display = 'flex';
    marqueeContainer.classList.add('birthday-header');
    
    let content = '';
    if (todayBirthdays.length === 1) {
      content = `🎉 Wishing ${todayBirthdays[0].username} a very Happy Birthday! 🎉`;
    } else {
      const names = todayBirthdays.map(bday => bday.username);
      const last = names.pop();
      content = `🎉 Wishing ${names.join(', ')} and ${last} a very Happy Birthday! 🎉`;
    }
    
    // Only set the content once (no duplicates)
    marqueeContent.textContent = content;
  } else {
    marqueeContainer.style.display = 'none';
  }
}


// Birthday Notes functionality
async function setupBirthdayNotes() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const notesTextarea = document.getElementById('birthday-notes');
  const saveButton = document.getElementById('save-notes');
  
  try {
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
        const originalText = saveButton.textContent;
        saveButton.textContent = 'Saved!';
        saveButton.classList.add('bg-[#cc0029]');
        setTimeout(() => {
          saveButton.textContent = originalText;
          saveButton.classList.remove('bg-[#cc0029]');
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
        <div class="flex items-center gap-3 p-2 bg-[#0a0a0a]/50 rounded-lg border border-[#FF073A]/20">
          <img src="${bday.profilePic}" class="w-8 h-8 rounded-full border border-[#FF073A]">
          <div>
            <div class="text-sm font-medium">${bday.username}</div>
            <div class="text-xs text-[#FF073A]">${bday.daysUntil === 1 ? 'Tomorrow' : `${bday.daysUntil} days`}</div>
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

// Load profile data
async function loadVerticalProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const verticalProfilePic = document.getElementById("vertical-profile-pic");
  const verticalUsername = document.getElementById("vertical-username");
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      const avatarUrl = user.avatar 
        ? user.avatar.startsWith('http') 
          ? user.avatar 
          : `${API_BASE_URL}${user.avatar}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`;
      
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
  
  const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  thisYearBirthday.setHours(0, 0, 0, 0);
  
  const diffTime = thisYearBirthday - today;
  let daysUntil = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) {
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
    nextYearBirthday.setHours(0, 0, 0, 0);
    const nextDiffTime = nextYearBirthday - today;
    daysUntil = Math.floor(nextDiffTime / (1000 * 60 * 60 * 24));
  }
  
  return daysUntil;
}

// Display birthdays in the specified container
function displayBirthdays(birthdays, containerId, isGrid = true) {
  const container = document.getElementById(containerId);
  
  if (!birthdays || birthdays.length === 0) {
    container.innerHTML = `<p class="text-gray-400 text-center py-8">No birthdays found</p>`;
    return;
  }

  if (isGrid) {
    // Display as grid using createBirthdayAvatar
    container.innerHTML = birthdays.map(bday => createBirthdayAvatar(bday)).join('');
  } else {
    // Display as list items
    container.innerHTML = birthdays.map(bday => createBirthdayListItem(bday)).join('');
  }
}

// Add this new function for list items
function createBirthdayListItem(bday) {
  if (!bday.dob) return '';
  
  const dob = new Date(bday.dob);
  if (isNaN(dob.getTime())) return '';
  
  const avatarUrl = bday.avatar || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(bday.name || bday.email.split('@')[0])}&background=random`;
  
  return `
    <div class="flex items-center gap-4 p-3 hover:bg-[#1E1E1E]/50 rounded-lg cursor-pointer transition"
         onclick="window.location.href='profile.html?email=${encodeURIComponent(bday.email)}'">
      <div class="relative w-12 h-12">
        <img src="${avatarUrl}" alt="${bday.name || bday.email.split('@')[0]}" 
             class="w-full h-full rounded-full object-cover border-2 ${bday.isToday ? 'border-[#FF073A] animate-pulse' : 'border-[#8E44AD]'}">
        ${bday.isToday ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-[#FF073A] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        ` : ''}
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-white truncate">${bday.name || bday.email.split('@')[0]}</h3>
        <p class="text-xs text-[#8E44AD]">${dob.getDate()} ${dob.toLocaleString('default', { month: 'short' })}</p>
      </div>
      ${bday.isToday ? `
        <span class="bg-[#FF073A] text-white text-xs px-2 py-1 rounded-full">Today</span>
      ` : ''}
    </div>
  `;
}

// Create birthday avatar element
function createBirthdayAvatar(bday) {
  if (!bday.dob) return '';
  
  const dob = new Date(bday.dob);
  if (isNaN(dob.getTime())) return '';
  
  const avatarUrl = bday.profilePic || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(bday.name || bday.email.split('@')[0])}&background=random`;
  
  return `
    <div class="flex flex-col items-center" onclick="window.location.href='profile.html?email=${encodeURIComponent(bday.email)}'">
      <div class="relative w-16 h-16 mb-2">
        <img src="${avatarUrl}" alt="${bday.name || bday.email.split('@')[0]}" 
             class="w-full h-full rounded-full object-cover border-2 ${bday.isToday ? 'border-[#FF073A] animate-pulse' : 'border-[#FF073A]'}">
        ${bday.isToday ? `
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-[#FF073A] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-2 w-2 text-black" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        ` : ''}
      </div>
      <span class="text-xs text-center text-white truncate w-full">${bday.name || bday.email.split('@')[0]}</span>
      <span class="text-xs text-[#FF073A]">${dob.getDate()} ${dob.toLocaleString('default', { month: 'short' })}</span>
    </div>
  `;
}

// Month filter functionality
document.getElementById('month-filter').addEventListener('change', function() {
  const selectedMonth = parseInt(this.value);
  const allBirthdaysContainer = document.getElementById('all-birthdays');
  
  if (this.value === 'all') {
    // Show all birthdays
    displayBirthdays(allBirthdays, 'all-birthdays', true);
    return;
  }
  
  // Filter birthdays by selected month
  const filteredBirthdays = allBirthdays.filter(bday => {
    const dob = new Date(bday.dob);
    return dob.getMonth() === selectedMonth;
  });
  
  displayBirthdays(filteredBirthdays, 'all-birthdays', true);
});

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
        <a href="signin.html" class="bg-[#FF073A] hover:bg-[#cc0029] text-white px-4 py-2 rounded-lg transition">Sign In</a>
      </div>
    `;
    return;
  }

  try {
    // First fetch the current user's profile to get their ID
    const userResponse = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error("Failed to fetch user profile");
    }
    
    const currentUser = await userResponse.json();
    
    // Then fetch friends with profile data
    const response = await fetch(`${API_BASE_URL}/api/user/friends`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch friends list");
    }
    
    const friends = await response.json();
    
    // Initialize arrays (using the global allBirthdays)
    const todayBirthdays = [];
    const upcomingBirthdays = [];
    allBirthdays.length = 0; // Clear existing birthdays

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch profile data for each friend to get their DOB
    for (const friend of friends) {
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/api/user/by-email/${encodeURIComponent(friend.email)}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) continue;
        
        const profile = await profileResponse.json();
        
        if (!profile.dob) continue;

        const dob = new Date(profile.dob);
        if (isNaN(dob.getTime())) continue;

        const daysUntil = getDaysUntilBirthday(dob);

        // Construct proper avatar URL
        const avatarUrl = profile.avatar 
          ? profile.avatar.startsWith('http') 
            ? profile.avatar 
            : `${API_BASE_URL}${profile.avatar}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email.split('@')[0])}&background=random`;

        const birthdayItem = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          username: profile.name || profile.email.split('@')[0],
          profilePic: avatarUrl,
          avatar: avatarUrl,
          dob: profile.dob,
          date: dob,
          formattedDate: formatDate(dob),
          daysUntil,
          isToday: daysUntil === 0
        };

        // Add to the global allBirthdays array
        allBirthdays.push(birthdayItem);

        if (daysUntil === 0) {
          todayBirthdays.push(birthdayItem);
        } else if (daysUntil > 0 && daysUntil <= 30) {
          upcomingBirthdays.push(birthdayItem);
        }
      } catch (error) {
        console.error("Error processing friend:", friend, error);
      }
    }

    upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    
    allBirthdays.sort((a, b) => {
      const aMonth = a.date.getMonth();
      const aDay = a.date.getDate();
      const bMonth = b.date.getMonth();
      const bDay = b.date.getDate();
      return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
    });

    displayBirthdays(todayBirthdays, 'today-birthdays', false);
    displayBirthdays(upcomingBirthdays, 'upcoming-birthdays', false);
    displayBirthdays(allBirthdays, 'all-birthdays', true);

    updateBirthdayMarquee(todayBirthdays);
    updateSidebarUpcoming(upcomingBirthdays);

  } catch (error) {
    console.error("Initialization error:", error);
    document.getElementById("today-birthdays").innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400">Failed to load birthday data: ${error.message}</p>
      </div>
    `;
  }
});

function formatDate(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Make functions available globally
window.updateBirthdayMarquee = updateBirthdayMarquee;
window.updateSidebarUpcoming = updateSidebarUpcoming;