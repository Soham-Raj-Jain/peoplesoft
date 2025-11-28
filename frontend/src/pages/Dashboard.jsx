import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from '@auth0/auth0-react';
import client from "../api/client";
import "./Dashboard.css";
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
    const { logout: auth0Logout } = useAuth0();

    const name = localStorage.getItem("name");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");

    // Get display name based on email
    const getDisplayName = () => {
        if (email === "peoplesoftent.manager@gmail.com") {
            return "Jack";
        } else if (email === "peoplesoftent.hr@gmail.com") {
            return "Jasmin";
        } else if (email === "peoplesoftent.employee@gmail.com") {
            return "Maria";
        } else {
            return name ? name.split(" ")[0] : "User";
        }
    };

    const getFullName = () => {
        if (email === "peoplesoftent.manager@gmail.com") {
            return "Jack Fernandes";
        } else if (email === "peoplesoftent.hr@gmail.com") {
            return "Jasmin Park";
        } else if (email === "peoplesoftent.employee@gmail.com") {
            return "Maria Fisher";
        } else {
            return name || "User";
        }
    };

    const getJobTitle = () => {
        if (email === "peoplesoftent.manager@gmail.com") {
            return "Engineering Manager";
        } else if (email === "peoplesoftent.hr@gmail.com") {
            return "PeopleSoft HR";
        } else if (email === "peoplesoftent.employee@gmail.com") {
            return "Senior Developer";
        } else {
            return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Employee";
        }
    };

    const getPhoneNumber = () => {
        if (email === "peoplesoftent.manager@gmail.com") {
            return "669-210-0987";
        } else if (email === "peoplesoftent.hr@gmail.com") {
            return "682-340-1098";
        } else if (email === "peoplesoftent.employee@gmail.com") {
            return "612-321-9865";
        } else {
            return "N/A";
        }
    };

    const getProfileImage = () => {
        if (email === "peoplesoftent.manager@gmail.com") {
            return "/images/manager_profile.jpg";
        } else if (email === "peoplesoftent.hr@gmail.com") {
            return "/images/hr_profile.jpg";
        } else if (email === "peoplesoftent.employee@gmail.com") {
            return "/images/employee_profile.jpg";
        } else {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&size=200`;
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) {
            return "Good Morning";
        } else if (hour < 18) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    const displayName = getDisplayName();
    const greeting = getGreeting();

    const [stats, setStats] = useState({
        pendingLeaves: 0,
        upcomingReviews: 0,
        activeGoals: 0,
        teamSize: 0
    });

    const [events, setEvents] = useState([]);
    const [recent, setRecent] = useState([]);
    const [quarterly, setQuarterly] = useState(null);
    const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const newsItems = [
        "🎉 Jack Fernandes completed 5 years at PeopleSoft — Congratulations!",
        "🏆 Maria Fisher recognized as Q3 Top Performer",
        "🤖 New AI Upskilling Training is now open — Join today!",
        "🚀 PeopleSoft announced 2025 Internal Hackathon!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [newsItems.length]);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            console.log("🔍 About to fetch dashboard data...");
            console.log("🔑 Token:", localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
            console.log("📧 Email:", localStorage.getItem('email'));
            console.log("👤 Role:", localStorage.getItem('role'));

            const res = await client.get("/api/dashboard/stats");
            console.log("✅ Dashboard response:", res.data);



            // Set stats
            if (res.data.stats) {
                setStats({
                    pendingLeaves: res.data.stats.pendingLeaves || res.data.stats.PendingLeaves || 0,
                    upcomingReviews: res.data.stats.upcomingReviews || res.data.stats.UpcomingReviews || 0,
                    activeGoals: res.data.stats.activeGoals || res.data.stats.ActiveGoals || 0,
                    teamSize: res.data.stats.teamSize || res.data.stats.TeamSize || 0
                });
                console.log("Stats set:", res.data.stats);
            }

            // Set quarterly results
            if (res.data.quarterly_results) {
                setQuarterly(res.data.quarterly_results);
                console.log("Quarterly results:", res.data.quarterly_results);
            }

            // Set events
            if (res.data.upcoming_events && res.data.upcoming_events.length > 0) {
                setEvents(res.data.upcoming_events);
            }

            // Set recent activity
            if (res.data.recent_activity && res.data.recent_activity.length > 0) {
                setRecent(res.data.recent_activity);
            }

            setLoading(false);
        } catch (err) {
            console.error("Dashboard load error:", err);
            setLoading(false);

            // Fallback data
            setEvents([
                { date: "25 DEC", title: "Christmas Day", desc: "Company Holiday" },
                { date: "01 JAN", title: "New Year's Day", desc: "Company Holiday" }
            ]);

            setRecent([
                { message: "No recent activity", details: "", time: "" }
            ]);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        auth0Logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    };

    // Prepare chart data
    const getChartData = () => {
        if (!quarterly) return null;

        const completed = quarterly.goals_completed || quarterly.GoalsCompleted || 0;
        const total = quarterly.total_goals || quarterly.TotalGoals || 0;
        const remaining = Math.max(0, total - completed);

        return {
            labels: ['Completed', 'Remaining'],
            datasets: [
                {
                    data: [completed, remaining],
                    backgroundColor: ['#48bb78', '#e53e3e'],
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const chartData = getChartData();

    return (
        <div className="dashboard-container">
            {/* Logout Button - Top Right */}
            <button onClick={handleLogout} className="logout-button-top">
                Logout
            </button>

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-holidays-card">
                    <h4>📆 Upcoming Holidays</h4>
                    {events.length > 0 ? (
                        events.map((e, i) => (
                            <div className="sidebar-holiday-item" key={i}>
                                <div className="holiday-date">{e.date || e.Date}</div>
                                <div className="holiday-info">
                                    <div className="holiday-title">{e.title || e.Title}</div>
                                    <div className="holiday-desc">{e.desc || e.Desc}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-holidays">No upcoming holidays</p>
                    )}
                </div>

                <Link to="/" className="sidebar-item active">
                    🏠 Dashboard
                </Link>
                <Link to="/leaves" className="sidebar-item">
                    📅 Time Off
                </Link>
                <Link to="/performance" className="sidebar-item">
                    ⭐ Performance
                </Link>
                <Link to="/goals" className="sidebar-item">
                    🎯 Goals
                </Link>
                <Link to="/employees" className="sidebar-item">
                    👥 Employees
                </Link>
                {(['hr', 'manager'].includes(role)) && (
                    <Link to="/manager/review" className="sidebar-item">
                        📊 Manager Review
                    </Link>
                )}
            </aside>

            {/* MAIN */}
            <main className="dashboard-main">
                {/* News Ticker */}
                <div className="news-ticker">
                    <div className="news-icon">📢</div>
                    <div className="news-content">
                        <div className="news-slider">
                            {newsItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`news-item ${index === currentNewsIndex ? 'active' : ''}`}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="news-indicator">
                        {newsItems.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${index === currentNewsIndex ? 'active' : ''}`}
                                onClick={() => setCurrentNewsIndex(index)}
                            />
                        ))}
                    </div>
                </div>

                {/* Profile Header */}
                <div className="profile-header">
                    <img src={getProfileImage()} alt="Profile" />
                    <div>
                        <h2>Hello, {displayName}! 👋</h2>
                        <p>{getJobTitle()}</p>
                        <p>{getPhoneNumber()}</p>
                        <p>Email: {email}</p>
                    </div>
                </div>

                {/* Greeting */}
                <h1 className="greeting-title">
                    {greeting}, {displayName} 👋
                </h1>

                {/* Stats Row */}
                <div className="cards-row">
                    <div className="stat-card">
                        <div className="stat-number">{stats.pendingLeaves}</div>
                        <div className="stat-label">Leave Requests</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.upcomingReviews}</div>
                        <div className="stat-label">Upcoming Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.activeGoals}</div>
                        <div className="stat-label">Active Goals</div>
                    </div>
                    {stats.teamSize > 0 && (
                        <div className="stat-card">
                            <div className="stat-number">{stats.teamSize}</div>
                            <div className="stat-label">Team Size</div>
                        </div>
                    )}
                </div>

                {/* Main Grid */}
                <div className="main-grid-full">
                    {/* Pie Chart */}
                    <div className="white-card goals-card">
                        <h3>🎯 Goals Completion</h3>
                        {chartData && chartData.datasets[0].data.reduce((a, b) => a + b, 0) > 0 ? (
                            <>
                                <div className="pie-wrapper">
                                    <Doughnut data={chartData} options={chartOptions} />
                                </div>
                                <div className="goals-summary">
                                    {quarterly.goals_completed ?? quarterly.GoalsCompleted ?? 0} of {quarterly.total_goals ?? quarterly.TotalGoals ?? 0} goals completed
                                </div>
                            </>
                        ) : (
                            <p className="no-data">No goals data available</p>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="white-card activity-card">
                        <h3>🔔 Recent Activity</h3>
                        {recent.length > 0 ? (
                            recent.map((a, i) => (
                                <div className="activity-row" key={i}>
                                    <strong>{a.message || a.Message}</strong>
                                    <div className="activity-details">{a.details || a.Details}</div>
                                    <small className="activity-time">{a.time || a.Time}</small>
                                </div>
                            ))
                        ) : (
                            <p className="no-data">No recent activity</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}