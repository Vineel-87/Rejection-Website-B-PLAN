// JS/profile.js

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("edit-upload");
  const profileImage = document.getElementById("profile-preview");

  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        profileImage.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
});
