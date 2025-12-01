describe("Dashboard Visual Tests (With Full Mocks)", () => {

    //
    // ======================================================
    //                 🔧 Global Dashboard Mocks
    // ======================================================
    //
    const mockDashboardData = {
        quarterly_results: {
            quarter: "Q4",
            year: 2025,
            avg_performance: 4.7,
            goals_completed: 17,
            total_goals: 49,
            goals_completed_percent: 34,
            engagement_score: 78,
            engagement_trend: "up",
            engagement_change: 5,
            reviews_completed: 2,
            reviews_pending: 1
        },
        recent_activity: [
            {
                type: "leave",
                message: "Leave request submitted",
                details: "2 Days – Pending",
                time: "2 hours ago"
            },
            {
                type: "goal",
                message: "Goal completed",
                details: "Q4 Review",
                time: "1 day ago"
            }
        ],
        stats: {
            pendingLeaves: 4,
            upcomingReviews: 2,
            activeGoals: 6,
            teamSize: 25
        },
        top_performers: ["Maria Fisher", "Christopher Harris"],
        upcoming_events: [
            { date: "25 DEC", title: "Christmas Day", desc: "Company Holiday - Office Closed" },
            { date: "01 JAN", title: "New Year's Day", desc: "Company Holiday - Office Closed" }
        ]
    };

    const loadDashboardMocks = () => {
        cy.intercept("GET", "**/api/dashboard/stats*", {
            statusCode: 200,
            body: mockDashboardData
        }).as("mockDashboardStats");
    };


    //
    // ======================================================
    //                   LOGIN BASELINE
    // ======================================================
    //
    it("should capture login page (baseline)", () => {
        cy.visit("/login");
        cy.wait(2000);
        cy.screenshot("01-login-page", { capture: "fullPage" });
    });



    //
    // ======================================================
    //                   HR DASHBOARD
    // ======================================================
    //
    context("HR Dashboard", () => {
        it("loads HR dashboard with full mock data", () => {

            loadDashboardMocks();

            cy.visit("/dashboard", {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "mock-token");
                    win.localStorage.setItem("email", Cypress.env("HR_EMAIL"));
                    win.localStorage.setItem("name", Cypress.env("HR_NAME"));
                    win.localStorage.setItem("role", Cypress.env("HR_ROLE"));
                }
            });

            cy.wait("@mockDashboardStats");

            cy.contains(Cypress.env("HR_FIRST_NAME")).should("be.visible");

            cy.screenshot("02-hr-dashboard", { capture: "fullPage", overwrite: true });
        });
    });




    //
    // ======================================================
    //                  MANAGER DASHBOARD
    // ======================================================
    //
    context("Manager Dashboard", () => {
        it("loads Manager dashboard with full mock data", () => {

            loadDashboardMocks();

            cy.visit("/dashboard", {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "mock-token");
                    win.localStorage.setItem("email", Cypress.env("MANAGER_EMAIL"));
                    win.localStorage.setItem("name", Cypress.env("MANAGER_NAME"));
                    win.localStorage.setItem("role", Cypress.env("MANAGER_ROLE"));
                }
            });

            cy.wait("@mockDashboardStats");

            cy.contains(Cypress.env("MANAGER_FIRST_NAME")).should("be.visible");

            cy.screenshot("03-manager-dashboard", { capture: "fullPage", overwrite: true });
        });
    });



    //
    // ======================================================
    //                  EMPLOYEE DASHBOARD
    // ======================================================
    //
    context("Employee Dashboard", () => {
        it("loads Employee dashboard with full mock data", () => {

            loadDashboardMocks();

            cy.visit("/dashboard", {
                onBeforeLoad(win) {
                    win.localStorage.setItem("token", "mock-token");
                    win.localStorage.setItem("email", Cypress.env("EMP_EMAIL"));
                    win.localStorage.setItem("name", Cypress.env("EMP_NAME"));
                    win.localStorage.setItem("role", Cypress.env("EMP_ROLE"));
                }
            });

            cy.wait("@mockDashboardStats");

            cy.contains(Cypress.env("EMP_FIRST_NAME")).should("be.visible");

            cy.screenshot("04-employee-dashboard", { capture: "fullPage", overwrite: true });
        });
    });

});
