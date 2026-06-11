const db = require('../config/database');

const getStats = async () => {
  const [
    [{ totalClients }],
    [{ activeClients }],
    [{ openQueries }],
    [{ totalInterviews }],
    [{ highSeverityMistakes }],
    [{ totalMistakes }],
  ] = await Promise.all([
    db('clients').whereNull('deleted_at').count('id as totalClients'),
    db('clients').whereNull('deleted_at').where('status', 'active').count('id as activeClients'),
    db('client_queries')
      .whereNull('deleted_at')
      .whereIn('status', ['open', 'in_progress'])
      .count('id as openQueries'),
    db('interview_calls').whereNull('deleted_at').count('id as totalInterviews'),
    db('recruiter_mistakes')
      .whereNull('deleted_at')
      .where('severity', 'high')
      .count('id as highSeverityMistakes'),
    db('recruiter_mistakes').whereNull('deleted_at').count('id as totalMistakes'),
  ]);

  return {
    totalClients: parseInt(totalClients),
    activeClients: parseInt(activeClients),
    openQueries: parseInt(openQueries),
    totalInterviews: parseInt(totalInterviews),
    highSeverityMistakes: parseInt(highSeverityMistakes),
    totalMistakes: parseInt(totalMistakes),
  };
};

const getRecruiterPerformance = async () => {
  const mistakes = await db('recruiter_mistakes')
    .whereNull('deleted_at')
    .select('recruiter_name', 'severity')
    .count('id as count')
    .groupBy('recruiter_name', 'severity')
    .orderBy('recruiter_name');

  // Reshape into { recruiter_name, low, medium, high, total }
  const recruiterMap = {};
  mistakes.forEach((row) => {
    if (!recruiterMap[row.recruiter_name]) {
      recruiterMap[row.recruiter_name] = {
        recruiter_name: row.recruiter_name,
        low: 0,
        medium: 0,
        high: 0,
        total: 0,
      };
    }
    const count = parseInt(row.count);
    recruiterMap[row.recruiter_name][row.severity] = count;
    recruiterMap[row.recruiter_name].total += count;
  });

  return Object.values(recruiterMap).sort((a, b) => b.total - a.total);
};

const getQueryStatusBreakdown = async () => {
  const breakdown = await db('client_queries')
    .whereNull('deleted_at')
    .select('status')
    .count('id as count')
    .groupBy('status');

  return breakdown.map((row) => ({
    status: row.status,
    count: parseInt(row.count),
  }));
};

const getInterviewTimeline = async () => {
  // Get interviews grouped by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const isSqlite = db.client.config.client === 'sqlite3';
  const monthSelector = isSqlite 
    ? "strftime('%Y-%m', call_date) as month" 
    : "to_char(call_date, 'YYYY-MM') as month";
  const monthGroup = isSqlite 
    ? "strftime('%Y-%m', call_date)" 
    : "to_char(call_date, 'YYYY-MM')";

  const timeline = await db('interview_calls')
    .whereNull('deleted_at')
    .where('call_date', '>=', sixMonthsAgo.toISOString())
    .select(
      db.raw(monthSelector),
      db.raw('count(id) as count')
    )
    .groupBy(db.raw(monthGroup))
    .orderBy('month');

  return timeline.map((row) => ({
    month: row.month,
    count: parseInt(row.count),
  }));
};

const getRecentActivity = async (limit = 10) => {
  const isSqlite = db.client.config.client === 'sqlite3';
  const concatSql = isSqlite 
    ? "'Interview with ' || i.recruiter_name as description" 
    : "concat('Interview with ', i.recruiter_name) as description";

  // Combine recent items from all tables
  const [recentQueries, recentInterviews, recentMistakes] = await Promise.all([
    db('client_queries as q')
      .leftJoin('clients as c', 'q.client_id', 'c.id')
      .whereNull('q.deleted_at')
      .select(
        'q.id',
        'q.created_at',
        'c.name as client_name',
        'q.status',
        db.raw("'query' as type"),
        'q.issue_description as description'
      )
      .orderBy('q.created_at', 'desc')
      .limit(limit),
    db('interview_calls as i')
      .leftJoin('clients as c', 'i.client_id', 'c.id')
      .whereNull('i.deleted_at')
      .select(
        'i.id',
        'i.created_at',
        'c.name as client_name',
        db.raw("'completed' as status"),
        db.raw("'interview' as type"),
        db.raw(concatSql)
      )
      .orderBy('i.created_at', 'desc')
      .limit(limit),
    db('recruiter_mistakes as m')
      .whereNull('m.deleted_at')
      .select(
        'm.id',
        'm.created_at',
        'm.recruiter_name as client_name',
        'm.severity as status',
        db.raw("'mistake' as type"),
        'm.mistake_description as description'
      )
      .orderBy('m.created_at', 'desc')
      .limit(limit),
  ]);

  // Merge and sort by created_at
  const all = [...recentQueries, ...recentInterviews, ...recentMistakes]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);

  return all;
};

const getDomainInterviews = async () => {
  const breakdown = await db('interview_calls as ic')
    .join('clients as c', 'ic.client_id', 'c.id')
    .whereNull('ic.deleted_at')
    .whereNull('c.deleted_at')
    .whereNotNull('c.domain')
    .where('c.domain', '!=', '')
    .select('c.domain')
    .count('ic.id as count')
    .groupBy('c.domain')
    .orderBy('count', 'desc');

  return breakdown.map((row) => ({
    name: row.domain,
    value: parseInt(row.count),
  }));
};

module.exports = {
  getStats,
  getRecruiterPerformance,
  getQueryStatusBreakdown,
  getInterviewTimeline,
  getRecentActivity,
  getDomainInterviews,
};
