document.addEventListener("DOMContentLoaded", async () => {
    // Get user profile elements
    const profilePic = document.getElementById("profile-pic");
    const usernameElement = document.getElementById("username");
    const activityContainer = document.getElementById("activity-container");
    const token = localStorage.getItem("token");

    // Hide loader after 2 seconds
    setTimeout(() => {
        const pageLoader = document.getElementById("page-loader");
        pageLoader.style.opacity = "0";
        setTimeout(() => {
            pageLoader.style.display = "none";
        }, 700);
    }, 2000);

    if (!token) {
        window.location.href = "signin.html";
        return;
    }

    try {
        // Fetch user profile from server2
        const profileResponse = await fetch("http://localhost:5002/api/v2/user/profile", {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!profileResponse.ok) {
            throw new Error("Failed to fetch profile");
        }

        const user = await profileResponse.json();
        
        // Update profile info
        if (user.avatar) {
            // Check if avatar is a full URL or a path
            if (user.avatar.startsWith('http')) {
                profilePic.src = user.avatar;
            } else {
                // Prepend the base URL if it's a path
                profilePic.src = `http://localhost:5002${user.avatar}`;
            }
        } else {
            // Fallback to default avatar if none exists
            profilePic.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email.split('@')[0])}&background=random`;
        }
        
        usernameElement.textContent = user.name || user.email.split('@')[0];

        // Rest of your code...
    } catch (error) {
        console.error("Error loading user activity:", error);
        // Fallback to default avatar on error
        profilePic.src = "Images/default-avatar.png";
        renderSampleActivities();
    }
});

function renderActivities(activities) {
    const container = document.getElementById("activity-container");
    container.innerHTML = '';

    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center text-gray-400 py-8">
                <p>No activities found</p>
            </div>
        `;
        return;
    }

    activities.forEach(activity => {
        const activityCard = document.createElement("div");
        activityCard.className = "bg-[#1E1E1E]/50 rounded-xl p-6 border border-[#8E44AD]/20 backdrop-blur-sm";
        activityCard.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-[#8E44AD]/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#8E44AD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-white">${activity.title}</h3>
                    <p class="text-sm text-gray-300 mt-1">${activity.description}</p>
                    <p class="text-xs text-[#8E44AD] mt-2">${new Date(activity.timestamp).toLocaleString()}</p>
                </div>
            </div>
        `;
        container.appendChild(activityCard);
    });
}