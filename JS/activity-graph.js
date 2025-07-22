document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "signin.html";
        return;
    }

    // Start a new activity session
    let sessionId;
    try {
        const startResponse = await fetch("http://localhost:5000/api/activity/start", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!startResponse.ok) throw new Error("Failed to start activity tracking");
        const { sessionId: id } = await startResponse.json();
        sessionId = id;
        
        // Setup heartbeat to keep session active
        const heartbeatInterval = setInterval(async () => {
            try {
                await fetch("http://localhost:5000/api/activity/heartbeat", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ sessionId })
                });
            } catch (error) {
                console.error("Heartbeat failed:", error);
            }
        }, 30000); // Every 30 seconds

        // Cleanup on page unload
        window.addEventListener("beforeunload", async () => {
            clearInterval(heartbeatInterval);
            try {
                await fetch("http://localhost:5000/api/activity/end", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ sessionId })
                });
            } catch (error) {
                console.error("Failed to end session:", error);
            }
        });

    } catch (error) {
        console.error("Activity session error:", error);
    }

    // Function to fetch and update activity data
    const updateActivityData = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/activity/today", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch activity data");
            
            const data = await response.json();
            renderActivityGraph(data.hourlyData, data.totalSeconds);
            
            // Update current date display
            const currentDateElement = document.getElementById("current-date");
            if (currentDateElement) {
                currentDateElement.textContent = new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (error) {
            console.error("Error loading activity data:", error);
            renderActivityGraph([], 0); // Render empty graph on error
        }
    };

    // Initial load
    await updateActivityData();

    await fetchActivityHistory();
    // Update history every 5 minutes
    setInterval(fetchActivityHistory, 300000);
        
    // Update every minute
    setInterval(updateActivityData, 60000);
});

function getSegmentColors(dataValues) {
    const segmentColors = [];
    const segmentBorders = [];
    
    for (let i = 0; i < dataValues.length - 1; i++) {
        const current = dataValues[i];
        const next = dataValues[i + 1];
        
        if (next > current) {
            // Growth - green
            segmentColors.push('rgba(46, 204, 113, 0.2)');
            segmentBorders.push('rgba(46, 204, 113, 1)');
        } else if (next < current) {
            // Decline - red
            segmentColors.push('rgba(231, 76, 60, 0.2)');
            segmentBorders.push('rgba(231, 76, 60, 1)');
        } else {
            // Stable - yellow
            segmentColors.push('rgba(241, 196, 15, 0.2)');
            segmentBorders.push('rgba(241, 196, 15, 1)');
        }
    }
    
    // Add a default color for the last segment
    if (dataValues.length > 0) {
        segmentColors.push('rgba(142, 68, 173, 0.2)');
        segmentBorders.push('rgba(142, 68, 173, 1)');
    }
    
    return { segmentColors, segmentBorders };
}

function renderActivityGraph(hourlyData, totalSeconds) {
    const ctx = document.getElementById('activity-graph').getContext('2d');
    
    // Destroy previous chart instance if it exists
    if (window.activityChart) {
        window.activityChart.destroy();
    }
    
    // Format hours for labels
    const labels = hourlyData.map(item => {
        const hour = item.hour % 12 || 12;
        const ampm = item.hour < 12 ? 'AM' : 'PM';
        return `${hour}${ampm}`;
    });
    
    // Format data values (convert seconds to minutes)
    const dataValues = hourlyData.map(item => item.seconds / 60);
    
    // Get segment colors based on trends
    const { segmentColors, segmentBorders } = getSegmentColors(dataValues);
    
    // Calculate max value for y-axis (rounded up to nearest 30 minutes)
    const maxMinutes = Math.max(...dataValues, 30);
    const maxY = Math.ceil(maxMinutes / 30) * 30;
    
    window.activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Activity (minutes)',
                data: dataValues,
                backgroundColor: (context) => {
                    const index = context.dataIndex;
                    return segmentColors[index] || 'rgba(142, 68, 173, 0.2)';
                },
                borderColor: (context) => {
                    const index = context.dataIndex;
                    return segmentBorders[index] || 'rgba(142, 68, 173, 1)';
                },
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                segment: {
                    borderColor: ctx => {
                        const index = ctx.p0DataIndex;
                        return segmentBorders[index] || 'rgba(142, 68, 173, 1)';
                    },
                    backgroundColor: ctx => {
                        const index = ctx.p0DataIndex;
                        return segmentColors[index] || 'rgba(142, 68, 173, 0.2)';
                    }
                },
                pointBackgroundColor: 'rgba(142, 68, 173, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxY,
                    ticks: {
                        callback: function(value) {
                            return value + 'm';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const minutes = context.raw;
                            const hours = Math.floor(minutes / 60);
                            const remainingMinutes = Math.round(minutes % 60);
                            
                            if (hours > 0) {
                                return `${hours}h ${remainingMinutes}m`;
                            }
                            return `${remainingMinutes}m`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderJoinStyle: 'round'
                }
            }
        }
    });
    
    // Update total time display
    const totalTimeElement = document.getElementById('total-time');
    if (totalTimeElement) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            totalTimeElement.textContent = `${hours}h ${minutes}m`;
        } else {
            totalTimeElement.textContent = `${minutes}m`;
        }
    }
}

// Update the fetchActivityHistory function
async function fetchActivityHistory() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const historyContainer = document.getElementById('activity-history');
    historyContainer.innerHTML = `
        <tr>
            <td colspan="3" class="py-4 text-center text-gray-400">Loading history...</td>
        </tr>
    `;

    try {
        // Change this endpoint to match your actual API
        const response = await fetch("http://localhost:5000/api/activity/today", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch activity history");
        
        const data = await response.json();
        
        // Transform the hourly data into history format
        const historyData = data.hourlyData.map(item => ({
        date: new Date().toISOString().split('T')[0], // Today's date
        hour: item.hour, // ✅ Add this line to preserve hour
        seconds: item.seconds
    }));
            
        renderActivityHistory(historyData);
    } catch (error) {
        console.error("Error loading activity history:", error);
        historyContainer.innerHTML = `
            <tr>
                <td colspan="3" class="py-4 text-center text-red-400">Failed to load history</td>
            </tr>
        `;
    }
}

// Update renderActivityHistory to handle hourly data
function renderActivityHistory(historyData) {
    const historyContainer = document.getElementById('activity-history');
    historyContainer.innerHTML = '';

    if (!historyData || historyData.length === 0) {
        historyContainer.innerHTML = `
            <tr>
                <td colspan="3" class="py-4 text-center text-gray-400">No activity history found</td>
            </tr>
        `;
        return;
    }

    // Group by hour and calculate totals
    const hourlyTotals = {};
    historyData.forEach(item => {
        const hour = item.hour;
        if (!hourlyTotals[hour]) {
            hourlyTotals[hour] = 0;
        }
        hourlyTotals[hour] += item.seconds || 0;
    });

    // Convert to array and sort
    const sortedHours = Object.entries(hourlyTotals)
        .map(([hour, seconds]) => ({ hour: parseInt(hour), seconds }))
        .sort((a, b) => a.hour - b.hour);

    sortedHours.forEach(item => {
        const hours = Math.floor(item.seconds / 3600);
        const minutes = Math.floor((item.seconds % 3600) / 60);
        
        const isHighUsage = item.seconds > (60 * 60); // More than 1 hour
        
        const historyRow = document.createElement('tr');
        historyRow.className = 'border-b border-[#8E44AD]/10 hover:bg-[#8E44AD]/10 transition';
        historyRow.innerHTML = `
            <td class="py-3">
                ${item.hour}:00 - ${item.hour + 1}:00
            </td>
            <td class="py-3">
                ${hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </td>
            <td class="py-3">
                <div class="flex items-center gap-2">
                    ${isHighUsage 
                        ? `<span class="text-red-400">High Activity</span>`
                        : `<span class="text-green-400">Normal Activity</span>`}
                </div>
            </td>
        `;
        historyContainer.appendChild(historyRow);
    });
}
