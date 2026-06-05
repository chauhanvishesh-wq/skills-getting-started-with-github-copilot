document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const totalActivities = document.getElementById("total-activities");
  const totalParticipants = document.getElementById("total-participants");
  const totalCapacity = document.getElementById("total-capacity");
  const availableSpots = document.getElementById("available-spots");
  let dashboardErrorCount = 0;
  let dashboardIntervalId;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      console.error("Error fetching activities:", error);
    }
  }

  async function fetchDashboard() {
    try {
      const response = await fetch("/dashboard");
      const dashboard = await response.json();

      totalActivities.textContent = dashboard.total_activities;
      totalParticipants.textContent = dashboard.total_participants;
      totalCapacity.textContent = dashboard.total_capacity;
      availableSpots.textContent = dashboard.available_spots;
      dashboardErrorCount = 0;
    } catch (error) {
      dashboardErrorCount += 1;
      if (dashboardErrorCount >= 3 && dashboardIntervalId) {
        clearInterval(dashboardIntervalId);
        messageDiv.textContent = "Live dashboard updates are paused. Please refresh the page.";
        messageDiv.className = "info";
        messageDiv.classList.remove("hidden");
      }
      console.error("Error fetching dashboard:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
        fetchDashboard();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  fetchDashboard();
  dashboardIntervalId = setInterval(fetchDashboard, 10000);
});
