const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clean all tables in correct order (respect foreign keys)
  await knex('recruiter_mistakes').del();
  await knex('interview_calls').del();
  await knex('client_queries').del();
  await knex('clients').del();
  await knex('students').del();
  await knex('users').del();

  // ── USERS ──
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const recruiterPassword = await bcrypt.hash('Recruit123!', 10);
  const viewerPassword = await bcrypt.hash('Viewer123!', 10);

  const adminId = uuidv4();
  const recruiter1Id = uuidv4();
  const recruiter2Id = uuidv4();
  const viewerId = uuidv4();

  await knex('users').insert([
    { id: adminId, username: 'admin', email: 'admin@example.com', password: hashedPassword, role: 'admin' },
    { id: recruiter1Id, username: 'sarah_recruiter', email: 'sarah@example.com', password: recruiterPassword, role: 'recruiter' },
    { id: recruiter2Id, username: 'mike_recruiter', email: 'mike@example.com', password: recruiterPassword, role: 'recruiter' },
    { id: viewerId, username: 'viewer_user', email: 'viewer@example.com', password: viewerPassword, role: 'viewer' },
  ]);

  // ── CLIENTS (20) ──
  const clientIds = Array.from({ length: 20 }, () => uuidv4());
  const clientNames = [
    'Acme Corporation', 'TechVista Solutions', 'GlobalReach Industries', 'NovaStar Systems',
    'Pinnacle Dynamics', 'BlueSky Analytics', 'Quantum Edge Labs', 'SilverLine Consulting',
    'DataPulse Inc', 'GreenField Technologies', 'Apex Ventures', 'Horizon Digital',
    'Ironclad Security', 'Velocity Partners', 'Catalyst Innovation', 'NexGen Software',
    'BrightPath Consulting', 'StratoCloud Services', 'PrimeForce Solutions', 'ClearView Analytics',
  ];

  const clients = clientIds.map((id, i) => ({
    id,
    name: clientNames[i],
    email: `contact@${clientNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
    phone: `+1-${String(200 + i).padStart(3, '0')}-${String(5550100 + i * 11).slice(0, 7)}`,
    status: i < 16 ? 'active' : 'inactive',
    created_at: new Date(Date.now() - (20 - i) * 7 * 86400000).toISOString(),
  }));

  await knex('clients').insert(clients);

  // ── STUDENTS (5) ──
  const studentIds = Array.from({ length: 5 }, () => uuidv4());
  const studentData = [
    { id: studentIds[0], student_id: '326', name: 'Abhinav Reddy', email: 're.abhinavreddy@gmail.com', department: 'AI ML Engineer', years_of_experience: 'AI ML Remote' },
    { id: studentIds[1], student_id: '214', name: 'Ajith Kumar Linga', email: 'ajithchowdary784@gmail.com', department: 'Java Full Stack Developer', years_of_experience: '4' },
    { id: studentIds[2], student_id: '364', name: 'Akhil Reddy.K', email: 'akhilreddyk1578@gmail.com', department: 'Data Engineer', years_of_experience: '4' },
    { id: studentIds[3], student_id: '307', name: 'Akshita Srikanth', email: 'akshitasrikanth298@gmail.com', department: 'Java Full Stack Developer', years_of_experience: '4' },
    { id: studentIds[4], student_id: '247', name: 'Akshitha Deekonda', email: 'akshithad0501@gmail.com', department: 'Data Analyst', years_of_experience: '5' },
  ];

  await knex('students').insert(studentData);

  // ── CLIENT QUERIES (35) ──
  const categories = ['technical', 'billing', 'account', 'other'];
  const statuses = ['open', 'in_progress', 'resolved', 'closed'];
  const queryDescriptions = [
    'Unable to access the dashboard after recent update, getting 403 error',
    'Monthly billing statement shows duplicate charges for last month',
    'Need to update primary account contact information and billing address',
    'API integration returning timeout errors during peak hours',
    'Request to upgrade subscription from Basic to Enterprise plan',
    'SSO configuration not working with Azure Active Directory',
    'Data export functionality broken for reports over 10000 rows',
    'Need assistance with custom report builder configuration',
    'Invoice discrepancy for Q3 - charged for unused premium features',
    'Account access issues after employee offboarding process',
    'Performance degradation noticed on real-time analytics dashboard',
    'Need help migrating data from legacy system to new platform',
    'Webhook notifications not triggering for status change events',
    'Request for additional user licenses under current agreement',
    'Database sync issues between staging and production environments',
    'Billing cycle change request from monthly to annual subscription',
    'Custom dashboard widgets not rendering on mobile devices',
    'Need API documentation for the new v3 endpoints released last week',
    'Account permissions not propagating correctly to sub-accounts',
    'Automated report scheduler sending duplicate emails to recipients',
    'Request for compliance audit trail export for SOC2 certification',
    'Integration with Salesforce CRM showing data mapping errors',
    'Mobile app crashing on iOS 17 when accessing client profiles',
    'Need to configure IP whitelisting for API access control',
    'Billing adjustment needed for service downtime credit on March 15th',
    'User role permissions not matching the configured access levels',
    'Need training session for new team members on analytics features',
    'CSV import failing for files with special characters in headers',
    'Account lockout after multiple failed two-factor authentication attempts',
    'Custom email template rendering issues in Outlook clients',
    'Need to set up automated backup schedule for client databases',
    'API rate limiting too aggressive for our batch processing needs',
    'Dashboard loading time exceeds 10 seconds for large datasets',
    'Need assistance configuring SAML-based authentication flow',
    'Request for dedicated account manager for Enterprise tier support',
  ];

  const queryData = queryDescriptions.map((desc, i) => ({
    id: uuidv4(),
    client_id: clientIds[i % 20],
    issue_description: desc,
    category: categories[i % 4],
    status: statuses[i % 4],
    notes: i % 3 === 0 ? 'Follow-up scheduled with the client for next week' : null,
    created_by: i % 2 === 0 ? recruiter1Id : recruiter2Id,
    created_at: new Date(Date.now() - (35 - i) * 2 * 86400000).toISOString(),
  }));

  await knex('client_queries').insert(queryData);

  // ── INTERVIEW CALLS (28) ──
  const recruiterNames = ['Sarah Thompson', 'Mike Johnson', 'Lisa Chen', 'David Park', 'Emma Wilson'];
  const positions = [
    'Senior Software Engineer', 'Product Manager', 'Data Analyst', 'DevOps Engineer',
    'UX Designer', 'Full Stack Developer', 'QA Lead', 'Cloud Architect',
    'Marketing Manager', 'Sales Representative', 'HR Coordinator', 'Project Manager',
  ];

  const interviewData = Array.from({ length: 28 }, (_, i) => ({
    id: uuidv4(),
    client_id: clientIds[i % 20],
    student_id: studentIds[i % 5],
    call_date: new Date(Date.now() - (28 - i) * 5 * 86400000).toISOString(),
    recruiter_name: recruiterNames[i % 5],
    position_applied: positions[i % 12],
    call_notes: `Discussed ${positions[i % 12]} role. Candidate ${i % 3 === 0 ? 'shows strong potential' : i % 3 === 1 ? 'needs further evaluation' : 'recommended for next round'}. Technical skills are ${i % 2 === 0 ? 'excellent' : 'adequate'}.`,
    created_at: new Date(Date.now() - (28 - i) * 5 * 86400000).toISOString(),
  }));

  await knex('interview_calls').insert(interviewData);

  // ── RECRUITER MISTAKES (18) ──
  const severities = ['low', 'medium', 'high'];
  const mistakeDescriptions = [
    'Sent offer letter with incorrect salary figure to candidate',
    'Forgot to schedule follow-up interview within the agreed timeline',
    'Mixed up candidate profiles and sent wrong feedback to hiring manager',
    'Failed to verify candidate references before extending verbal offer',
    'Double-booked interview slots causing scheduling conflicts for panel members',
    'Missed updating candidate status in ATS after phone screening round',
    'Shared confidential salary bands with external recruitment agency partner',
    'Forgot to send rejection emails to candidates who completed final round',
    'Used outdated job description for a role that had been revised last month',
    'Failed to collect signed NDA before sharing project details with contractor',
    'Sent interview invitation to wrong email address, candidate missed deadline',
    'Did not properly document interview feedback within the 24-hour requirement',
    'Accidentally disclosed another candidates name during reference conversation',
    'Forgot to coordinate with IT team for new hire equipment setup and access',
    'Used wrong compensation template for international remote position posting',
    'Failed to flag visa sponsorship requirement early in the recruitment pipeline',
    'Scheduled panel interview without confirming availability of key stakeholder',
    'Did not update diversity tracking metrics after completing latest hiring cycle',
  ];

  const mistakeData = mistakeDescriptions.map((desc, i) => ({
    id: uuidv4(),
    recruiter_name: recruiterNames[i % 5],
    mistake_description: desc,
    severity: severities[i % 3],
    impact: i % 2 === 0 ? 'Delayed hiring process by approximately one week' : 'Required additional follow-up and communication to resolve the issue',
    resolution_notes: i % 3 === 0 ? 'Issue resolved. Additional training provided to prevent recurrence.' : null,
    created_by: adminId,
    created_at: new Date(Date.now() - (18 - i) * 4 * 86400000).toISOString(),
  }));

  await knex('recruiter_mistakes').insert(mistakeData);

  console.log('✅ Seed data inserted successfully');
  console.log('   - 4 users (admin/recruiter/viewer)');
  console.log('   - 20 clients');
  console.log('   - 35 client queries');
  console.log('   - 28 interview calls');
  console.log('   - 18 recruiter mistakes');
};
