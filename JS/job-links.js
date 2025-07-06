document.addEventListener('DOMContentLoaded', function() {
  // Application state
  const state = {
    jobPosts: [],
    filteredPosts: [],
    filters: {
      search: '',
      date: [],
      company: '',
      experience: [],
      location: '',
      skills: [],
      workMode: []
    },
    currentUser: null,
    loading: false,
    error: null
  };

  // DOM elements
  const elements = {
    container: document.getElementById('job-posts-container'),
    searchInput: document.getElementById('search-input'),
    filterButtons: {
      date: document.getElementById('date-filter-btn'),
      company: document.getElementById('company-filter-btn'),
      experience: document.getElementById('experience-filter-btn'),
      location: document.getElementById('location-filter-btn'),
      skills: document.getElementById('skills-filter-btn'),
      workMode: document.getElementById('work-mode-filter-btn')
    },
    filterPanels: {
      date: document.getElementById('date-filter-panel'),
      company: document.getElementById('company-filter-panel'),
      experience: document.getElementById('experience-filter-panel'),
      location: document.getElementById('location-filter-panel'),
      skills: document.getElementById('skills-filter-panel'),
      workMode: document.getElementById('work-mode-filter-panel')
    },
    clearFiltersBtn: document.getElementById('clear-filters-btn'),
    loadingIndicator: document.getElementById('loading-indicator'),
    errorContainer: document.getElementById('error-container'),
    postJobBtn: document.getElementById('post-job-btn')
  };

  // Initialize the application
  init();

  async function init() {
    await loadCurrentUser();
    setupEventListeners();
    loadJobPosts();
  }

  async function loadCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const user = await response.json();
      state.currentUser = user.id;
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }

  function setupEventListeners() {
    // Search input
    elements.searchInput.addEventListener('input', debounce(function() {
      state.filters.search = this.value.toLowerCase();
      applyFilters();
    }, 300));

    // Filter buttons
    Object.keys(elements.filterButtons).forEach(key => {
      elements.filterButtons[key].addEventListener('click', function() {
        toggleFilterPanel(key);
      });
    });

    // Filter inputs
    document.querySelectorAll('[data-filter="date"]').forEach(input => {
      input.addEventListener('change', function() {
        updateDateFilters();
      });
    });

    document.querySelectorAll('[data-filter="experience"]').forEach(input => {
      input.addEventListener('change', function() {
        updateExperienceFilters();
      });
    });

    document.querySelectorAll('[data-filter="workMode"]').forEach(input => {
      input.addEventListener('change', function() {
        updateWorkModeFilters();
      });
    });

    document.getElementById('company-filter-input').addEventListener('input', debounce(function() {
      state.filters.company = this.value.toLowerCase();
      applyFilters();
    }, 300));

    document.getElementById('location-filter-input').addEventListener('input', debounce(function() {
      state.filters.location = this.value.toLowerCase();
      applyFilters();
    }, 300));

    document.getElementById('skills-filter-input').addEventListener('input', debounce(function() {
      state.filters.skills = this.value.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
      applyFilters();
    }, 300));

    // Clear filters
    elements.clearFiltersBtn.addEventListener('click', clearFilters);

    // Post job button - ADD THIS BLOCK RIGHT HERE
    if (elements.postJobBtn) {
      elements.postJobBtn.addEventListener('click', function() {
        if (!state.currentUser) {
          alert('Please login to post a job');
          return;
        }
        window.location.href = 'post-form.html';
      });
    }
}

  function toggleFilterPanel(filterType) {
    // Hide all panels first
    Object.keys(elements.filterPanels).forEach(key => {
      if (key !== filterType) {
        elements.filterPanels[key].classList.add('hidden');
      }
    });
    
    // Toggle the clicked panel
    elements.filterPanels[filterType].classList.toggle('hidden');
  }

  

  async function loadJobPosts() {
    state.loading = true;
    state.error = null;
    updateUI();
    
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5000/api/job-posts', {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      state.jobPosts = data;
      state.filteredPosts = [...data];
    } catch (error) {
      console.error('Failed to load job posts:', error);
      state.error = error;
    } finally {
      state.loading = false;
      updateUI();
    }
  }

  function updateDateFilters() {
    state.filters.date = Array.from(document.querySelectorAll('[data-filter="date"]:checked'))
      .map(input => input.value);
    applyFilters();
  }

  function updateExperienceFilters() {
    state.filters.experience = Array.from(document.querySelectorAll('[data-filter="experience"]:checked'))
      .map(input => input.value);
    applyFilters();
  }

  function updateWorkModeFilters() {
    state.filters.workMode = Array.from(document.querySelectorAll('[data-filter="workMode"]:checked'))
      .map(input => input.value);
    applyFilters();
  }

  function applyFilters() {
    state.filteredPosts = state.jobPosts.filter(post => {
      // Search filter
      if (state.filters.search) {
        const searchFields = [
          post.company,
          post.description,
          post.location,
          ...post.skills
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(state.filters.search)) {
          return false;
        }
      }
      
      // Date filters
      if (state.filters.date.length > 0) {
        const postDate = new Date(post.datePosted);
        const now = new Date();
        const timeDiff = now - postDate;
        const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
        
        const matchesDateFilter = state.filters.date.some(filter => {
          switch(filter) {
            case 'today': return dayDiff <= 1;
            case 'week': return dayDiff <= 7;
            case 'month': return dayDiff <= 30;
            case 'year': return dayDiff <= 365;
            default: return true;
          }
        });
        
        if (!matchesDateFilter) return false;
      }
      
      // Company filter
      if (state.filters.company && !post.company.toLowerCase().includes(state.filters.company)) {
        return false;
      }
      
      // Experience filter
      if (state.filters.experience.length > 0) {
        const [minExp, maxExp] = post.experience.split('-').map(Number);
        const matchesExperience = state.filters.experience.some(range => {
          const [filterMin, filterMax] = range.split('-').map(Number);
          return (minExp >= filterMin) && (!filterMax || maxExp <= filterMax);
        });
        
        if (!matchesExperience) return false;
      }
      
      // Location filter
      if (state.filters.location && !post.location.toLowerCase().includes(state.filters.location)) {
        return false;
      }
      
      // Skills filter
      if (state.filters.skills.length > 0) {
        const matchesSkills = state.filters.skills.some(skill => 
          post.skills.some(postSkill => 
            postSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        
        if (!matchesSkills) return false;
      }
      
      // Work mode filter
      if (state.filters.workMode.length > 0 && !state.filters.workMode.includes(post.workMode)) {
        return false;
      }
      
      return true;
    });
    
    updateUI();
  }

  function clearFilters() {
    // Reset search
    elements.searchInput.value = '';
    state.filters.search = '';
    
    // Reset date filters
    document.querySelectorAll('[data-filter="date"]').forEach(input => {
      input.checked = false;
    });
    state.filters.date = [];
    
    // Reset company filter
    document.getElementById('company-filter-input').value = '';
    state.filters.company = '';
    
    // Reset experience filters
    document.querySelectorAll('[data-filter="experience"]').forEach(input => {
      input.checked = false;
    });
    state.filters.experience = [];
    
    // Reset location filter
    document.getElementById('location-filter-input').value = '';
    state.filters.location = '';
    
    // Reset skills filter
    document.getElementById('skills-filter-input').value = '';
    state.filters.skills = [];
    
    // Reset work mode filters
    document.querySelectorAll('[data-filter="workMode"]').forEach(input => {
      input.checked = false;
    });
    state.filters.workMode = [];
    
    // Close all filter panels
    Object.keys(elements.filterPanels).forEach(key => {
      elements.filterPanels[key].classList.add('hidden');
    });
    
    // Reset filtered posts
    state.filteredPosts = [...state.jobPosts];
    updateUI();
  }

  function updateUI() {
    if (state.loading) {
      showLoading();
      return;
    }
    
    if (state.error) {
      showError(state.error);
      return;
    }
    
    if (state.filteredPosts.length === 0) {
      showNoResults();
      return;
    }
    
    renderJobPosts();
  }

  function showLoading() {
    elements.container.innerHTML = '';
    elements.loadingIndicator.classList.remove('hidden');
    elements.errorContainer.classList.add('hidden');
  }

  function showError(error) {
    elements.container.innerHTML = '';
    elements.loadingIndicator.classList.add('hidden');
    elements.errorContainer.classList.remove('hidden');
    
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = error.message || 'Failed to load job posts';
    
    const retryBtn = document.getElementById('retry-btn');
    retryBtn.onclick = loadJobPosts;
  }

  function showNoResults() {
    elements.container.innerHTML = `
      <div class="no-results">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-200">No matching job posts</h3>
        <p class="mt-1 text-sm text-gray-400">Try adjusting your filters or search terms</p>
      </div>
    `;
    elements.loadingIndicator.classList.add('hidden');
    elements.errorContainer.classList.add('hidden');
  }

  function renderJobPosts() {
    elements.loadingIndicator.classList.add('hidden');
    elements.errorContainer.classList.add('hidden');
    
    elements.container.innerHTML = state.filteredPosts.map(post => `
      <div class="job-post" data-id="${post.id}">
        ${post.userId === state.currentUser ? `
          <button class="delete-btn" onclick="deleteJobPost('${post.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        ` : ''}
        
        <div class="post-header">
          <img src="${post.userAvatar || getDefaultAvatar(post.username)}" 
               alt="${post.username}" class="user-avatar">
          <div>
            <h3>${post.username}</h3>
            <span class="post-date">${formatDate(post.timestamp)}</span>
          </div>
        </div>
        
        <h2 class="company">${post.company}</h2>
        <p class="description">${post.description}</p>
        
        ${post.skills.length > 0 ? `
          <div class="skills">
            ${post.skills.map(skill => `
              <span class="skill-tag">${skill}</span>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="post-details">
          <div><i class="fas fa-map-marker-alt"></i> ${post.location}</div>
          <div><i class="fas fa-briefcase"></i> ${post.experience} years</div>
          <div><i class="fas fa-calendar"></i> Posted: ${formatDate(post.datePosted)}</div>
          <div><i class="fas fa-clock"></i> Apply by: ${formatDate(post.lastDate)}</div>
        </div>
        
        <div class="post-footer">
          <span class="work-mode ${post.workMode}">
            ${capitalizeFirstLetter(post.workMode)}
          </span>
          <a href="${post.jobLink}" target="_blank" class="apply-btn">
            Apply Now <i class="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    `).join('');
  }

  // Helper functions
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function getDefaultAvatar(name) {
    const initials = name.split(' ').map(part => part[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
  }

  function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }

  // Global functions
  window.deleteJobPost = async function(id) {
    if (!confirm('Are you sure you want to delete this job post?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/job-posts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job post');
      }
      
      // Remove the deleted post from state
      state.jobPosts = state.jobPosts.filter(post => post.id !== id);
      state.filteredPosts = state.filteredPosts.filter(post => post.id !== id);
      
      updateUI();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete job post. Please try again.');
    }
  };
});