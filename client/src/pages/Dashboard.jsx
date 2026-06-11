import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as dashboardService from '../services/dashboard.service';
import { 
  Users, 
  MessageSquare, 
  PhoneCall, 
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import QueryStatusChart from '../components/charts/QueryStatusChart';
import InterviewTimelineChart from '../components/charts/InterviewTimelineChart';
import RecruiterPerformanceChart from '../components/charts/RecruiterPerformanceChart';
import DomainInterviewsChart from '../components/charts/DomainInterviewsChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { timeAgo } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    openQueries: 0,
    totalInterviews: 0,
    highSeverityMistakes: 0,
    totalMistakes: 0,
  });
  const [queryBreakdown, setQueryBreakdown] = useState([]);
  const [interviewTimeline, setInterviewTimeline] = useState([]);
  const [recruiterPerf, setRecruiterPerf] = useState([]);
  const [domainInterviews, setDomainInterviews] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          statsRes,
          activityRes,
          timelineRes,
          recruiterRes,
          queryStatusRes,
          domainInterviewsRes
        ] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecentActivity(),
          dashboardService.getInterviewTimeline(),
          dashboardService.getRecruiterPerformance(),
          dashboardService.getQueryStatusBreakdown(),
          dashboardService.getDomainInterviews()
        ]);

        setStats(statsRes.data.data);
        setRecentActivity(activityRes.data.data);
        setInterviewTimeline(timelineRes.data.data);
        setRecruiterPerf(recruiterRes.data.data);
        setQueryBreakdown(queryStatusRes.data.data);
        setDomainInterviews(domainInterviewsRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast.error('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Assembling metrics and charts..." />;
  }

  // Define icon helpers based on feed type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'query':
        return <MessageSquare size={16} />;
      case 'interview':
        return <PhoneCall size={16} />;
      case 'mistake':
        return <AlertTriangle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className="dashboard-grid page-fade-in">
      {/* Hello bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome, {user?.username}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Here is a summary of the current support issues, recruiter QA, and client statuses.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="stat-grid">
        <StatCard 
          label="Total Clients" 
          value={stats.totalClients} 
          icon={Users}
          trend={{ value: `${stats.activeClients} Active`, type: 'up' }}
        />
        <StatCard 
          label="Open Queries" 
          value={stats.openQueries} 
          icon={MessageSquare}
          trend={stats.openQueries > 5 ? { value: 'Needs Action', type: 'down' } : { value: 'Healthy', type: 'up' }}
        />
        <StatCard 
          label="Interviews Completed" 
          value={stats.totalInterviews} 
          icon={PhoneCall}
        />
        <StatCard 
          label="Recruiter Mistakes" 
          value={stats.totalMistakes} 
          icon={AlertTriangle}
          trend={stats.highSeverityMistakes > 0 ? { value: `${stats.highSeverityMistakes} Critical`, type: 'down' } : { value: 'No High Severity', type: 'up' }}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="dashboard-charts-row">
        <QueryStatusChart data={queryBreakdown} />
        <InterviewTimelineChart data={interviewTimeline} />
      </div>

      {/* Charts Row 2 */}
      <div className="dashboard-charts-row">
        <RecruiterPerformanceChart data={recruiterPerf} />
        <DomainInterviewsChart data={domainInterviews} />
      </div>

      {/* Full Row - Recent Activity Feed */}
      <div className="dashboard-full-row">
        {/* Recent Activity Card */}
        <div className="activity-card" style={{ maxHeight: '400px' }}>
          <div className="activity-header">
            <h3 className="activity-title">Recent System Activities</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest updates</span>
          </div>

          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No recent activity logged
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div className="activity-item" key={activity.id + '-' + activity.type}>
                  <div className={`activity-icon-container ${activity.type}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-details">
                    <span className="activity-desc" title={activity.description}>
                      {activity.description}
                    </span>
                    <div className="activity-meta">
                      <span className={`activity-type-badge ${activity.type}`}>
                        {activity.type}
                      </span>
                      <span>•</span>
                      {activity.client_name && (
                        <>
                          <span style={{ color: 'var(--text-secondary)' }}>{activity.client_name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{timeAgo(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
