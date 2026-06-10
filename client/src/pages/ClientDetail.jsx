import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as clientService from '../services/client.service';
import * as queryService from '../services/query.service';
import * as interviewService from '../services/interview.service';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Plus, 
  MessageSquare, 
  PhoneCall, 
  Activity, 
  FileText,
  Clock
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDate, formatDateTime } from '../utils/formatters';
import { QUERY_CATEGORY, QUERY_STATUS, CLIENT_STATUS } from '../utils/constants';
import toast from 'react-hot-toast';
import './ClientDetail.css';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRecruiter } = useAuth();

  // Client Data & Loading
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queries');

  // Modals state
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Add Query Form fields
  const [queryDescription, setQueryDescription] = useState('');
  const [queryCategory, setQueryCategory] = useState(QUERY_CATEGORY.TECHNICAL);
  const [queryNotes, setQueryNotes] = useState('');
  const [queryErrors, setQueryErrors] = useState({});

  // Log Interview Form fields (no more student - interviews are linked to this client)
  const [intDate, setIntDate] = useState(new Date().toISOString().substring(0, 10));
  const [intRecruiter, setIntRecruiter] = useState('');
  const [intPosition, setIntPosition] = useState('');
  const [intNotes, setIntNotes] = useState('');
  const [intErrors, setIntErrors] = useState({});

  // Fetch client details
  const fetchClientDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientService.getClient(id);
      setClient(response.data.data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Failed to load client details.');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  // Open Modals
  const openQueryModal = () => {
    setQueryDescription('');
    setQueryCategory(QUERY_CATEGORY.TECHNICAL);
    setQueryNotes('');
    setQueryErrors({});
    setIsQueryModalOpen(true);
  };

  const openInterviewModal = () => {
    setIntDate(new Date().toISOString().substring(0, 10));
    setIntRecruiter('');
    setIntPosition('');
    setIntNotes('');
    setIntErrors({});
    setIsInterviewModalOpen(true);
  };

  // Add Query Form Submission
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (queryDescription.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    if (Object.keys(errors).length > 0) {
      setQueryErrors(errors);
      return;
    }

    setModalLoading(true);
    try {
      await queryService.createQuery({
        client_id: id,
        issue_description: queryDescription,
        category: queryCategory,
        notes: queryNotes || null
      });
      toast.success('Query logged successfully!');
      setIsQueryModalOpen(false);
      fetchClientDetails();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to log query.');
    } finally {
      setModalLoading(false);
    }
  };

  // Log Interview Form Submission
  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!intRecruiter.trim()) {
      errors.recruiter = 'Recruiter name is required';
    }
    if (!intDate) {
      errors.date = 'Date is required';
    }
    if (Object.keys(errors).length > 0) {
      setIntErrors(errors);
      return;
    }

    setModalLoading(true);
    try {
      const fullDate = new Date(intDate).toISOString();
      await interviewService.createInterview({
        client_id: id,
        call_date: fullDate,
        recruiter_name: intRecruiter,
        position_applied: intPosition || null,
        call_notes: intNotes || null
      });
      toast.success('Interview logged successfully!');
      setIsInterviewModalOpen(false);
      fetchClientDetails();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to log interview.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving client dossier..." />;
  }

  // Compile timeline data
  const compileTimeline = () => {
    if (!client) return [];
    const queries = (client.queries || []).map((q) => ({
      id: q.id,
      date: q.created_at,
      title: `Query Logged - Category: ${q.category}`,
      description: q.issue_description,
      type: 'query',
    }));
    const interviews = (client.interviews || []).map((i) => ({
      id: i.id,
      date: i.call_date,
      title: `Interview Call by ${i.recruiter_name}`,
      description: `Position: ${i.position_applied || 'N/A'}. Notes: ${i.call_notes || 'N/A'}`,
      type: 'interview',
    }));

    return [...queries, ...interviews].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Columns for Queries tab table
  const queryColumns = [
    {
      key: 'issue_description',
      label: 'Description',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.issue_description}</span>
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <Badge variant={row.category}>{row.category}</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={row.status} showDot>{row.status}</Badge>
    },
    {
      key: 'created_at',
      label: 'Date Logged',
      render: (row) => formatDateTime(row.created_at)
    }
  ];

  // Columns for Interviews tab table
  const interviewColumns = [
    {
      key: 'recruiter_name',
      label: 'Recruiter',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.recruiter_name}</span>
    },
    {
      key: 'position_applied',
      label: 'Position Applied',
      render: (row) => row.position_applied || <span style={{ color: 'var(--text-muted)' }}>N/A</span>
    },
    {
      key: 'call_date',
      label: 'Call Date',
      render: (row) => formatDate(row.call_date)
    },
    {
      key: 'call_notes',
      label: 'Notes Summary',
      render: (row) => <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.call_notes || 'No notes'}</span>
    }
  ];

  const timelineData = compileTimeline();

  return (
    <div className="client-detail-grid page-fade-in">
      {/* Back link */}
      <div>
        <Link to="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Clients Directory</span>
        </Link>
      </div>

      {/* Info Banner */}
      <div className="client-info-banner">
        <div className="client-banner-main">
          <h2 className="client-banner-name">
            {client.name}
            <Badge variant={client.status} showDot>
              {client.status}
            </Badge>
          </h2>
          <div className="client-banner-contacts">
            {client.email && (
              <span>
                <Mail size={14} />
                <a href={`mailto:${client.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{client.email}</a>
              </span>
            )}
            {client.phone && (
              <span>
                <Phone size={14} />
                <a href={`tel:${client.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{client.phone}</a>
              </span>
            )}
            <span>
              <Clock size={14} />
              Dossier created: {formatDate(client.created_at)}
            </span>
          </div>
        </div>

        {isRecruiter && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" icon={PhoneCall} onClick={openInterviewModal}>
              Log Call
            </Button>
            <Button variant="primary" icon={MessageSquare} onClick={openQueryModal}>
              Log Query
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="detail-tabs-nav">
        <button
          className={`tab-nav-btn ${activeTab === 'queries' ? 'active' : ''}`}
          onClick={() => setActiveTab('queries')}
        >
          Queries ({client.queries?.length || 0})
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('interviews')}
        >
          Interview Calls ({client.interviews?.length || 0})
        </button>
        <button
          className={`tab-nav-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline ({timelineData.length})
        </button>
      </div>

      {/* Tab Panel Content */}
      <div className="tab-content-panel">
        {activeTab === 'queries' && (
          <DataTable
            columns={queryColumns}
            data={client.queries}
            emptyTitle="No Queries Found"
            emptyDesc="This client does not have any active or resolved support queries."
          />
        )}

        {activeTab === 'interviews' && (
          <DataTable
            columns={interviewColumns}
            data={client.interviews}
            emptyTitle="No Calls Logged"
            emptyDesc="There are no interview logs recorded for this client."
          />
        )}

        {activeTab === 'timeline' && (
          timelineData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No timeline items recorded yet.
            </div>
          ) : (
            <div className="detail-timeline page-fade-in">
              {timelineData.map((event, idx) => (
                <div key={idx} className={`timeline-event ${event.type}`}>
                  <div className="timeline-event-marker" />
                  <div className="timeline-event-content">
                    <span className="timeline-event-time">
                      {formatDateTime(event.date)}
                    </span>
                    <span className="timeline-event-title">
                      {event.title}
                    </span>
                    <p className="timeline-event-desc">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add Query Modal */}
      <Modal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        title="Log Support Query"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsQueryModalOpen(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleQuerySubmit} loading={modalLoading}>
              Log Query
            </Button>
          </>
        }
      >
        <form onSubmit={handleQuerySubmit}>
          <Select
            label="Category"
            id="query-cat"
            value={queryCategory}
            onChange={(e) => setQueryCategory(e.target.value)}
            disabled={modalLoading}
          >
            <option value={QUERY_CATEGORY.TECHNICAL}>Technical Issue</option>
            <option value={QUERY_CATEGORY.BILLING}>Billing & Fees</option>
            <option value={QUERY_CATEGORY.ACCOUNT}>Account Management</option>
            <option value={QUERY_CATEGORY.OTHER}>Other / General Support</option>
          </Select>

          <Input
            label="Issue Description"
            id="query-desc"
            value={queryDescription}
            onChange={(e) => setQueryDescription(e.target.value)}
            error={queryErrors.description}
            placeholder="Type in a detailed description of the client's concern (min 10 chars)..."
            required
            disabled={modalLoading}
          />

          <div className="form-group">
            <label htmlFor="query-notes" className="form-label">Internal Support Notes</label>
            <textarea
              id="query-notes"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={queryNotes}
              onChange={(e) => setQueryNotes(e.target.value)}
              placeholder="Optional logs, actions taken, or extra context..."
              disabled={modalLoading}
            />
          </div>
        </form>
      </Modal>

      {/* Log Interview Modal */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title="Log Interview Call"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsInterviewModalOpen(false)} disabled={modalLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleInterviewSubmit} loading={modalLoading}>
              Log Call Record
            </Button>
          </>
        }
      >
        <form onSubmit={handleInterviewSubmit}>
          {/* Client info banner — this interview is for THIS client */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            marginBottom: '16px',
            fontSize: '0.85rem',
          }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Client: </span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{client.name}</span>
            {client.email && (
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({client.email})</span>
            )}
          </div>

          <Input
            label="Recruiter Name"
            id="int-recruiter"
            value={intRecruiter}
            onChange={(e) => setIntRecruiter(e.target.value)}
            error={intErrors.recruiter}
            placeholder="Name of recruiter conducting call"
            required
            disabled={modalLoading}
          />

          <Input
            label="Call Date"
            type="date"
            id="int-date"
            value={intDate}
            onChange={(e) => setIntDate(e.target.value)}
            error={intErrors.date}
            required
            disabled={modalLoading}
          />

          <Input
            label="Position Applied For"
            id="int-position"
            value={intPosition}
            onChange={(e) => setIntPosition(e.target.value)}
            placeholder="e.g. Senior Backend Engineer (Optional)"
            disabled={modalLoading}
          />

          <div className="form-group">
            <label htmlFor="int-notes" className="form-label">Call Feedback & Notes</label>
            <textarea
              id="int-notes"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={intNotes}
              onChange={(e) => setIntNotes(e.target.value)}
              placeholder="Candidate feedback, recruiter observations, next steps..."
              disabled={modalLoading}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientDetail;
