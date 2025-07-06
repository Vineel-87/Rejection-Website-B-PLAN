// Confetti functions
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

// Add CSS for confetti animation
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

// Update marquee with today's birthdays (improved version)
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

// Add Birthday Notes functionality
function setupBirthdayNotes() {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser || currentUser === "Guest") return;
  
  const notesKey = `birthdayNotes_${currentUser}`;
  const notesTextarea = document.getElementById('birthday-notes');
  const saveButton = document.getElementById('save-notes');
  
  // Load saved notes
  const savedNotes = localStorage.getItem(notesKey);
  if (savedNotes) {
    notesTextarea.value = savedNotes;
  }
  
  // Save notes
  saveButton.addEventListener('click', () => {
    const notes = notesTextarea.value;
    localStorage.setItem(notesKey, notes);
    
    // Show confirmation
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Saved!';
    saveButton.classList.add('bg-[#3da865]');
    setTimeout(() => {
      saveButton.textContent = originalText;
      saveButton.classList.remove('bg-[#3da865]');
    }, 2000);
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

// Load profile data for vertical container
function loadVerticalProfile() {
  const currentUser = localStorage.getItem("currentUser") || "Guest";
  const verticalProfilePic = document.getElementById("vertical-profile-pic");
  const verticalUsername = document.getElementById("vertical-username");
  
  if (currentUser && currentUser !== "Guest") {
    const savedProfilePic = localStorage.getItem(`profilePic_${currentUser}`);
    if (savedProfilePic) {
      verticalProfilePic.src = savedProfilePic;
    } else {
      verticalProfilePic.src = `https://www.gravatar.com/avatar/${CryptoJS.MD5(currentUser.trim().toLowerCase())}?d=identicon&s=200`;
    }
    
    const savedUsername = localStorage.getItem(`username_${currentUser}`) || 
                         (currentUser.includes("@") ? currentUser.split("@")[0] : currentUser);
    verticalUsername.textContent = savedUsername;
  }
}

// Parse date in dd/mm/yyyy format
function parseBirthDate(dateString) {
  if (!dateString) return null;
  
  // Try to parse as dd/mm/yyyy
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-based
    const year = parseInt(parts[2], 10);
    
    // Validate date
    const date = new Date(year, month, day);
    if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
      return date;
    }
  }
  
  // Fallback to native Date parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// Calculate days until birthday (handles dd/mm/yyyy format)
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
document.addEventListener("DOMContentLoaded", () => {
  addConfettiStyle();
  loadVerticalProfile();
  setupBirthdayNotes(); 

  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser || currentUser === "Guest") {
    document.getElementById("today-birthdays").innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-400 mb-4">Please sign in to view birthday reminders</p>
        <a href="signin.html" class="bg-[#50c878] hover:bg-[#3da865] text-white px-4 py-2 rounded-lg transition">Sign In</a>
      </div>
    `;
    return;
  }

  // Get friends list
  const friends = JSON.parse(localStorage.getItem(`friends_${currentUser}`) || "[]");
  const todayBirthdays = [];
  const upcomingBirthdays = [];
  const allBirthdays = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  friends.forEach(friendEmail => {
    const dobString = localStorage.getItem(`dob_${friendEmail}`);
    
    if (!dobString) return;

    const dob = parseBirthDate(dobString);
    if (!dob) {
      console.warn(`Invalid date format for ${friendEmail}: ${dobString}`);
      return;
    }

    const username = localStorage.getItem(`username_${friendEmail}`) || friendEmail.split('@')[0];
    const profilePic = localStorage.getItem(`profilePic_${friendEmail}`) || 
      `https://www.gravatar.com/avatar/${CryptoJS.MD5(friendEmail)}?d=identicon&s=200`;

    const daysUntil = getDaysUntilBirthday(dob);

    const birthdayItem = {
      email: friendEmail,
      username,
      profilePic,
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
  });

  // Sort upcoming birthdays by days until
  upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
  
  // Sort all birthdays by month and day
  allBirthdays.sort((a, b) => {
    const aMonth = a.date.getMonth();
    const aDay = a.date.getDate();
    const bMonth = b.date.getMonth();
    const bDay = b.date.getDate();
    return aMonth === bMonth ? aDay - bDay : aMonth - bMonth;
  });

  // Display birthdays in their respective sections
  displayBirthdays(todayBirthdays, 'today-birthdays', true);
  displayBirthdays(upcomingBirthdays, 'upcoming-birthdays', true);
  displayBirthdays(allBirthdays, 'all-birthdays', false);

  // Update marquee and sidebar
  updateBirthdayMarquee(todayBirthdays);
  updateSidebarUpcoming(upcomingBirthdays);
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
  return `
    <div class="flex items-center gap-4 p-3 hover:bg-[#252525] rounded-lg transition group cursor-pointer" onclick="window.location.href='profile.html?email=${encodeURIComponent(bday.email)}'">
      <div class="relative">
        <img src="${bday.profilePic}" alt="${bday.username}" 
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