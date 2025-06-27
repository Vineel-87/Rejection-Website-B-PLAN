// linked-accounts.js

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser") || "Guest";
  const linkedForm = document.getElementById("linked-accounts-form");
  const cancelBtn = document.getElementById("cancel-btn");

  // Load saved links into form fields
  document.getElementById("facebook").value = localStorage.getItem(`facebook_${currentUser}`) || "";
  document.getElementById("instagram").value = localStorage.getItem(`instagram_${currentUser}`) || "";
  document.getElementById("linkedin").value = localStorage.getItem(`linkedin_${currentUser}`) || "";
  document.getElementById("telegram").value = localStorage.getItem(`telegram_${currentUser}`) || "";
  document.getElementById("snapchat").value = localStorage.getItem(`snapchat_${currentUser}`) || "";
  document.getElementById("github").value = localStorage.getItem(`github_${currentUser}`) || "";
  document.getElementById("portfolio").value = localStorage.getItem(`portfolio_${currentUser}`) || "";

  // Save to localStorage on submit
  linkedForm.addEventListener("submit", (e) => {
    e.preventDefault();

    localStorage.setItem(`facebook_${currentUser}`, document.getElementById("facebook").value);
    localStorage.setItem(`instagram_${currentUser}`, document.getElementById("instagram").value);
    localStorage.setItem(`linkedin_${currentUser}`, document.getElementById("linkedin").value);
    localStorage.setItem(`telegram_${currentUser}`, document.getElementById("telegram").value);
    localStorage.setItem(`snapchat_${currentUser}`, document.getElementById("snapchat").value);
    localStorage.setItem(`github_${currentUser}`, document.getElementById("github").value);
    localStorage.setItem(`portfolio_${currentUser}`, document.getElementById("portfolio").value);

    // Redirect back to profile.html
    window.location.href = "profile.html";
  });

  // Cancel button logic
  cancelBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
});