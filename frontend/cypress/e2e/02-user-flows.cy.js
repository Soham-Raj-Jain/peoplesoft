describe("Dashboard + All Pages With Mocks", () => {

    beforeEach(() => {
        //
        // ---------- 1. SET LOCALSTORAGE -----------
        //
        cy.visit("/", {
            onBeforeLoad(win) {
                win.localStorage.setItem("token", "mock-token");
                win.localStorage.setItem("email", Cypress.env("HR_EMAIL"));
                win.localStorage.setItem("name", Cypress.env("HR_NAME"));
                win.localStorage.setItem("role", Cypress.env("HR_ROLE"));
            }
        });

        //
        // ---------- 2. DASHBOARD MOCKS -----------
        //
        cy.intercept("GET", "**/api/dashboard/stats", {
            statusCode: 200,
            body: {
                quarterly_results: {
                    quarter: "Q4",
                    year: 2025,
                    avg_performance: 0,
                    goals_completed: 17,
                    total_goals: 49,
                    goals_completed_percent: 34,
                    engagement_score: 78,
                    engagement_trend: "up",
                    engagement_change: 5,
                    reviews_completed: 0,
                    reviews_pending: 0
                },
                recent_activity: [
                    {
                        type: "leave",
                        message: "Leave request submitted",
                        details: "2 Days – Pending",
                        time: "2 hours ago"
                    },
                    {
                        type: "review",
                        message: "Performance review available",
                        details: "Q4 2024",
                        time: "1 day ago"
                    }
                ],
                stats: {
                    pendingLeaves: 29,
                    upcomingReviews: 0,
                    activeGoals: 14,
                    teamSize: 23
                },
                top_performers: null,
                upcoming_events: [
                    {
                        date: "25 DEC",
                        title: "Christmas Day",
                        desc: "Company Holiday - Office Closed"
                    },
                    {
                        date: "01 JAN",
                        title: "New Year's Day",
                        desc: "Company Holiday - Office Closed"
                    }
                ]
            }
        }).as("mockDashboard");


        //
        // ---------- 3. EMPLOYEES PAGE MOCK -----------
        //
        cy.intercept("GET", "**/api/employees*", {
            statusCode: 200,
            body: {
                data: [
                    {
                        id: 17,
                        name: "Anthony Hernandez",
                        email: "anthony@company.com",
                        designation: "Operations Specialist",
                        manager: "-",
                        phone: "555-0117",
                        location: "Austin"
                    },
                    {
                        id: 13,
                        name: "Barbara Garcia",
                        email: "barbara@company.com",
                        designation: "Content Manager",
                        manager: "David Martinez",
                        phone: "555-0114",
                        location: "Los Angeles"
                    },
                    {
                        id: 9,
                        name: "Christopher Harris",
                        email: "chris@company.com",
                        designation: "Sales Executive",
                        manager: "Jennifer Brown",
                        phone: "555-0111",
                        location: "Chicago"
                    }
                ],
                total: 1,
                page: 1,
                page_size: 10
            }
        }).as("mockEmployees");


        //
        // ---------- 4. LEAVES PAGE MOCK -----------
        //
        // LEAVES: My leaves
        cy.intercept("GET", "**/api/leaves/my*", {
            statusCode: 200,
            body: {
                data: [
                    { id: 31, employee: "Jasmin", type: "SICK", start: "2025-11-27", end: "2025-11-28" }
                ]
            }
        }).as("mockLeavesMy");


// LEAVES: Balance
        cy.intercept("GET", "**/api/leaves/balance*", {
            statusCode: 200,
            body: {
                data: [
                    { type: "sick", total: 15, used: 13, remaining: 2 },
                    { type: "casual", total: 5, used: 2, remaining: 3 },
                    { type: "vacation", total: 10, used: 0, remaining: 10 }
                ]
            }
        }).as("mockLeaveBalance");   // <----- EXACT ALIAS




        //
        // ---------- 5. PERFORMANCE PAGE MOCK -----------
        //
        cy.intercept("GET", "**/api/performance*", {
            statusCode: 200,
            body: [
                { employee: "Peoplesoft HR", period: "2025-Q1", score: 4.7, comments: "No comments" },
                { employee: "Peoplesoft HR", period: "2024-Q4", score: 4.3, comments: "No comments" }
            ]
        }).as("mockPerformance");


        //
        // ---------- 6. GOALS PAGE MOCK -----------
        //
        cy.intercept("GET", "**/api/pms/my-goals*", {
            statusCode: 200,
            body: [
                {
                    ID: 18,
                    UserID: 21,
                    CycleID: 1,
                    Title: "Complete Q4 Performance Reviews",
                    Description: "Review all team members",
                    Timeline: "2024-12-31",
                    Progress: 100,
                    Status: "completed"
                },
                {
                    ID: 21,
                    UserID: 21,
                    CycleID: 1,
                    Title: "Hire 5 New Engineers",
                    Description: "Expand engineering team",
                    Timeline: "2025-06-30",
                    Progress: 100,
                    Status: "submitted"
                }
            ]
        }).as("mockGoals");
    });

        //
    // ============================================================
    //                     📌 TEST CASES
    // ============================================================
    //

    it("loads dashboard with mocks", () => {
        cy.visit("/dashboard");
        cy.wait("@mockDashboard");
        cy.screenshot("dashboard-with-data", { capture: "fullPage" });
    });

    it("loads employees page with mock data", () => {
        cy.visit("/employees");
        cy.wait("@mockEmployees");
        cy.contains("Anthony Hernandez").should("be.visible");
        cy.screenshot("employees-with-data", { capture: "fullPage" });
    });

    it("loads leaves page with mock data", () => {
        cy.visit("/leaves");
        cy.wait("@mockLeavesMy");
        cy.wait("@mockLeaveBalance");
        cy.screenshot("leaves-with-data", { capture: "fullPage" });
    });

    it("loads performance page with mock data", () => {
        cy.visit("/performance");
        cy.wait("@mockPerformance");
        cy.screenshot("performance-with-data", { capture: "fullPage" });
    });

    it("loads goals page with mock data", () => {
        cy.visit("/goals");
        cy.wait("@mockGoals");
        cy.screenshot("goals-with-data", { capture: "fullPage" });
    });

});
