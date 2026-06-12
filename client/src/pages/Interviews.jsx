import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as interviewService from '../services/interview.service';
import * as clientService from '../services/client.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Trash2, Calendar, FileText, ChevronDown, ChevronUp, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/formatters';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Interviews.css';

const Interviews = () => {
  const { user, isRecruiter } = useAuth();

  // Interviews Data
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clients list for dropdown (shared from Clients section)
  const [clients, setClients] = useState([]);

  // Filter parameters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [clientSearch, setClientSearch] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortColumn, setSortColumn] = useState('call_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Track expanded row IDs
  const [expandedRows, setExpandedRows] = useState({});

  // Pagination hook
  const {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setPaginationData,
    reset: resetPagination,
  } = usePagination(10);

  // Modals & Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [formClientId, setFormClientId] = useState('');
  const [formRecruiterName, setFormRecruiterName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formPosition, setFormPosition] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Client search in form modal
  const [formClientSearch, setFormClientSearch] = useState('');
  const [selectedClientInfo, setSelectedClientInfo] = useState(null);
  const debouncedFormClientSearch = useDebounce(formClientSearch, 300);

  // Fetch interviews
  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        sort_by: sortColumn,
        order: sortOrder,
      };

      if (debouncedSearch) params.recruiter_name = debouncedSearch;
      if (debouncedClientSearch) params.client_search = debouncedClientSearch;
      if (dateFrom) params.date_from = new Date(dateFrom).toISOString();
      if (dateTo) params.date_to = new Date(dateTo).toISOString();

      const response = await interviewService.getInterviews(params);
      const { data, pagination } = response.data;

      setInterviews(data);
      setPaginationData(pagination);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interview logs.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortColumn, sortOrder, debouncedSearch, debouncedClientSearch, dateFrom, dateTo, setPaginationData]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Load clients dynamically for the modal dropdown based on search
  useEffect(() => {
    const fetchClientsForDropdown = async () => {
      if (!isFormOpen) return;
      try {
        const params = { limit: 100 };
        if (debouncedFormClientSearch) {
          params.search = debouncedFormClientSearch;
        }
        const response = await clientService.getClients(params);
        setClients(response.data.data);
      } catch (error) {
        console.error('Error fetching clients for dropdown:', error);
      }
    };

    if (isRecruiter) {
      fetchClientsForDropdown();
    }
  }, [debouncedFormClientSearch, isFormOpen, isRecruiter]);

  // Reset pagination on filter change
  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, debouncedClientSearch, dateFrom, dateTo, resetPagination]);

  const handleSort = (columnKey, order) => {
    setSortColumn(columnKey);
    setSortOrder(order);
    resetPagination();
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open Form Modal
  const openFormModal = () => {
    setFormErrors({});
    setFormClientId('');
    setSelectedClientInfo(null);
    setFormRecruiterName(user?.username || '');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormPosition('');
    setFormNotes('');
    setFormClientSearch('');
    setIsFormOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formClientId) errors.clientId = 'Client selection is required';
    if (!formRecruiterName.trim()) errors.recruiterName = 'Recruiter name is required';
    if (!formDate) errors.date = 'Interview date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check for duplicate interview (same client + same date)
  const checkDuplicate = () => {
    if (!formClientId || !formDate) return false;
    return interviews.some(
      (iv) =>
        iv.client_id === formClientId &&
        iv.call_date &&
        iv.call_date.substring(0, 10) === formDate
    );
  };

  // Submit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Duplicate guard
    if (checkDuplicate()) {
      toast.error(
        `⚠️ An interview for ${selectedClientInfo?.name || 'this client'} on ${formDate} already exists. Change the date or select a different client.`,
        { duration: 5000 }
      );
      return;
    }

    setFormLoading(true);
    const payload = {
      client_id: formClientId,
      recruiter_name: formRecruiterName,
      call_date: new Date(formDate).toISOString(),
      position_applied: formPosition || null,
      call_notes: formNotes || null,
    };

    try {
      await interviewService.createInterview(payload);
      toast.success('Interview logged successfully!');
      setIsFormOpen(false);
      fetchInterviews();
    } catch (error) {
      console.error('Error logging interview:', error);
      toast.error(error.response?.data?.message || 'Failed to log interview.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (interview) => {
    setSelectedInterview(interview);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInterview) return;
    setDeleteLoading(true);
    try {
      await interviewService.deleteInterview(selectedInterview.id);
      toast.success('Interview deleted successfully!');
      setIsDeleteOpen(false);
      fetchInterviews();
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error('Failed to delete interview.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Selected client info is tracked directly as state variable

  // Columns definition
  const columns = [
    {
      key: 'client_student_id',
      label: 'Student ID',
      sortable: false,
      render: (row) => row.client_student_id ? (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.client_student_id}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      ),
    },
    {
      key: 'client_name',
      label: 'Client Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to={`/clients/${row.client_id}`} className="client-name-link" style={{ fontWeight: 600 }}>
            {row.client_name}
          </Link>
          {row.client_email && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.client_email}</span>
          )}
        </div>
      ),
    },
    {
      key: 'position_applied',
      label: 'Position Applied',
      sortable: true,
      render: (row) => row.position_applied || <span style={{ color: 'var(--text-muted)' }}>N/A</span>,
    },
    {
      key: 'call_date',
      label: 'Call Date',
      sortable: true,
      render: (row) => formatDate(row.call_date),
    },
    {
      key: 'call_notes',
      label: 'Notes',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="notes-cell" title={row.call_notes}>
            {row.call_notes || 'No notes logged'}
          </span>
          {row.call_notes && (
            <Button
              variant="ghost"
              size="sm"
              style={{ padding: '2px', minWidth: 'auto', height: 'auto' }}
              onClick={() => toggleRow(row.id)}
              title={expandedRows[row.id] ? 'Collapse Notes' : 'Expand Notes'}
            >
              {expandedRows[row.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          )}
        </div>
      ),
    },
    ...(user?.role === ROLES.ADMIN
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <Button
                variant="ghost"
                size="sm"
                style={{ color: 'var(--error)' }}
                onClick={() => openDeleteDialog(row)}
                title="Delete Call Log"
              >
                <Trash2 size={14} />
              </Button>
            ),
          },
        ]
      : []),
  ];

  // Map data to include expanded sub-rows for React render
  const renderRow = (row, idx) => {
    return (
      <React.Fragment key={row.id || idx}>
        <tr>
          {columns.map((col) => (
            <td key={col.key}>
              {col.render ? col.render(row, idx) : row[col.key] ?? 'N/A'}
            </td>
          ))}
        </tr>
        {expandedRows[row.id] && row.call_notes && (
          <tr className="expandable-notes-row page-fade-in">
            <td colSpan={columns.length}>
              <div className="expanded-notes-box">
                <div className="expanded-notes-title">Interview Call Notes Summary:</div>
                <div>{row.call_notes}</div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="interviews-page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-title-area">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Interview Tracker</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Record interview dates, candidate feedback, and client placement positions. Clients are managed in the Clients section.
          </p>
        </div>
        {isRecruiter && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="primary" icon={Plus} onClick={openFormModal}>
              Log Interview
            </Button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by recruiter..." />
          <SearchBar value={clientSearch} onChange={setClientSearch} placeholder="Search by Client Name..." />
        </div>
        <div className="filters-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '6px 12px' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '6px 12px' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card page-fade-in">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={col.sortable ? 'sortable' : ''}
                    onClick={() => col.sortable && handleSort(col.key, sortColumn === col.key && sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {col.label}
                    {col.sortable && sortColumn === col.key && (sortOrder === 'asc' ? <ChevronUp size={14} className="sort-icon" /> : <ChevronDown size={14} className="sort-icon" />)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 0' }}>
                    No interview calls logged.
                  </td>
                </tr>
              ) : (
                interviews.map((row, idx) => renderRow(row, idx))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && interviews.length > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Log Interview Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Interview Call"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={formLoading}>
              Log Call
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          {/* Client Search & Select */}
          <div className="form-group">
            <label className="form-label">Select Client <span style={{ color: 'var(--error)' }}>*</span></label>
            {/* Wrapper with position:relative so the dropdown anchors to the input */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', marginBottom: '4px' }}>
                <Search size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Search clients by student ID or name..."
                  value={formClientSearch}
                  onChange={(e) => setFormClientSearch(e.target.value)}
                  disabled={formLoading}
                  autoComplete="off"
                />
              </div>
              {/* Dropdown anchored below the input */}
              {formClientSearch.trim() && (
                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-secondary)',
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  marginTop: '2px',
                }}>
                  {clients.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}>
                      No clients found.
                    </div>
                  ) : (
                    clients.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={(e) => {
                          // Use onMouseDown to fire before the input's onBlur
                          e.preventDefault();
                          if (!formLoading) {
                            setFormClientId(c.id);
                            setSelectedClientInfo(c);
                            setFormClientSearch(''); // Clear search to hide dropdown
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: formLoading ? 'default' : 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: formClientId === c.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background-color 0.15s ease',
                          borderLeft: formClientId === c.id ? '3px solid var(--primary)' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (formClientId !== c.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (formClientId !== c.id) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)', flexShrink: 0 }}>
                            {c.student_id || 'No ID'}
                          </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>— {c.name}</span>
                        </div>
                        {formClientId === c.id && (
                          <span style={{
                            color: 'var(--primary)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            marginLeft: '8px',
                            flexShrink: 0,
                          }}>✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {formErrors.clientId && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                {formErrors.clientId}
              </span>
            )}
            {selectedClientInfo && (
              <div style={{
                marginTop: '8px',
                padding: '10px 14px',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <strong style={{ color: 'var(--primary)' }}>Selected:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedClientInfo.student_id || 'No ID'}</span> — {selectedClientInfo.name}
                  {selectedClientInfo.email && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>({selectedClientInfo.email})</span>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormClientId('');
                    setSelectedClientInfo(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                  title="Clear selection"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--error)';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <Input
            label="Recruiter Name"
            id="int-form-recruiter"
            value={formRecruiterName}
            onChange={(e) => setFormRecruiterName(e.target.value)}
            error={formErrors.recruiterName}
            required
            disabled={formLoading}
          />

          <Input
            label="Call Date"
            type="date"
            id="int-form-date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            error={formErrors.date}
            required
            disabled={formLoading}
          />

          <Input
            label="Position Applied For"
            id="int-form-position"
            value={formPosition}
            onChange={(e) => setFormPosition(e.target.value)}
            placeholder="e.g. Frontend developer (Optional)"
            disabled={formLoading}
          />

          <div className="form-group">
            <label htmlFor="int-form-notes" className="form-label">Feedback & Notes</label>
            <textarea
              id="int-form-notes"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Conduct details, candidate impressions, placement next actions..."
              disabled={formLoading}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Call Log?"
        description="This will permanently delete this interview record from client placement timelines."
        loading={deleteLoading}
      />
    </div>
  );
};

export default Interviews;
