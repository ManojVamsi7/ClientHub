import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as clientService from '../services/client.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { Plus, Edit2, Trash2, Search, ExternalLink, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, UserMinus, UserCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, formatPhone } from '../utils/formatters';
import { CLIENT_STATUS, ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import './Clients.css';

const Clients = () => {
  const { user, isRecruiter } = useAuth();
  
  // Data State
  const [activeClients, setActiveClients] = useState([]);
  const [inactiveClients, setInactiveClients] = useState([]);
  const [inactiveTotal, setInactiveTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters and Sorting
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [activeTab, setActiveTab] = useState('active');
  const [domainFilter, setDomainFilter] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('');
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Available domains for filter dropdown
  const [domains, setDomains] = useState([]);
  
  // Pagination
  const { 
    page, 
    limit, 
    total, 
    totalPages, 
    setPage, 
    setPaginationData,
    reset: resetPagination
  } = usePagination(10);

  // Modals & Dialogs State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formStatus, setFormStatus] = useState(CLIENT_STATUS.ACTIVE);
  const [formErrors, setFormErrors] = useState({});

  // CSV Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [parsedClientsData, setParsedClientsData] = useState([]);
  const [parsedClientsCount, setParsedClientsCount] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch domains for filter
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await clientService.getDomains();
        setDomains(response.data.data || []);
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };
    fetchDomains();
  }, [activeClients]); // re-fetch when activeClients change (after import)

  // CSV Parser
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const headerMapping = {
      'name': 'name',
      'client name': 'name',
      'client_name': 'name',
      'clientname': 'name',
      'company': 'name',
      'company name': 'name',
      'company_name': 'name',
      'email': 'email',
      'email address': 'email',
      'email_address': 'email',
      'mail': 'email',
      'phone': 'phone',
      'phone number': 'phone',
      'phone_number': 'phone',
      'contact': 'phone',
      'mobile': 'phone',
      'status': 'status',
      'student_id': 'student_id',
      'studentid': 'student_id',
      'student id': 'student_id',
      'roll number': 'student_id',
      'roll_number': 'student_id',
      'rollnumber': 'student_id',
      'id': 'student_id',
      'domain': 'domain',
      'department': 'domain',
      'dept': 'domain',
      'field': 'domain',
      'specialization': 'domain',
      'role': 'domain',
      'position': 'domain',
    };

    const parsedClients = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let currentVal = '';
      let insideQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim());

      const client = {};
      headers.forEach((header, index) => {
        const dbField = headerMapping[header] || header;
        client[dbField] = values[index] ? values[index].replace(/^["']|["']$/g, '') : null;
      });

      if (client.name && client.name.trim()) {
        parsedClients.push(client);
      }
    }
    return parsedClients;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        setParsedClientsData(parsed);
        setParsedClientsCount(parsed.length);
      } catch (err) {
        toast.error('Failed to parse CSV file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (parsedClientsData.length === 0) {
      toast.error('No valid clients parsed from CSV.');
      return;
    }

    setImportLoading(true);
    try {
      const response = await clientService.importClients(parsedClientsData);
      const { inserted, updated, errors } = response.data.data;

      setImportResults({ inserted, updated, errorCount: errors.length, errors });
      toast.success(`Import complete! ${inserted} added, ${updated} updated.`);

      setImportFile(null);
      setParsedClientsData([]);
      setParsedClientsCount(0);
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchClients();
    } catch (error) {
      console.error(error);
      toast.error('Failed to import clients.');
    } finally {
      setImportLoading(false);
    }
  };

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const baseParams = {
        sort_by: sortColumn,
        order: sortOrder,
      };

      if (debouncedSearch) baseParams.search = debouncedSearch;
      if (domainFilter) baseParams.domain = domainFilter;

      // interviewStatusFilter only applies to active clients
      const activeParams = { ...baseParams };
      if (interviewStatusFilter) activeParams.interview_status = interviewStatusFilter;

      const [activeResponse, inactiveResponse] = await Promise.all([
        clientService.getClients({
          ...activeParams,
          limit,
          offset: (page - 1) * limit,
          status: CLIENT_STATUS.ACTIVE,
        }),
        clientService.getClients({
          ...baseParams,
          limit: 100, // Fetch up to 100 inactive clients
          offset: 0,
          status: CLIENT_STATUS.INACTIVE,
        })
      ]);

      setActiveClients(activeResponse.data.data);
      setPaginationData(activeResponse.data.pagination);
      setInactiveClients(inactiveResponse.data.data);
      setInactiveTotal(inactiveResponse.data.pagination.total);
      
      setSelectedClientIds([]); // Reset selection when page / filters change
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortColumn, sortOrder, debouncedSearch, domainFilter, interviewStatusFilter, setPaginationData]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Reset pagination when filter changes
  useEffect(() => {
    resetPagination();
  }, [debouncedSearch, activeTab, domainFilter, interviewStatusFilter, resetPagination]);

  const handleSort = (columnKey, order) => {
    setSortColumn(columnKey);
    setSortOrder(order);
    resetPagination();
  };

  const handleToggleStatus = async (client, newStatus) => {
    try {
      await clientService.updateClient(client.id, { status: newStatus });
      toast.success(`Client marked as ${newStatus === CLIENT_STATUS.ACTIVE ? 'active' : 'inactive'}!`);
      fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
      toast.error('Failed to update client status.');
    }
  };

  // Open Form Modal (Add or Edit)
  const openFormModal = (client = null) => {
    setFormErrors({});
    if (client) {
      setSelectedClient(client);
      setFormName(client.name);
      setFormEmail(client.email || '');
      setFormPhone(client.phone || '');
      setFormStudentId(client.student_id || '');
      setFormDomain(client.domain || '');
      setFormStatus(client.status);
    } else {
      setSelectedClient(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormStudentId('');
      setFormDomain('');
      setFormStatus(CLIENT_STATUS.ACTIVE);
    }
    setIsFormOpen(true);
  };

  // Handle Form Submission
  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) errors.name = 'Client Name is required';
    if (formEmail.trim() && !/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    const payload = {
      name: formName,
      email: formEmail || null,
      phone: formPhone || null,
      status: formStatus,
      student_id: formStudentId || null,
      domain: formDomain || null,
    };

    try {
      if (selectedClient) {
        await clientService.updateClient(selectedClient.id, payload);
        toast.success('Client updated successfully!');
      } else {
        await clientService.createClient(payload);
        toast.success('Client added successfully!');
      }
      setIsFormOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(error.response?.data?.message || 'Failed to save client.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete Action
  const openDeleteDialog = (client) => {
    setSelectedClient(client);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;
    setDeleteLoading(true);
    try {
      await clientService.deleteClient(selectedClient.id);
      toast.success('Client deleted successfully!');
      setIsDeleteOpen(false);
      setSelectedClientIds((prev) => prev.filter((id) => id !== selectedClient.id));
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedClientIds.length === activeClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(activeClients.map((c) => c.id));
    }
  };

  const handleRowSelectToggle = (id) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((clientId) => clientId !== id) : [...prev, id]
    );
  };

  const openBulkDeleteDialog = () => {
    setIsBulkDeleteOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedClientIds.length === 0) return;
    setDeleteLoading(true);
    try {
      await clientService.bulkDeleteClients(selectedClientIds);
      toast.success(`${selectedClientIds.length} clients deleted successfully!`);
      setIsBulkDeleteOpen(false);
      setSelectedClientIds([]);
      fetchClients();
    } catch (error) {
      console.error('Error bulk deleting clients:', error);
      toast.error('Failed to delete selected clients.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Active Columns Definition
  const activeColumns = [
    ...(user?.role === ROLES.ADMIN ? [{
      key: 'select',
      label: (
        <input 
          type="checkbox" 
          checked={activeClients.length > 0 && selectedClientIds.length === activeClients.length}
          onChange={handleSelectAllToggle}
          style={{ cursor: 'pointer' }}
        />
      ),
      sortable: false,
      width: '40px',
      render: (row) => (
        <input 
          type="checkbox" 
          checked={selectedClientIds.includes(row.id)}
          onChange={() => handleRowSelectToggle(row.id)}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer' }}
        />
      )
    }] : []),
    {
      key: 'student_id',
      label: 'Student ID',
      sortable: true,
      render: (row) => row.student_id ? (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.student_id}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to={`/clients/${row.id}`} className="client-name-link">
            {row.name}
          </Link>
          <Link to={`/clients/${row.id}`} style={{ color: 'var(--text-muted)' }} aria-label={`View details for ${row.name}`}>
            <ExternalLink size={12} />
          </Link>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => row.email || <span style={{ color: 'var(--text-muted)' }}>No Email</span>
    },
    {
      key: 'domain',
      label: 'Domain',
      sortable: true,
      render: (row) => row.domain ? (
        <Badge variant="info">{row.domain}</Badge>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status} showDot>
          {row.status}
        </Badge>
      )
    },
    ...(isRecruiter ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="client-actions-cell">
          <Button variant="ghost" size="sm" onClick={() => openFormModal(row)} title="Edit Client">
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(row, CLIENT_STATUS.INACTIVE)} title="Mark Inactive" style={{ color: 'var(--text-secondary)' }}>
            <UserMinus size={14} />
          </Button>
          {user?.role === ROLES.ADMIN && (
            <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => openDeleteDialog(row)} title="Delete Client">
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    }] : [])
  ];

  // Inactive Columns Definition
  const inactiveColumns = [
    {
      key: 'student_id',
      label: 'Student ID',
      sortable: true,
      render: (row) => row.student_id ? (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem' }}>{row.student_id}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to={`/clients/${row.id}`} className="client-name-link" style={{ color: 'var(--text-secondary)' }}>
            {row.name}
          </Link>
          <Link to={`/clients/${row.id}`} style={{ color: 'var(--text-muted)' }} aria-label={`View details for ${row.name}`}>
            <ExternalLink size={12} />
          </Link>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => row.email || <span style={{ color: 'var(--text-muted)' }}>No Email</span>
    },
    {
      key: 'domain',
      label: 'Domain',
      sortable: true,
      render: (row) => row.domain ? (
        <Badge variant="info">{row.domain}</Badge>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>—</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.status} showDot>
          {row.status}
        </Badge>
      )
    },
    ...(isRecruiter ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="client-actions-cell">
          <Button variant="ghost" size="sm" onClick={() => openFormModal(row)} title="Edit Client">
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(row, CLIENT_STATUS.ACTIVE)} title="Reactivate Client" style={{ color: 'var(--success)' }}>
            <UserCheck size={14} />
          </Button>
          {user?.role === ROLES.ADMIN && (
            <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => openDeleteDialog(row)} title="Delete Client">
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      )
    }] : [])
  ];

  return (
    <div className="clients-page-container">
      {/* Header bar */}
      <div className="page-header-row">
        <div className="page-header-title-area">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Clients Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Search and manage client information. Filter by domain to view specific groups.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user?.role === ROLES.ADMIN && selectedClientIds.length > 0 && (
            <Button 
              variant="danger" 
              onClick={openBulkDeleteDialog}
            >
              Delete Selected ({selectedClientIds.length})
            </Button>
          )}
          {isRecruiter && (
            <>
              <Button variant="secondary" icon={Upload} onClick={() => { setIsImportOpen(true); setImportResults(null); }}>
                Import CSV
              </Button>
              <Button variant="primary" icon={Plus} onClick={() => openFormModal()}>
                Add Client
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Top level Active/Inactive Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Clients ({total})
        </button>
        <button 
          className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => setActiveTab('inactive')}
        >
          Inactive Clients ({inactiveTotal})
        </button>
      </div>

      {/* Tabs Row (only for active clients) */}
      {activeTab === 'active' && (
        <div className="clients-tabs-container">
          <button 
            className={`client-tab-btn ${interviewStatusFilter === '' ? 'active' : ''}`}
            onClick={() => setInterviewStatusFilter('')}
          >
            All Clients
          </button>
          <button 
            className={`client-tab-btn ${interviewStatusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setInterviewStatusFilter('scheduled')}
          >
            Interview Scheduled
          </button>
          <button 
            className={`client-tab-btn ${interviewStatusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setInterviewStatusFilter('pending')}
          >
            Pending Placement
          </button>
        </div>
      )}

      {/* Filters Row */}
      <div className="filters-bar">
        <SearchBar 
          value={search} 
          onChange={setSearch} 
          placeholder="Search by name, email, or student ID..." 
        />
        <div className="filters-group">
          <select 
            className="filter-select"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Clients Section */}
      {activeTab === 'active' && (
        <div className="active-clients-section">
          <DataTable
            columns={activeColumns}
            data={activeClients}
            loading={loading}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyTitle="No Active Clients Found"
            emptyDesc="No active clients matched your criteria. Add a new client or import via CSV."
          />
          
          {/* Pagination */}
          {!loading && activeClients.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Pagination
                page={page}
                limit={limit}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Inactive Clients Section */}
      {activeTab === 'inactive' && (
        <div className="inactive-clients-section" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
          <div className="inactive-table-wrapper" style={{ opacity: 1 }}>
            <DataTable
              columns={inactiveColumns}
              data={inactiveClients}
              loading={loading}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={handleSort}
              emptyTitle="No Inactive Clients Found"
              emptyDesc="No inactive clients match the current filters."
            />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedClient ? 'Edit Client Details' : 'Add New Client'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} loading={formLoading}>
              {selectedClient ? 'Update Details' : 'Add Client'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <Input
            label="Student ID"
            id="client-student-id"
            value={formStudentId}
            onChange={(e) => setFormStudentId(e.target.value)}
            placeholder="e.g. STU001"
            disabled={formLoading}
          />
          <Input
            label="Client Name"
            id="client-name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            error={formErrors.name}
            required
            disabled={formLoading}
          />
          <Input
            label="Email Address"
            type="email"
            id="client-email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            error={formErrors.email}
            placeholder="example@corporate.com"
            disabled={formLoading}
          />
          <Input
            label="Phone Number"
            type="tel"
            id="client-phone"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="e.g. 555-0199"
            disabled={formLoading}
          />
          <Input
            label="Domain / Department"
            id="client-domain"
            value={formDomain}
            onChange={(e) => setFormDomain(e.target.value)}
            placeholder="e.g. Data Analyst, Frontend Developer"
            disabled={formLoading}
          />
          <Select
            label="Status"
            id="client-status"
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
            disabled={formLoading}
          >
            <option value={CLIENT_STATUS.ACTIVE}>Active</option>
            <option value={CLIENT_STATUS.INACTIVE}>Inactive</option>
          </Select>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client?"
        description={`This will soft-delete ${selectedClient?.name}. The client's record won't display in list views, but historical queries will remain preserved.`}
        loading={deleteLoading}
      />

      {/* Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Selected Clients?"
        description={`This will soft-delete ${selectedClientIds.length} selected clients. Their records won't display in list views, but historical queries will remain preserved.`}
        confirmText={`Delete ${selectedClientIds.length} Clients`}
        loading={deleteLoading}
      />

      {/* Import CSV Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Clients (CSV)"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportOpen(false)} disabled={importLoading}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleImportSubmit}
              loading={importLoading}
              disabled={parsedClientsData.length === 0 || importLoading}
            >
              Import Clients
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>
              CSV Column Headers:
            </span>
            <code style={{ color: 'var(--primary)', fontWeight: 500 }}>name</code>
            <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>(required)</span>
            <br />
            <span style={{ fontWeight: 600, display: 'block', marginTop: '6px', marginBottom: '4px', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
              Optional columns:
            </span>
            <code style={{ fontSize: '0.78rem' }}>student_id, email, phone, domain, status</code>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Columns like <code>department</code>, <code>id</code>, <code>roll number</code> are automatically mapped.
              Existing clients are matched by student ID or name and updated.
            </div>
          </div>

          <div
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              textAlign: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.2)';
            }}
          >
            <FileSpreadsheet size={36} style={{ margin: '0 auto 12px', color: 'var(--primary)', display: 'block' }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>
              {importFile ? importFile.name : 'Click to select CSV file'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
              {importFile ? `${parsedClientsCount} clients parsed` : 'Supports .csv files'}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              style={{ display: 'none' }}
            />
          </div>

          {parsedClientsData.length > 0 && !importResults && (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Preview ({parsedClientsCount} clients)</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Showing first 5</span>
              </div>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {parsedClientsData.slice(0, 5).map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      {c.student_id && <span style={{ fontFamily: 'monospace', color: 'var(--primary)', marginRight: '8px' }}>{c.student_id}</span>}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {c.domain || ''} {c.email ? `• ${c.email}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResults && (
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid rgba(34, 197, 94, 0.2)',
            }}>
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <CheckCircle2 size={18} style={{ color: 'rgb(74, 222, 128)' }} />
                <span style={{ fontWeight: 700, color: 'rgb(74, 222, 128)', fontSize: '0.9rem' }}>
                  Import Complete
                </span>
              </div>
              <div style={{ padding: '12px 14px', fontSize: '0.85rem', display: 'flex', gap: '20px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Added: </span>
                  <span style={{ fontWeight: 700, color: 'rgb(74, 222, 128)' }}>{importResults.inserted}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Updated: </span>
                  <span style={{ fontWeight: 700, color: 'rgb(250, 204, 21)' }}>{importResults.updated}</span>
                </div>
                {importResults.errorCount > 0 && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Errors: </span>
                    <span style={{ fontWeight: 700, color: 'var(--error)' }}>{importResults.errorCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Clients;
