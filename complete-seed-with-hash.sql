-- ============================================
-- COMPLETE SEED DATA WITH BCRYPT HASHING
-- ============================================

-- ============================================
-- STEP 0: ENABLE PGCRYPTO & CREATE DEPARTMENTS TABLE
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- ============================================
-- STEP 1: CLEAN ALL EXISTING DATA
-- ============================================

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables (this will delete all data)
TRUNCATE TABLE manager_reviews CASCADE;
TRUNCATE TABLE self_assessments CASCADE;
TRUNCATE TABLE review_cycles CASCADE;
TRUNCATE TABLE performances CASCADE;
TRUNCATE TABLE leaves CASCADE;
TRUNCATE TABLE goals CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- ============================================
-- STEP 2: INSERT FRESH DATA
-- ============================================

-- Insert Departments
INSERT INTO departments (id, name) VALUES
(1, 'Engineering'),
(2, 'Human Resources'),
(3, 'Sales'),
(4, 'Marketing'),
(5, 'Finance'),
(6, 'Operations');

-- Insert Users with TEMPORARY placeholder passwords
-- Hierarchy: Peoplesoft Hr (top) -> HR users -> Department managers -> Employees
INSERT INTO users (id, name, email, password_hash, role, department_id, created_at) VALUES
-- Top HR (Peoplesoft Hr)
(21, 'Peoplesoft Hr', 'peoplesoftent.hr@gmail.com', 'temp', 'hr', 2, NOW()),

-- HR Users (report to Peoplesoft Hr)
(1, 'Sarah Johnson', 'sarah.johnson@company.com', 'temp', 'hr', 2, NOW()),
(2, 'Michael Davis', 'michael.davis@company.com', 'temp', 'hr', 2, NOW()),

-- Department Manager Users (report to HR admins)
(3, 'Robert Williams', 'robert.williams@company.com', 'temp', 'manager', 1, NOW()),
(4, 'Jennifer Brown', 'jennifer.brown@company.com', 'temp', 'manager', 3, NOW()),
(5, 'David Martinez', 'david.martinez@company.com', 'temp', 'manager', 4, NOW()),
(6, 'Lisa Anderson', 'lisa.anderson@company.com', 'temp', 'manager', 5, NOW()),
(22, 'Peoplesoft Manager', 'peoplesoftent.manager@gmail.com', 'temp', 'manager', 6, NOW()),

-- Employee Users (report to their department managers)
(7, 'James Taylor', 'james.taylor@company.com', 'temp', 'employee', 1, NOW()),
(8, 'Mary Thomas', 'mary.thomas@company.com', 'temp', 'employee', 1, NOW()),
(9, 'John Jackson', 'john.jackson@company.com', 'temp', 'employee', 1, NOW()),
(23, 'Peoplesoft Employee', 'peoplesoftent.employee@gmail.com', 'temp', 'employee', 1, NOW()),
(10, 'Patricia White', 'patricia.white@company.com', 'temp', 'employee', 3, NOW()),
(11, 'Christopher Harris', 'christopher.harris@company.com', 'temp', 'employee', 3, NOW()),
(12, 'Linda Martin', 'linda.martin@company.com', 'temp', 'employee', 3, NOW()),
(13, 'Daniel Thompson', 'daniel.thompson@company.com', 'temp', 'employee', 4, NOW()),
(14, 'Barbara Garcia', 'barbara.garcia@company.com', 'temp', 'employee', 4, NOW()),
(15, 'Matthew Rodriguez', 'matthew.rodriguez@company.com', 'temp', 'employee', 5, NOW()),
(16, 'Susan Martinez', 'susan.martinez@company.com', 'temp', 'employee', 5, NOW()),
(17, 'Anthony Hernandez', 'anthony.hernandez@company.com', 'temp', 'employee', 6, NOW()),
(18, 'Jessica Lopez', 'jessica.lopez@company.com', 'temp', 'employee', 6, NOW()),
(19, 'Mark Gonzalez', 'mark.gonzalez@company.com', 'temp', 'employee', 6, NOW()),
(20, 'Karen Wilson', 'karen.wilson@company.com', 'temp', 'employee', 6, NOW());

-- Insert Employees
-- Hierarchy Structure:
-- Peoplesoft Hr (21) - Top level HR Admin
--   ├─ Sarah Johnson (1) - HR Director
--   ├─ Michael Davis (2) - HR Manager
--   ├─ Robert Williams (3) - Engineering Manager
--   │   ├─ James Taylor (7) - Senior Software Engineer
--   │   ├─ Mary Thomas (8) - Software Engineer
--   │   ├─ John Jackson (9) - Software Engineer
--   │   └─ Peoplesoft Employee (23) - Junior Software Engineer
--   ├─ Jennifer Brown (4) - Sales Manager
--   │   ├─ Patricia White (10) - Senior Sales Executive
--   │   ├─ Christopher Harris (11) - Sales Executive
--   │   └─ Linda Martin (12) - Sales Executive
--   ├─ David Martinez (5) - Marketing Manager
--   │   ├─ Daniel Thompson (13) - Marketing Specialist
--   │   └─ Barbara Garcia (14) - Content Marketing Manager
--   ├─ Lisa Anderson (6) - Finance Manager
--   │   ├─ Matthew Rodriguez (15) - Financial Analyst
--   │   └─ Susan Martinez (16) - Accountant
--   └─ Peoplesoft Manager (22) - Operations Manager
--       ├─ Anthony Hernandez (17) - Operations Specialist
--       ├─ Jessica Lopez (18) - Customer Support Lead
--       ├─ Mark Gonzalez (19) - Operations Coordinator
--       └─ Karen Wilson (20) - Support Specialist

INSERT INTO employees (id, user_id, designation, department_id, manager_id, phone, location, created_at) VALUES
-- Top HR Admin (no manager)
(21, 21, 'Chief HR Officer', 2, NULL, '555-0121', 'San Francisco', NOW()),

-- HR Team (report to Peoplesoft Hr - employee_id 21)
(1, 1, 'HR Director', 2, 21, '555-0101', 'New York', NOW()),
(2, 2, 'HR Manager', 2, 21, '555-0102', 'New York', NOW()),

-- Engineering Department - Manager (reports to Peoplesoft Hr - employee_id 21) and Team
(3, 3, 'Engineering Manager', 1, 21, '555-0103', 'San Francisco', NOW()),
(4, 7, 'Senior Software Engineer', 1, 3, '555-0107', 'San Francisco', NOW()),
(5, 8, 'Software Engineer', 1, 3, '555-0108', 'San Francisco', NOW()),
(6, 9, 'Software Engineer', 1, 3, '555-0109', 'Remote', NOW()),
(23, 23, 'Junior Software Engineer', 1, 3, '555-0123', 'San Francisco', NOW()),

-- Sales Department - Manager (reports to Peoplesoft Hr - employee_id 21) and Team
(7, 4, 'Sales Manager', 3, 21, '555-0104', 'Chicago', NOW()),
(8, 10, 'Senior Sales Executive', 3, 7, '555-0110', 'Chicago', NOW()),
(9, 11, 'Sales Executive', 3, 7, '555-0111', 'Chicago', NOW()),
(10, 12, 'Sales Executive', 3, 7, '555-0112', 'Remote', NOW()),

-- Marketing Department - Manager (reports to Peoplesoft Hr - employee_id 21) and Team
(11, 5, 'Marketing Manager', 4, 21, '555-0105', 'Los Angeles', NOW()),
(12, 13, 'Marketing Specialist', 4, 11, '555-0113', 'Los Angeles', NOW()),
(13, 14, 'Content Marketing Manager', 4, 11, '555-0114', 'Los Angeles', NOW()),

-- Finance Department - Manager (reports to Peoplesoft Hr - employee_id 21) and Team
(14, 6, 'Finance Manager', 5, 21, '555-0106', 'New York', NOW()),
(15, 15, 'Financial Analyst', 5, 14, '555-0115', 'New York', NOW()),
(16, 16, 'Accountant', 5, 14, '555-0116', 'New York', NOW()),

-- Operations Department - Manager (reports to Peoplesoft Hr - employee_id 21) and Team (4 employees)
(22, 22, 'Operations Manager', 6, 21, '555-0122', 'Austin', NOW()),
(17, 17, 'Operations Specialist', 6, 22, '555-0117', 'Austin', NOW()),
(18, 18, 'Customer Support Lead', 6, 22, '555-0118', 'Austin', NOW()),
(19, 19, 'Operations Coordinator', 6, 22, '555-0119', 'Remote', NOW()),
(20, 20, 'Support Specialist', 6, 22, '555-0120', 'Austin', NOW());

-- Insert Review Cycles
INSERT INTO review_cycles (id, name, period_start, period_end, status, created_at) VALUES
(1, 'Q2 2024 Performance Review', '2024-04-01', '2024-06-30', 'open', NOW()),
(2, 'Q3 2024 Performance Review', '2024-07-01', '2024-09-30', 'open', NOW()),
(3, 'Annual 2024 Performance Review', '2024-01-01', '2024-12-31', 'open', NOW());

-- Insert Goals
INSERT INTO goals (id, user_id, cycle_id, title, description, timeline, progress, status, created_at) VALUES
(1, 7, 2, 'Complete Cloud Migration Project', 'Lead the migration of legacy systems to AWS cloud infrastructure', 'Q4 2024', 65, 'submitted', NOW()),
(2, 7, 2, 'Obtain AWS Solutions Architect Certification', 'Complete certification to enhance cloud expertise', 'Q3 2024', 80, 'submitted', NOW()),
(3, 8, 2, 'Improve Code Review Process', 'Implement automated code review tools and establish best practices', 'Q4 2024', 45, 'draft', NOW()),
(4, 10, 2, 'Increase Q3 Sales by 25%', 'Expand client base and close major enterprise deals', 'Q3 2024', 70, 'submitted', NOW()),
(5, 13, 2, 'Launch New Product Marketing Campaign', 'Develop and execute comprehensive marketing strategy', 'Q4 2024', 30, 'draft', NOW()),
(6, 13, 2, 'Social Media Engagement Growth', 'Increase social media followers by 40%', 'Q4 2024', 55, 'submitted', NOW()),
(7, 15, 2, 'Complete Financial Audit Documentation', 'Prepare comprehensive audit reports for FY2024', 'Q4 2024', 85, 'submitted', NOW()),
(8, 9, 2, 'Mentor Junior Developers', 'Provide guidance and support to 3 junior team members', 'Q4 2024', 50, 'submitted', NOW()),
(9, 21, 2, 'Implement Company-Wide Performance Management System', 'Roll out new performance management framework across all departments', 'Q4 2024', 70, 'submitted', NOW()),
(10, 22, 2, 'Improve Operations Efficiency', 'Implement new workflow automation to increase team productivity by 20%', 'Q4 2024', 40, 'submitted', NOW()),
(11, 23, 2, 'Complete React Development Training', 'Master React framework and build 3 production-ready components', 'Q4 2024', 35, 'draft', NOW()),
(12, 1, 2, 'Enhance Employee Engagement Programs', 'Launch quarterly team building activities and improve retention by 15%', 'Q4 2024', 50, 'submitted', NOW()),
(13, 3, 2, 'Scale Engineering Team', 'Hire 5 new engineers and establish mentorship program', 'Q4 2024', 60, 'submitted', NOW()),
(14, 4, 2, 'Expand Sales Territory', 'Open new market in Southeast region and hire 2 sales representatives', 'Q4 2024', 45, 'submitted', NOW());

-- Insert Leaves
INSERT INTO leaves (id, user_id, start_date, end_date, type, reason, status, approved_by, created_at) VALUES
(1, 7, '2024-08-15', '2024-08-22', 'vacation', 'Family vacation to Europe', 'approved', 3, NOW()),
(2, 8, '2024-07-10', '2024-07-12', 'sick', 'Medical appointment and recovery', 'approved', 3, NOW()),
(3, 10, '2024-09-05', '2024-09-12', 'vacation', 'Annual vacation', 'approved', 4, NOW()),
(4, 11, '2024-07-20', '2024-07-21', 'personal', 'Personal matter', 'approved', 4, NOW()),
(5, 13, '2024-10-10', '2024-10-17', 'vacation', 'Vacation', 'approved', 5, NOW()),
(6, 15, '2024-07-05', '2024-07-06', 'sick', 'Medical leave', 'approved', 6, NOW()),
(7, 9, '2024-11-20', '2024-11-27', 'vacation', 'Thanksgiving holiday', 'approved', 3, NOW()),
(8, 10, '2024-08-01', '2024-08-02', 'personal', 'Family event', 'approved', 4, NOW()),
(9, 1, '2024-09-15', '2024-09-20', 'vacation', 'Personal vacation', 'approved', 21, NOW()),
(10, 22, '2024-11-05', '2024-11-08', 'vacation', 'Family time', 'approved', 21, NOW()),
(11, 23, '2024-08-25', '2024-08-26', 'sick', 'Flu recovery', 'approved', 3, NOW()),
(12, 3, '2024-12-20', '2024-12-27', 'vacation', 'Year-end vacation', 'approved', 21, NOW()),
(13, 17, '2024-10-15', '2024-10-16', 'personal', 'Personal appointment', 'approved', 22, NOW());

-- Insert Performances
INSERT INTO performances (id, user_id, goal, rating, comments, reviewer_id, created_at) VALUES
(1, 7, 'Cloud migration and AWS certification', 5, 'Excellent technical skills and leadership. Successfully delivered cloud migration phase 1 ahead of schedule.', 3, NOW()),
(2, 8, 'Code quality improvements', 4, 'Strong performer with good attention to detail. Shows initiative in improving team processes.', 3, NOW()),
(3, 10, 'Sales targets Q3', 5, 'Consistently exceeds sales targets. Great client relationship management skills.', 4, NOW()),
(4, 11, 'Client relationship management', 4, 'Good performance with room for growth. Needs to improve on project deadline management.', 4, NOW()),
(5, 13, 'Marketing campaigns', 4, 'Creative and strategic thinker. Successfully launched two major campaigns this quarter.', 5, NOW()),
(6, 15, 'Financial analysis and reporting', 4, 'Reliable and accurate work. Good analytical skills and attention to financial details.', 6, NOW()),
(7, 1, 'Employee engagement initiatives', 5, 'Outstanding leadership in HR initiatives. Improved employee satisfaction significantly.', 21, NOW()),
(8, 22, 'Operations management', 4, 'Effective team leadership and good problem-solving abilities. Building a strong operations team.', 21, NOW()),
(9, 23, 'Learning and development', 3, 'Shows potential and eagerness to learn. Needs more experience with complex projects.', 3, NOW()),
(10, 3, 'Team scaling and mentorship', 5, 'Excellent leadership. Successfully grew the engineering team and established strong culture.', 21, NOW()),
(11, 17, 'Operations efficiency', 4, 'Good performance in streamlining operations processes. Reliable team member.', 22, NOW());

-- Insert Self Assessments
INSERT INTO self_assessments (id, user_id, cycle_id, comments, rating, submitted_at) VALUES
(1, 7, 2, 'Led successful cloud migration, mentored 2 junior developers, improved deployment pipeline. Achievements include reducing deployment time by 40% and implementing CI/CD best practices.', 4, NOW()),
(2, 8, 2, 'Implemented code review automation, reduced bug rate by 30%. Successfully delivered 5 major features on time.', 4, NOW()),
(3, 10, 2, 'Closed 15 major deals, exceeded quarterly target by 30%. Built strong relationships with 10 new enterprise clients.', 5, NOW()),
(4, 13, 2, 'Increased social media engagement by 45%, launched successful email campaign with 25% open rate. Created comprehensive content strategy.', 4, NOW()),
(5, 1, 2, 'Successfully launched employee engagement program, improved retention by 18%, and implemented new HRIS system.', 5, NOW()),
(6, 22, 2, 'Established new operations workflows, improved team efficiency by 18%, and successfully managed cross-departmental projects.', 4, NOW()),
(7, 23, 2, 'Completed 3 training courses, contributed to 2 major features, actively participating in code reviews and team meetings.', 3, NOW()),
(8, 3, 2, 'Hired 5 new engineers, established mentorship program, improved team velocity by 25%.', 5, NOW()),
(9, 21, 2, 'Led company-wide HR transformation, implemented new performance management system, achieved 95% employee satisfaction.', 5, NOW());

-- Insert Manager Reviews
INSERT INTO manager_reviews (id, employee_id, reviewer_id, cycle_id, rating, comments, status, reviewed_at) VALUES
(1, 7, 3, 2, 5, 'Outstanding performance. Technical excellence combined with strong leadership. Ready for senior leadership role. Excellent mentor to junior team members.', 'final', NOW()),
(2, 8, 3, 2, 4, 'Solid contributor with high potential. Strong coding skills and good team collaboration. Recommend leadership training to develop presentation skills.', 'final', NOW()),
(3, 10, 4, 2, 5, 'Top performer in sales team. Exceptional client relationship management and strategic thinking. Consider for team lead position in next quarter.', 'final', NOW()),
(4, 13, 5, 2, 4, 'Strong performer with excellent campaign results. Creative approach to marketing challenges. Should focus on improving cross-functional collaboration.', 'draft', NOW()),
(5, 1, 21, 2, 5, 'Exceptional HR leadership. Successfully drove major initiatives and improved company culture. Ready for VP role.', 'final', NOW()),
(6, 22, 21, 2, 4, 'Good leadership skills and team management. Successfully building operations department. Focus on strategic planning in next quarter.', 'draft', NOW()),
(7, 23, 3, 2, 3, 'Promising junior developer with good learning attitude. Needs more experience but shows strong potential for growth.', 'final', NOW()),
(8, 3, 21, 2, 5, 'Outstanding engineering leadership. Built high-performing team and delivered critical projects ahead of schedule.', 'final', NOW()),
(9, 17, 22, 2, 4, 'Reliable team member with strong work ethic. Good problem-solving skills and process improvement mindset.', 'final', NOW());

-- ============================================
-- STEP 3: UPDATE PASSWORDS WITH BCRYPT HASHES
-- ============================================

-- Create temporary table with passwords
CREATE TEMP TABLE user_passwords AS
SELECT 'sarah.johnson@company.com' as email, 'SarahJohnson123' as password
UNION ALL SELECT 'michael.davis@company.com', 'MichaelDavis123'
UNION ALL SELECT 'robert.williams@company.com', 'RobertWilliams123'
UNION ALL SELECT 'jennifer.brown@company.com', 'JenniferBrown123'
UNION ALL SELECT 'david.martinez@company.com', 'DavidMartinez123'
UNION ALL SELECT 'lisa.anderson@company.com', 'LisaAnderson123'
UNION ALL SELECT 'james.taylor@company.com', 'JamesTaylor123'
UNION ALL SELECT 'mary.thomas@company.com', 'MaryThomas123'
UNION ALL SELECT 'john.jackson@company.com', 'JohnJackson123'
UNION ALL SELECT 'patricia.white@company.com', 'PatriciaWhite123'
UNION ALL SELECT 'christopher.harris@company.com', 'ChristopherHarris123'
UNION ALL SELECT 'linda.martin@company.com', 'LindaMartin123'
UNION ALL SELECT 'daniel.thompson@company.com', 'DanielThompson123'
UNION ALL SELECT 'barbara.garcia@company.com', 'BarbaraGarcia123'
UNION ALL SELECT 'matthew.rodriguez@company.com', 'MatthewRodriguez123'
UNION ALL SELECT 'susan.martinez@company.com', 'SusanMartinez123'
UNION ALL SELECT 'anthony.hernandez@company.com', 'AnthonyHernandez123'
UNION ALL SELECT 'jessica.lopez@company.com', 'JessicaLopez123'
UNION ALL SELECT 'mark.gonzalez@company.com', 'MarkGonzalez123'
UNION ALL SELECT 'karen.wilson@company.com', 'KarenWilson123'
UNION ALL SELECT 'peoplesoftent.hr@gmail.com', 'PeopleSoft123'
UNION ALL SELECT 'peoplesoftent.manager@gmail.com', 'PeopleSoft123'
UNION ALL SELECT 'peoplesoftent.employee@gmail.com', 'PeopleSoft123';

-- Update all users with bcrypt hashed passwords
UPDATE users u
SET password_hash = crypt(up.password, gen_salt('bf', 10))
FROM user_passwords up
WHERE u.email = up.email;

-- Drop the temporary table
DROP TABLE user_passwords;

-- ============================================
-- STEP 4: RESET SEQUENCES
-- ============================================

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));
SELECT setval('goals_id_seq', (SELECT MAX(id) FROM goals));
SELECT setval('leaves_id_seq', (SELECT MAX(id) FROM leaves));
SELECT setval('review_cycles_id_seq', (SELECT MAX(id) FROM review_cycles));
SELECT setval('performances_id_seq', (SELECT MAX(id) FROM performances));
SELECT setval('self_assessments_id_seq', (SELECT MAX(id) FROM self_assessments));
SELECT setval('manager_reviews_id_seq', (SELECT MAX(id) FROM manager_reviews));

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify data insertion
SELECT 'Departments' as table_name, COUNT(*) as record_count FROM departments
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Employees', COUNT(*) FROM employees
UNION ALL
SELECT 'Goals', COUNT(*) FROM goals
UNION ALL
SELECT 'Leaves', COUNT(*) FROM leaves
UNION ALL
SELECT 'Review Cycles', COUNT(*) FROM review_cycles
UNION ALL
SELECT 'Performances', COUNT(*) FROM performances
UNION ALL
SELECT 'Self Assessments', COUNT(*) FROM self_assessments
UNION ALL
SELECT 'Manager Reviews', COUNT(*) FROM manager_reviews;

-- Verify passwords are properly hashed
SELECT 
    id, 
    name, 
    email, 
    CASE 
        WHEN password_hash LIKE '$2a$10$%' THEN 'Valid bcrypt hash'
        ELSE 'Invalid hash'
    END as hash_status
FROM users
ORDER BY id;

-- Verify reporting structure
SELECT 
    e.id,
    u.name as employee_name,
    u.role,
    e.designation,
    d.name as department,
    m.name as manager_name,
    mu.role as manager_role
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN departments d ON e.department_id = d.id
LEFT JOIN employees me ON e.manager_id = me.id
LEFT JOIN users m ON me.user_id = m.id
LEFT JOIN users mu ON me.user_id = mu.id
ORDER BY e.manager_id NULLS FIRST, e.id;

-- ============================================
-- DONE!
-- ============================================
-- All data seeded with proper bcrypt password hashes
-- 
-- REPORTING HIERARCHY:
-- Peoplesoft Hr (Chief HR Officer) - Top Level (role: hr)
--   ├─ Sarah Johnson (HR Director) - HR role reporting to Peoplesoft Hr
--   ├─ Michael Davis (HR Manager) - HR role reporting to Peoplesoft Hr
--   ├─ Robert Williams (Engineering Manager) - Manager role reporting to Peoplesoft Hr
--   │   ├─ James Taylor (Senior Software Engineer) - Employee
--   │   ├─ Mary Thomas (Software Engineer) - Employee
--   │   ├─ John Jackson (Software Engineer) - Employee
--   │   └─ Peoplesoft Employee (Junior Software Engineer) - Employee
--   ├─ Jennifer Brown (Sales Manager) - Manager reporting to Peoplesoft Hr
--   │   ├─ Patricia White (Senior Sales Executive) - Employee
--   │   ├─ Christopher Harris (Sales Executive) - Employee
--   │   └─ Linda Martin (Sales Executive) - Employee
--   ├─ David Martinez (Marketing Manager) - Manager reporting to Peoplesoft Hr
--   │   ├─ Daniel Thompson (Marketing Specialist) - Employee
--   │   └─ Barbara Garcia (Content Marketing Manager) - Employee
--   ├─ Lisa Anderson (Finance Manager) - Manager reporting to Peoplesoft Hr
--   │   ├─ Matthew Rodriguez (Financial Analyst) - Employee
--   │   └─ Susan Martinez (Accountant) - Employee
--   └─ Peoplesoft Manager (Operations Manager) - Manager reporting to Peoplesoft Hr
--       ├─ Anthony Hernandez (Operations Specialist) - Employee
--       ├─ Jessica Lopez (Customer Support Lead) - Employee
--       ├─ Mark Gonzalez (Operations Coordinator) - Employee
--       └─ Karen Wilson (Support Specialist) - Employee
--
-- Login credentials:
--   peoplesoftent.hr@gmail.com -> PeopleSoft123 (Chief HR - Top Level)
--   peoplesoftent.manager@gmail.com -> PeopleSoft123 (Operations Manager - 4 employees)
--   peoplesoftent.employee@gmail.com -> PeopleSoft123 (Junior Software Engineer)
--   sarah.johnson@company.com -> SarahJohnson123
--   robert.williams@company.com -> RobertWilliams123
--   james.taylor@company.com -> JamesTaylor123
--   ... and so on