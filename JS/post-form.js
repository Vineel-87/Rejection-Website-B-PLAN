document.addEventListener("DOMContentLoaded", function() {
  
   // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'signin.html';
    return;
  }

  const postForm = document.getElementById("job-post-form");
  const successModal = document.getElementById("success-modal");
  const usernameEl = document.getElementById("post-username");
  const skillInput = document.getElementById("skill-input");
  const addSkillBtn = document.getElementById("add-skill-btn");
  const skillsContainer = document.getElementById("skills-container");
  
  const skills = [];
  let currentUser = null;

  // Load user profile
  loadUserProfile();

  async function loadUserProfile() {
    try {
      const response = await fetch('http://localhost:5000/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const user = await response.json();
      currentUser = user.id;
      usernameEl.textContent = user.name;
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Failed to load user profile');
    }
  }

  // Render skills tags
  function renderSkills() {
    skillsContainer.innerHTML = skills.map((skill, index) => `
      <div class="skill-tag">
        ${skill}
        <button type="button" class="remove-skill" data-index="${index}">×</button>
      </div>
    `).join("");
    
    document.querySelectorAll(".remove-skill").forEach(button => {
      button.addEventListener("click", function() {
        const index = parseInt(this.getAttribute("data-index"));
        skills.splice(index, 1);
        renderSkills();
      });
    });
  }

  // Add new skill
  function addSkill() {
    const skill = skillInput.value.trim();
    if (skill && !skills.includes(skill)) {
      skills.push(skill);
      renderSkills();
      skillInput.value = "";
      skillInput.focus();
    }
  }

  // Form validation
  function validateForm() {
    const requiredFields = [
      { id: "job-link", name: "Job Link" },
      { id: "company", name: "Company" },
      { id: "description", name: "Description" },
      { id: "location", name: "Location" },
      { id: "experience", name: "Experience" }
    ];
    
    const missingFields = [];
    
    requiredFields.forEach(field => {
      const element = document.getElementById(field.id);
      if (!element.value.trim()) {
        missingFields.push(field.name);
        element.classList.add("error");
      } else {
        element.classList.remove("error");
      }
    });
    
    if (skills.length === 0) {
      missingFields.push("At least one skill");
      skillInput.classList.add("error");
    } else {
      skillInput.classList.remove("error");
    }
    
    return missingFields;
  }

  // Submit form
  async function submitForm() {
    const missingFields = validateForm();
    if (missingFields.length > 0) {
      alert("Please fill in the following fields:\n\n• " + missingFields.join("\n• "));
      return false;
    }
    
    const workModeElement = document.querySelector('input[name="work-mode"]:checked');
    if (!workModeElement) {
      alert("Please select a work mode");
      return false;
    }
    
    const jobPost = {
      jobLink: document.getElementById("job-link").value.trim(),
      company: document.getElementById("company").value.trim(),
      description: document.getElementById("description").value.trim(),
      skills: skills,
      location: document.getElementById("location").value.trim(),
      experience: document.getElementById("experience").value.trim(),
      workMode: workModeElement.value,
      datePosted: document.getElementById("date-posted").value,
      lastDate: document.getElementById("last-date").value
    };
    
    try {
      const response = await fetch('http://localhost:5000/api/job-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobPost),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save job post');
      }
      
      // Show success and redirect
      successModal.classList.remove("hidden");
      setTimeout(() => {
        window.location.href = "job-links.html";
      }, 2000);
      
      return true;
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Error: ${error.message}\n\nPlease try again.`);
      return false;
    }
  }

  // Event listeners
  addSkillBtn.addEventListener("click", function(e) {
    e.preventDefault();
    addSkill();
  });
  
  skillInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  });
  
  postForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    await submitForm();
  });
  
  // Initialize date inputs
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  document.getElementById("date-posted").value = today;
  document.getElementById("last-date").value = in30Days;
});