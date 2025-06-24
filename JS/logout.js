function logout() {
  // Clear user-specific data
  localStorage.removeItem('currentUser');
  // Redirect to signin page
  window.location.href = "signin.html";
}

// Attach logout function to the logout link
document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.querySelector('a[href="signin.html"]');
  if (logoutLink) {
    logoutLink.addEventListener("click", function(e) {
      e.preventDefault();
      logout();
    });
  }
});