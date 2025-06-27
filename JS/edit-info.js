document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("currentUser") || "Guest";
  const editInfoForm = document.getElementById("edit-info-form");
  const cancelBtn = document.getElementById("cancel-btn");

  // Load saved data
  const savedFullName = localStorage.getItem(`fullName_${currentUser}`);
  const savedDob = localStorage.getItem(`dob_${currentUser}`);
  const savedGender = localStorage.getItem(`gender_${currentUser}`);
  const savedEmail = localStorage.getItem(`email_${currentUser}`);
  const savedMobile = localStorage.getItem(`mobile_${currentUser}`);
  const savedAddress = localStorage.getItem(`address_${currentUser}`);

  // Populate form fields
  if (savedFullName) document.getElementById("full-name").value = savedFullName;
  if (savedDob) document.getElementById("dob").value = savedDob;
  if (savedGender) document.getElementById("gender").value = savedGender;
  if (savedEmail) document.getElementById("email").value = savedEmail;
  if (savedMobile) document.getElementById("mobile").value = savedMobile;
  if (savedAddress) document.getElementById("address").value = savedAddress;

  // Form submission
  editInfoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Get form values
    const fullName = document.getElementById("full-name").value;
    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const email = document.getElementById("email").value;
    const mobile = document.getElementById("mobile").value;
    const address = document.getElementById("address").value;
    
    // Save to localStorage
    localStorage.setItem(`fullName_${currentUser}`, fullName);
    localStorage.setItem(`dob_${currentUser}`, dob);
    localStorage.setItem(`gender_${currentUser}`, gender);
    localStorage.setItem(`email_${currentUser}`, email);
    localStorage.setItem(`mobile_${currentUser}`, mobile);
    localStorage.setItem(`address_${currentUser}`, address);
    
    // Redirect back to profile
    window.location.href = "profile.html";
  });

  // Cancel button
  cancelBtn.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
});