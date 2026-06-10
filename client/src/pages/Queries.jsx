import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as queryService from '../services/query.service';
import * as clientService from '../services/client.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Edit2, Trash2, HelpCircle, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate } from '../utils/formatters';
import { QUERY_CATEGORY, QUERY_STATUS, ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Queries.css';

const Queries = () => {
  const { user, isRecruiter } = useAuth();

  // Queries Data
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clients list for selector
  const [clients, setClients] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form Fields
  const [formClientId, setFormClientId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState(QUERY_CATEGORY.TECHNICAL);
  const [formStatus, setFormStatus] = useState(QUERY_STATUS.OPEN);
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formClientSearch, setFormClientSearch] = useState('');

  // Filter clients for form dropdown search
  const filteredFormClients = formClientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(formClientSearch.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(formClientSearch.toLowerCase()))
      )
    : clients;

  // Fetch Queries
  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        limit,
        offset: (page - 1) * limit,
        sort_by: sortColumn,
        order: sortOrder,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await queryService.getQueries(params);
      const { data, pagination } = response.data;

      setQueries(data);
      setPaginationData(pagination);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortColumn, sortOrder, debouncedSearch, statusFilter, categoryFilter, setPaginationData]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Load clients list for creation selector
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await clientService.getClients({ limit: 1000 });
        setClients(response.data.data);
      } catch (error) {
        console.error('Error fetching clients for dropdown:', error);
      }
    };

    if (isRecruiter) {
      fetchClients();
    }
  }, [isRecruiter]);

  // Reset pagination on filter change
  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, statusFilter, categoryFilter, resetPagination]);

  const handleSort = (columnKey, order) => {
    setSortColumn(columnKey);
    setSortOrder(order);
    resetPagination();
  };

  // Open Form Modal
  const openFormModal = (query = null) => {
    setFormErrors({});
    setFormClientSearch('');
    if (query) {
      setSelectedQuery(query);
      setFormClientId(query.client_id);
      setFormDescription(query.issue_description);
      setFormCategory(query.category);
      setFormStatus(query.status);
      setFormNotes(query.notes || '');
    } else {
      setSelectedQuery(null);
      setFormClientId('');
      setFormDescription('');
      setFormCategory(QUERY_CATEGORY.TECHNICAL);
      setFormStatus(QUERY_STATUS.OPEN);
      setFormNotes('');
    }
    setIsFormOpen(true);
  };

  // View Details
  const openViewModal = (query) => {
    setSelectedQuery(query);
    setIsViewOpen(true);
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formClientId) errors.clientId = 'Please select a client';
    if (formDescription.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    const payload = {
      client_id: formClientId,
      issue_description: formDescription,
      category: formCategory,
      notes: formNotes || null,
      ...(selectedQuery && { status: formStatus }), // status can only be sent on update
    };

    try {
      if (selectedQuery) {
        // Updates status, notes, category, description
        await queryService.updateQuery(selectedQuery.id, {
          issue_description: formDescription,
          category: formCategory,
          status: formStatus,
          notes: formNotes || null,
        });
        toast.success('Query updated successfully!');
      } else {
        await queryService.createQuery(payload);
        toast.success('Query logged successfully!');
      }
      setIsFormOpen(false);
      fetchQueries();
    } catch (error) {
      console.error('Error saving query:', error);
      toast.error(error.response?.data?.message || 'Failed to save query.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const openDeleteDialog = (query) => {
    setSelectedQuery(query);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedQuery) return;
    setDeleteLoading(true);
    try {
      await queryService.deleteQuery(selectedQuery.id);
      toast.success('Query deleted successfully!');
      setIsDeleteOpen(false);
      fetchQueries();
    } catch (error) {
      console.error('Error deleting query:', error);
      toast.error('Failed to delete query.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Columns definition
  const columns = [
    {
      key: 'client_name',
      label: 'Client',
      sortable: true,
      render: (row) => (
        <Link to={`/clients/${row.client_id}`} className="client-name-link">
          {row.client_name}
        </Link>
      ),
    },
    {
      key: 'issue_description',
      label: 'Issue description',
      render: (row) => (
        <span
          className="truncated-desc"
          title="Click to view details"
          onClick={() => openViewModal(row)}
        >
          {row.issue_description}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (row) => <Badge variant={row.category}>{row.category}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <Badge variant={row.status} showDot>{row.status}</Badge>,
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
                <Button variant="ghost" size="sm" onClick={() => openFormModal(row)} title="Edit Query">
                  <Edit2 size={14} />
                </Button>
                {user?.role === ROLES.ADMIN && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => openDeleteDialog(row)} title="Delete Query">
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
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-title-area">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Support Queries</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Audit client issues, categories, status trackers, and internal resolutions.
          </p>
        </div>
        {isRecruiter && (
          <Button variant="primary" icon={Plus} onClick={() => openFormModal()}>
            Log Support Query
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by client or description..." />
        <div className="filters-group">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value={QUERY_CATEGORY.TECHNICAL}>Technical</option>
            <option value={QUERY_CATEGORY.BILLING}>Billing</option>
            <option value={QUERY_CATEGORY.ACCOUNT}>Account Management</option>
            <option value={QUERY_CATEGORY.OTHER}>Other</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value={QUERY_STATUS.OPEN}>Open</option>
            <option value={QUERY_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={QUERY_STATUS.RESOLVED}>Resolved</option>
            <option value={QUERY_STATUS.CLOSED}>Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={queries}
        loading={loading}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No Queries Found"
        emptyDesc="No queries matched your search parameters. Clear filters or create a new query."
      />

      {/* Pagination */}
      {!loading && queries.length > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedQuery ? 'Update Support Query' : 'Log New Support Query'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={formLoading}>
              {selectedQuery ? 'Update Ticket' : 'Log Query'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          {!selectedQuery ? (
            <div className="form-group">
              <label className="form-label">Select Client <span style={{ color: 'var(--error)' }}>*</span></label>
              <div style={{
                position: 'relative',
                marginBottom: '8px',
              }}>
                <Search size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Search clients by name or email..."
                  value={formClientSearch}
                  onChange={(e) => setFormClientSearch(e.target.value)}
                  disabled={formLoading}
                />
              </div>
              <div style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
              }}>
                {filteredFormClients.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}>
                    No clients found. Add clients in the Clients section first.
                  </div>
                ) : (
                  filteredFormClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => !formLoading && setFormClientId(c.id)}
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
                        if (formClientId !== c.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        if (formClientId !== c.id) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {c.email || 'No email'} {c.phone ? `• ${c.phone}` : ''}
                        </span>
                      </div>
                      {formClientId === c.id && (
                        <span style={{
                          color: 'var(--primary)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}>
                          Selected
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
              {formErrors.clientId && <span className="form-error">{formErrors.clientId}</span>}
            </div>
          ) : (
            <div className="form-group">
              <span className="form-label">Client</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedQuery.client_name}</span>
            </div>
          )}

          <Select
            label="Category"
            id="query-form-cat"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            disabled={formLoading}
          >
            <option value={QUERY_CATEGORY.TECHNICAL}>Technical Issue</option>
            <option value={QUERY_CATEGORY.BILLING}>Billing & Fees</option>
            <option value={QUERY_CATEGORY.ACCOUNT}>Account Management</option>
            <option value={QUERY_CATEGORY.OTHER}>Other / General Support</option>
          </Select>

          {selectedQuery && (
            <Select
              label="Status"
              id="query-form-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              disabled={formLoading}
            >
              <option value={QUERY_STATUS.OPEN}>Open</option>
              <option value={QUERY_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={QUERY_STATUS.RESOLVED}>Resolved</option>
              <option value={QUERY_STATUS.CLOSED}>Closed</option>
            </Select>
          )}

          <Input
            label="Issue Description"
            id="query-form-desc"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            error={formErrors.description}
            placeholder="Type in a detailed description of the client's concern (min 10 chars)..."
            required
            disabled={formLoading}
          />

          <div className="form-group">
            <label htmlFor="query-form-notes" className="form-label">Internal Support Notes</label>
            <textarea
              id="query-form-notes"
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Optional logs, actions taken, or extra context..."
              disabled={formLoading}
            />
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Query Details"
        footer={
          <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
            Close View
          </Button>
        }
      >
        {selectedQuery && (
          <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="form-label">Client</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedQuery.client_name}</div>
              </div>
              <div>
                <span className="form-label">Date Logged</span>
                <div style={{ fontSize: '0.95rem' }}>{formatDate(selectedQuery.created_at)}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="form-label">Category</span>
                <div>
                  <Badge variant={selectedQuery.category}>{selectedQuery.category}</Badge>
                </div>
              </div>
              <div>
                <span className="form-label">Status</span>
                <div>
                  <Badge variant={selectedQuery.status} showDot>{selectedQuery.status}</Badge>
                </div>
              </div>
            </div>
            <div>
              <span className="form-label">Issue Description</span>
              <p style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0
              }}>{selectedQuery.issue_description}</p>
            </div>
            <div>
              <span className="form-label">Internal Support Notes</span>
              <p style={{
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0,
                color: selectedQuery.notes ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>{selectedQuery.notes || 'No notes logged.'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Support Ticket?"
        description="This will permanently delete this client query. Historical data in customer aggregations will be modified."
        loading={deleteLoading}
      />
    </div>
  );
};

export default Queries;
