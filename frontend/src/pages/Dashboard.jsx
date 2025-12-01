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
            return "HR Manager";
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

    const getCurrentDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
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
                { date: "25 DEC", title: "Christmas Day", desc: "Company Holiday - Office Closed" },
                { date: "01 JAN", title: "New Year's Day", desc: "Company Holiday - Office Closed" }
            ]);

            setRecent([
                { message: "Leave request submitted", details: "2 Days - Pending", time: "2 hours ago" },
                { message: "Performance review available", details: "Q4 2024", time: "1 day ago" }
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
        const inProgress = Math.floor((total - completed) * 0.6);
        const notStarted = total - completed - inProgress;

        return {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [
                {
                    data: [completed, Math.max(0, inProgress), Math.max(0, notStarted)],
                    backgroundColor: ['#38a169', '#ed8936', '#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
            legend: {
                display: false,
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

    const getCompletionPercentage = () => {
        if (!quarterly) return 0;
        const completed = quarterly.goals_completed || quarterly.GoalsCompleted || 0;
        const total = quarterly.total_goals || quarterly.TotalGoals || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo-section">
                    <div className="logo">
                        <div className="logo-icon">PS</div>
                        <div>
                            <div className="logo-text">PeopleSoft</div>
                            <div className="logo-subtitle">Employee Portal</div>
                        </div>
                    </div>
                </div>

                <nav className="nav-section">
                    <div className="nav-label">Main</div>
                    <Link to="/" className="nav-item active">
                        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                        </svg>
                        Dashboard
                    </Link>
                    <Link to="/leaves" className="nav-item">
                        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Time Off
                        {stats.pendingLeaves > 0 && (
                            <span className="nav-badge">{stats.pendingLeaves}</span>
                        )}
                    </Link>
                    <Link to="/performance" className="nav-item">
                        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Performance
                    </Link>
                    <Link to="/goals" className="nav-item">
                        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Goals
                    </Link>

                    <div className="nav-label">Management</div>
                    <Link to="/employees" className="nav-item">
                        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        Employees
                    </Link>
                    {(['hr', 'manager'].includes(role)) && (
                        <Link to="/manager/review" className="nav-item">
                            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            Manager Review
                        </Link>
                    )}

                    {/* Holidays Section in Sidebar */}
                    <div className="nav-label">Upcoming Holidays</div>
                    <div className="sidebar-holidays">
                        {events.length > 0 ? (
                            events.map((e, i) => (
                                <div className="sidebar-holiday-item" key={i}>
                                    <div className="holiday-date-badge">
                                        <span className="holiday-day">{(e.date || e.Date).split(' ')[0]}</span>
                                        <span className="holiday-month">{(e.date || e.Date).split(' ')[1]}</span>
                                    </div>
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
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Header */}
                <header className="top-header">
                    <div className="search-bar">
                        <svg width="18" height="18" fill="none" stroke="#a0aec0" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input type="text" placeholder="Search employees, requests, goals..." />
                    </div>

                    <div className="header-actions">
                        <button className="header-btn">
                            <svg width="20" height="20" fill="none" stroke="#718096" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                            </svg>
                            <span className="notification-dot"></span>
                        </button>
                        <div className="user-profile">
                            <img src={getProfileImage()} alt={displayName} className="user-avatar" />
                            <div className="user-info">
                                <div className="user-name">{displayName}</div>
                                <div className="user-role">{getJobTitle()}</div>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="dashboard-content">
                    {/* News Ticker - Simple horizontal scroll */}
                    <div className="news-ticker-simple">
                        <span className="news-label">What's New</span>
                        <div className="news-scroll-container">
                            <div className="news-scroll-text">
                                {newsItems.map((item, index) => (
                                    <span key={index} className="news-item-inline">
                                        {item}
                                        <span className="news-separator">•</span>
                                    </span>
                                ))}
                                {/* Duplicate for seamless loop */}
                                {newsItems.map((item, index) => (
                                    <span key={`dup-${index}`} className="news-item-inline">
                                        {item}
                                        <span className="news-separator">•</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Welcome Section */}
                    <section className="welcome-section">
                        <div className="welcome-text">
                            <h1>{greeting}, {displayName} 👋</h1>
                            <p>Here's what's happening with your team today</p>
                            <div className="welcome-date">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {getCurrentDate()}
                            </div>
                        </div>
                        <div className="welcome-profile">
                            <img src={getProfileImage()} alt={displayName} className="welcome-avatar" />
                            <div className="welcome-profile-info">
                                <span className="welcome-profile-name">{getFullName()}</span>
                                <span className="welcome-profile-title">{getJobTitle()}</span>
                                <span className="welcome-profile-email">{email}</span>
                            </div>
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon blue">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="stat-value">{stats.pendingLeaves}</div>
                            <div className="stat-label">Leave Requests</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon purple">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="stat-value">{stats.upcomingReviews}</div>
                            <div className="stat-label">Upcoming Reviews</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                            </div>
                            <div className="stat-value">{stats.activeGoals}</div>
                            <div className="stat-label">Active Goals</div>
                        </div>

                        {stats.teamSize > 0 && (
                            <div className="stat-card">
                                <div className="stat-header">
                                    <div className="stat-icon orange">
                                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                                <div className="stat-value">{stats.teamSize}</div>
                                <div className="stat-label">Team Size</div>
                            </div>
                        )}
                    </div>

                    {/* Content Grid */}
                    <div className="content-grid">
                        {/* Goals Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span>🎯</span>
                                    Goals Completion
                                </h3>
                                <Link to="/goals" className="card-action">View All Goals</Link>
                            </div>
                            <div className="card-body">
                                {chartData && chartData.datasets[0].data.reduce((a, b) => a + b, 0) > 0 ? (
                                    <div className="goals-chart">
                                        <div className="donut-chart-container">
                                            <Doughnut data={chartData} options={chartOptions} />
                                            <div className="donut-center">
                                                <div className="donut-value">{getCompletionPercentage()}%</div>
                                                <div className="donut-label">Complete</div>
                                            </div>
                                        </div>
                                        <div className="goals-legend">
                                            <div className="legend-item">
                                                <div className="legend-label">
                                                    <span className="legend-dot completed"></span>
                                                    Completed
                                                </div>
                                                <span className="legend-value">{quarterly?.goals_completed || quarterly?.GoalsCompleted || 0}</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-label">
                                                    <span className="legend-dot in-progress"></span>
                                                    In Progress
                                                </div>
                                                <span className="legend-value">{stats.activeGoals}</span>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-label">
                                                    <span className="legend-dot not-started"></span>
                                                    Not Started
                                                </div>
                                                <span className="legend-value">
                                                    {Math.max(0, (quarterly?.total_goals || quarterly?.TotalGoals || 0) - (quarterly?.goals_completed || quarterly?.GoalsCompleted || 0) - stats.activeGoals)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="no-data">No goals data available</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">
                                    <span>🔔</span>
                                    Recent Activity
                                </h3>
                                <span className="card-action">View All</span>
                            </div>
                            <div className="card-body">
                                <div className="activity-list">
                                    {recent.length > 0 ? (
                                        recent.map((a, i) => (
                                            <div className="activity-item" key={i}>
                                                <div className={`activity-icon ${a.type || 'default'}`}>
                                                    {(a.type === 'leave' || (a.message || a.Message || '').toLowerCase().includes('leave')) && (
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                        </svg>
                                                    )}
                                                    {(a.type === 'review' || (a.message || a.Message || '').toLowerCase().includes('review') || (a.message || a.Message || '').toLowerCase().includes('performance')) && (
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                                        </svg>
                                                    )}
                                                    {(a.type === 'goal' || (a.message || a.Message || '').toLowerCase().includes('goal')) && (
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="activity-content">
                                                    <div className="activity-title">{a.message || a.Message}</div>
                                                    <div className="activity-meta">{a.details || a.Details} • {a.time || a.Time}</div>
                                                </div>
                                                <span className={`activity-status ${(a.details || a.Details || '').toLowerCase().includes('pending') ? 'pending' : 'approved'}`}>
                                                    {(a.details || a.Details || '').toLowerCase().includes('pending') ? 'Pending' : 'Done'}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-data">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}