async function loadDashboard() {

  try {

    const response = await fetch("/api/dashboard");

    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    const data = await response.json();

    if (!data.success) {
      window.location.href = "/login.html";
      return;
    }

    const user = data.user;
    const stats = data.statistics;

    document.getElementById("username").textContent =
      user.name;

    document.getElementById("email").textContent =
      user.email;

    document.getElementById("avatar").textContent =
      user.name.charAt(0).toUpperCase();

    document.getElementById("balance").textContent =
      Number(stats.balance).toFixed(2);

    document.getElementById("totalBots").textContent =
      stats.totalBots;

    document.getElementById("activeBots").textContent =
      stats.activeBots;

    document.getElementById("orders").textContent =
      stats.orders;

  } catch (error) {

    console.error("Dashboard error:", error);

  }

}


async function logout() {

  try {

    await fetch("/api/logout", {
      method: "POST"
    });

    window.location.href = "/login.html";

  } catch (error) {

    console.error(error);

  }

}


function toggleSidebar() {

  const sidebar = document.querySelector(".sidebar");

  sidebar.classList.toggle("open");

}


loadDashboard();
