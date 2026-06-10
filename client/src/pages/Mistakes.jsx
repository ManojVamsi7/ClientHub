import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as mistakeService from '../services/mistake.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Edit2, Trash2, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MistakeSeverityChart from '../components/charts/MistakeSeverityChart';
import { formatDate } from '../utils/formatters';
import { MISTAKE_SEVERITY, ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Mistakes.css';

const Mistakes = () => {
  const { user, isRecruiter } = useAuth();

  // Mistakes Data
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overall counts for severity chart
  const [severityCounts, setSeverityCounts] = useState({ low: 0, medium: 0, high: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [severityFilter, setSeverityFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMistake, setSelectedMistake] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [formRecruiterName, setFormRecruiterName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSeverity, setFormSeverity] = useState(MISTAKE_SEVERITY.LOW);
  const [formImpact, setFormImpact] = useState('');
  const [formResolution, setFormResolution] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch mistakes
  const fetchMistakes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        sort_by: sortColumn,
        order: sortOrder,
      };

      if (debouncedSearch) params.recruiter_name = debouncedSearch;
      if (severityFilter) params.severity = severityFilter;

      const response = await mistakeService.getMistakes(params);
      const { data, pagination } = response.data;

      setMistakes(data);
      setPaginationData(pagination);

      // Re-calculate or fetch counts for chart from filtered query
      // (For UX, we can compute overall severity counts from all mistakes, or from currently fetched data if API doesn't expose it).
      // Let's do a quick calculation of overall count by requesting all records or using total values from API pagination metadata if possible.
      // Alternatively, we can calculate based on this page's data, or make a quick call.
      // Let's call the list API with a large limit just for severities, or let's calculate from pagination metadata.
      // Actually, since we only need the counts for the top chart, we can fetch all mistakes (limit: 1000) once to get precise chart data!
      // Let's do a quick fetch of overall severities:
      const fullListRes = await mistakeService.getMistakes({ limit: 1000 });
      const allItems = fullListRes.data.data;
      const counts = { low: 0, medium: 0, high: 0 };
      allItems.forEach(item => {
        if (counts[item.severity] !== undefined) {
          counts[item.severity]++;
        }
      });
      setSeverityCounts(counts);

    } catch (error) {
      console.error('Error fetching mistakes:', error);
      toast.error('Failed to load recruiter QA logs.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortColumn, sortOrder, debouncedSearch, severityFilter, setPaginationData]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  // Reset pagination on filter change
  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, severityFilter, resetPagination]);

  const handleSort = (columnKey, order) => {
    setSortColumn(columnKey);
    setSortOrder(order);
    resetPagination();
  };

  // Open Form Modal (Add / Edit)
  const openFormModal = (mistake = null) => {
    setFormErrors({});
    if (mistake) {
      setSelectedMistake(mistake);
      setFormRecruiterName(mistake.recruiter_name);
      setFormDescription(mistake.mistake_description);
      setFormSeverity(mistake.severity);
      setFormImpact(mistake.impact || '');
      setFormResolution(mistake.resolution_notes || '');
    } else {
      setSelectedMistake(null);
      setFormRecruiterName('');
      setFormDescription('');
      setFormSeverity(MISTAKE_SEVERITY.LOW);
      setFormImpact('');
      setFormResolution('');
    }
    setIsFormOpen(true);
  };

  // View Details Modal
  const openViewModal = (mistake) => {
    setSelectedMistake(mistake);
    setIsViewOpen(true);
  };

  // Form validations
  const validateForm = () => {
    const errors = {};
    if (!formRecruiterName.trim()) errors.recruiterName = 'Recruiter name is required';
    if (formDescription.trim().length < 10) {
      errors.description = 'Mistake description must be at least 10 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    const payload = {
      recruiter_name: formRecruiterName,
      mistake_description: formDescription,
      severity: formSeverity,
      impact: formImpact || null,
      resolution_notes: formResolution || null,
    };

    try {
      if (selectedMistake) {
        await mistakeService.updateMistake(selectedMistake.id, payload);
        toast.success('Mistake record updated successfully!');
      } else {
        await mistakeService.createMistake(payload);
        toast.success('QA mistake logged successfully!');
      }
      setIsFormOpen(false);
      fetchMistakes();
    } catch (error) {
      console.error('Error saving mistake:', error);
      toast.error(error.response?.data?.message || 'Failed to save QA record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (mistake) => {
    setSelectedMistake(mistake);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMistake) return;
    setDeleteLoading(true);
    try {
      await mistakeService.deleteMistake(selectedMistake.id);
      toast.success('QA record deleted successfully!');
      setIsDeleteOpen(false);
      fetchMistakes();
    } catch (error) {
      console.error('Error deleting mistake:', error);
      toast.error('Failed to delete QA record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns definition
  const columns = [
    {
      key: 'recruiter_name',
      label: 'Recruiter',
      sortable: true,
      render: (row) => <span style={{ fontWeight: 600 }}>{row.recruiter_name}</span>,
    },
    {
      key: 'mistake_description',
      label: 'Description',
      render: (row) => (
        <span
          className="truncated-desc"
          style={{ maxWidth: '260px' }}
          title="Click to view details"
          onClick={() => openViewModal(row)}
        >
          {row.mistake_description}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (row) => <Badge variant={row.severity}>{row.severity}</Badge>,
    },
    {
      key: 'impact',
      label: 'Business Impact',
      render: (row) => (
        <span className="notes-cell" style={{ maxWidth: '200px' }} title={row.impact}>
          {row.impact || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date Logged',
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    ...(isRecruiter
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="query-actions">
                <Button variant="ghost" size="sm" onClick={() => openFormModal(row)} title="Edit QA Log">
                  <Edit2 size={14} />
                </Button>
                {user?.role === ROLES.ADMIN && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => openDeleteDialog(row)} title="Delete QA Log">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="clients-page-container">
      {/* Top Chart row */}
      <div className="mistakes-top-row">
        <div className="mistakes-page-title-card">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Recruiter QA & Errors</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Audit recruiter issues, interview errors, and process mismatches.
            Keep track of operational risks and business impacts to improve placement conversions.
          </p>
          {isRecruiter && (
            <div style={{ marginTop: '8px' }}>
              <Button variant="primary" icon={Plus} onClick={() => openFormModal()}>
                Log Recruiter Error
              </Button>
            </div>
          )}
        </div>
        <MistakeSeverityChart data={severityCounts} />
      </div>

      {/* Filters bar */}
      <div className="filters-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by recruiter name..." />
        <div className="filters-group">
          <select
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value={MISTAKE_SEVERITY.LOW}>Low</option>
            <option value={MISTAKE_SEVERITY.MEDIUM}>Medium</option>
            <option value={MISTAKE_SEVERITY.HIGH}>High</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={mistakes}
        loading={loading}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No mistakes logged"
        emptyDesc="No recruiter errors matched your search parameters. Clear filters or create a new QA log."
      />

      {/* Pagination */}
      {!loading && mistakes.length > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Add / Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedMistake ? 'Edit Recruiter QA Log' : 'Log Recruiter QA Error'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={formLoading}>
              {selectedMistake ? 'Update Log' : 'Log Error'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <Input
            label="Recruiter Name"
            id="mistake-form-recruiter"
            value={formRecruiterName}
            onChange={(e) => setFormRecruiterName(e.target.value)}
            error={formErrors.recruiterName}
            placeholder="Name of recruiter who made the error"
            required
            disabled={formLoading}
          />

          <Select
            label="Severity"
            id="mistake-form-severity"
            value={formSeverity}
            onChange={(e) => setFormSeverity(e.target.value)}
            disabled={formLoading}
          >
            <option value={MISTAKE_SEVERITY.LOW}>Low Severity</option>
            <option value={MISTAKE_SEVERITY.MEDIUM}>Medium Severity</option>
            <option value={MISTAKE_SEVERITY.HIGH}>High Severity</option>
          </Select>

          <Input
            label="Error Description"
            id="mistake-form-desc"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            error={formErrors.description}
            placeholder="What exactly was the mistake? (min 10 chars)..."
            required
            disabled={formLoading}
          />

          <div className="form-group">
            <label htmlFor="mistake-form-impact" className="form-label">Business Impact / Cost</label>
            <textarea
              id="mistake-form-impact"
              className="form-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
              value={formImpact}
              onChange={(e) => setFormImpact(e.target.value)}
              placeholder="Operational impact or financial consequences, client feedbacks..."
              disabled={formLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mistake-form-resolution" className="form-label">Resolution / Action Plan</label>
            <textarea
              id="mistake-form-resolution"
              className="form-input"
              style={{ minHeight: '60px', resize: 'vertical' }}
              value={formResolution}
              onChange={(e) => setFormResolution(e.target.value)}
              placeholder="Corrective actions taken, training or notes..."
              disabled={formLoading}
            />
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="QA Record Details"
        footer={
          <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
            Close View
          </Button>
        }
      >
        {selectedMistake && (
          <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="form-label">Recruiter Name</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedMistake.recruiter_name}</div>
              </div>
              <div>
                <span className="form-label">Date Logged</span>
                <div style={{ fontSize: '0.95rem' }}>{formatDate(selectedMistake.created_at)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="form-label">Severity Level</span>
                <div>
                  <Badge variant={selectedMistake.severity}>{selectedMistake.severity}</Badge>
                </div>
              </div>
              <div>
                <span className="form-label">Logged By (User ID)</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {selectedMistake.created_by || 'System Seed'}
                </div>
              </div>
            </div>
            <div>
              <span className="form-label">Error Details</span>
              <p style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0
              }}>{selectedMistake.mistake_description}</p>
            </div>
            <div>
              <span className="form-label">Business Impact</span>
              <p style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0,
                color: selectedMistake.impact ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>{selectedMistake.impact || 'No impact notes recorded.'}</p>
            </div>
            <div>
              <span className="form-label">Resolution & Corrective Steps</span>
              <p style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0,
                color: selectedMistake.resolution_notes ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>{selectedMistake.resolution_notes || 'No resolution logged.'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete QA Record?"
        description="This will permanently delete this mistake log. Aggregate charts and recruiter performance values will adjust."
        loading={deleteLoading}
      />
    </div>
  );
};

export default Mistakes;
