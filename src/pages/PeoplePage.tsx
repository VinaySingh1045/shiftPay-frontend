import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import CompanySelector from '../components/CompanySelector';
import * as XLSX from 'xlsx';

interface Role {
  _id: string;
  name: string;
  wagePerShift: number;
}

interface EmployeeEntry {
  assignmentId: string;
  employee: { _id: string; name: string; email?: string; phone?: string };
  role: Role;
  joiningDate: string;
  status: string;
}

type ModalView = 'none' | 'addEmployee' | 'addRole' | 'bulkImport';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
}

const PeoplePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const companyId = useSelector((state: RootState) => state.auth.activeCompanyId);

  const [employees, setEmployees] = useState<EmployeeEntry[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<ModalView>('none');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false, title: '', message: '', confirmLabel: '', confirmClass: '', onConfirm: () => { }
  });

  const showConfirm = (title: string, message: string, confirmLabel: string, confirmClass: string, onConfirm: () => void) => {
    setConfirm({ open: true, title, message, confirmLabel, confirmClass, onConfirm });
  };

  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRoleId, setEmpRoleId] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'deactivated'>('active');

  const [roleWage, setRoleWage] = useState('');

  const [editRoleModal, setEditRoleModal] = useState<{ open: boolean; assignmentId: string; roleId: string }>({ open: false, assignmentId: '', roleId: '' });
  const [roleSheet, setRoleSheet] = useState<{ open: boolean; value: string; onChange: (val: string) => void }>({ open: false, value: '', onChange: () => {} });

  useEffect(() => {
    if (companyId) fetchData();
    else setLoading(false);
  }, [companyId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, roleRes] = await Promise.all([
        api.get(`/companies/${companyId}/employees?status=${activeTab}`),
        api.get(`/companies/${companyId}/roles`),
      ]);
      setEmployees(empRes.data.employees);
      setRoles(roleRes.data.roles);
    } catch (error) {
      console.error('Failed to fetch people data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/invite-token`);
      const inviteUrl = `${window.location.origin}/invite/${res.data.inviteToken}`;
      await navigator.clipboard.writeText(inviteUrl);
      showToast('Invite link copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to generate invite link', 'error');
    }
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      await api.post(`/companies/${companyId}/employees/${assignmentId}/approve`);
      showToast('Employee approved', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve', 'error');
    }
  };

  const handleDeactivate = async (assignmentId: string) => {
    showConfirm(
      'Deactivate Employee',
      'This employee will be moved to the Inactive list. Their attendance and salary records will be kept.',
      'Deactivate',
      'bg-red-500 hover:bg-red-600 text-white',
      async () => {
        closeConfirm();
        try {
          await api.patch(`/companies/${companyId}/employees/${assignmentId}/deactivate`);
          showToast('Employee deactivated', 'success');
          fetchData();
        } catch (error: any) {
          showToast(error.response?.data?.error || 'Failed to deactivate', 'error');
        }
      }
    );
  };

  const handleReactivate = async (assignmentId: string) => {
    showConfirm(
      'Reactivate Employee',
      'This employee will be restored to the Active roster with all their historical data intact.',
      'Reactivate',
      'bg-teal-700 hover:bg-teal-800 text-white',
      async () => {
        closeConfirm();
        try {
          await api.patch(`/companies/${companyId}/employees/${assignmentId}/reactivate`);
          showToast('Employee reactivated', 'success');
          fetchData();
        } catch (error: any) {
          showToast(error.response?.data?.error || 'Failed to reactivate', 'error');
        }
      }
    );
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empRoleId || !empJoiningDate) return;
    setSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/employees`, {
        name: empName, email: empEmail, phone: empPhone,
        roleId: empRoleId, joiningDate: empJoiningDate,
      });
      setModal('none');
      setEmpName(''); setEmpEmail(''); setEmpPhone(''); setEmpRoleId('');
      fetchData();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to add employee', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName || !roleWage) return;
    setSubmitting(true);
    try {
      await api.post(`/companies/${companyId}/roles`, {
        name: roleName, wagePerShift: Number(roleWage),
      });
      setModal('none');
      setRoleName(''); setRoleWage('');
      fetchData();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to add role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/companies/${companyId}/employees/${editRoleModal.assignmentId}/role`, {
        roleId: editRoleModal.roleId,
      });
      showToast('Role updated successfully', 'success');
      setEditRoleModal({ open: false, assignmentId: '', roleId: '' });
      fetchData();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'email', 'phone', 'role', 'joiningDate'],
      ['Ramesh Kumar', 'ramesh@example.com', '9876543210', 'Worker', '2024-01-15'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, 'shiftpay_import_template.xlsx');
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/companies/${companyId}/employees/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast(res.data.message, 'success');
      if (res.data.errors?.length > 0) {
        res.data.errors.slice(0, 3).forEach((err: string) => showToast(err, 'error'));
      }
      fetchData();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Import failed', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setModal('none');
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { name: 'Home', path: '/manager', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Attendance', path: '/manager/attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'People', path: '/manager/people', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', active: true },
    { name: 'Salary', path: '/manager/salary', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  ];

  if (!companyId) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <p className="text-gray-500">No company selected. Go back to the dashboard.</p>
      <button onClick={() => navigate('/manager')} className="mt-4 text-teal-700 font-semibold">← Go Back</button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 font-sans">
      {/* HEADER */}
      <header className="bg-teal-800 text-white px-4 pt-4 pb-3 rounded-b-2xl shadow-sm">
        {/* Row 1: Title + Primary Action */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">People</h1>
          <div className="flex items-center space-x-2">
            <CompanySelector />
            <button
              onClick={() => {
                if (roles.length === 0) { showToast('Please add a role first.', 'info'); return; }
                setEmpRoleId(roles[0]._id);
                setModal('addEmployee');
              }}
              className="bg-white text-teal-800 text-sm px-4 py-2 rounded-full font-bold flex items-center shadow-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Employee
            </button>
          </div>
        </div>
        {/* Row 2: Secondary Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleShareLink}
            className="flex-1 flex items-center justify-center bg-teal-700/50 border border-teal-600 text-white text-xs font-semibold py-2 rounded-xl"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Share Link
          </button>
          <button
            onClick={() => setModal('addRole')}
            className="flex-1 flex items-center justify-center bg-teal-700/50 border border-teal-600 text-white text-xs font-semibold py-2 rounded-xl"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            + Role
          </button>
          <button
            onClick={() => setModal('bulkImport')}
            className="flex-1 flex items-center justify-center bg-teal-700/50 border border-teal-600 text-white text-xs font-semibold py-2 rounded-xl"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import
          </button>
        </div>
        {/* Search Bar */}
        <div className="mt-3 relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="w-full bg-teal-700/50 border border-teal-600 text-white text-sm py-2 pl-10 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-teal-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-200 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </header>


      {/* CONFIRM MODAL */}
      {confirm.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">{confirm.title}</h2>
            <p className="text-sm text-gray-500 mb-6">{confirm.message}</p>
            <div className="flex space-x-3">
              <button onClick={closeConfirm} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={confirm.onConfirm} className={`flex-1 py-3 font-semibold rounded-xl ${confirm.confirmClass}`}>
                {confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal !== 'none' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6">
            {modal === 'addRole' ? (
              <>
                <h2 className="text-xl font-bold mb-1 text-gray-800">Add Role</h2>
                <p className="text-sm text-gray-500 mb-5">Define a job role and its wage per shift.</p>
                <form onSubmit={handleAddRole} className="space-y-4">
                  <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Role Name (e.g. Worker, Supervisor)" value={roleName} onChange={e => setRoleName(e.target.value)} required />
                  <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" placeholder="Wage per Shift (₹)" value={roleWage} onChange={e => setRoleWage(e.target.value)} required min="0" />
                  <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={() => setModal('none')} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-3 text-white font-semibold bg-teal-700 rounded-xl disabled:opacity-60">{submitting ? 'Saving...' : 'Save Role'}</button>
                  </div>
                </form>
              </>
            ) : modal === 'bulkImport' ? (
              <>
                <h2 className="text-xl font-bold mb-1 text-gray-800">Bulk Import Employees</h2>
                <p className="text-sm text-gray-500 mb-5">Upload an Excel (.xlsx) or CSV file to import multiple employees at once.</p>
                <div className="space-y-4">
                  {/* Step 1: Download template */}
                  <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-teal-800 mb-1">Step 1 — Download Template</p>
                    <p className="text-xs text-teal-600 mb-3">Fill in: name, email, phone, role (must match a role you created), joiningDate (YYYY-MM-DD).</p>
                    <button onClick={downloadTemplate} className="text-sm font-semibold text-teal-700 underline">⬇ Download Template (.xlsx)</button>
                  </div>
                  {/* Step 2: Upload */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Step 2 — Upload Filled File</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleBulkUpload}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-teal-100 file:text-teal-700 file:font-semibold hover:file:bg-teal-200"
                      disabled={importing}
                    />
                    {importing && <p className="text-xs text-gray-500 mt-2">Importing... please wait.</p>}
                  </div>
                  <button type="button" onClick={() => setModal('none')} className="w-full py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1 text-gray-800">Add Employee</h2>
                <p className="text-sm text-gray-500 mb-5">Add an employee directly to this company.</p>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Full Name *" value={empName} onChange={e => setEmpName(e.target.value)} required />
                  <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" type="email" placeholder="Email (for auto-link)" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
                  <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Phone" value={empPhone} onChange={e => setEmpPhone(e.target.value)} />
                  <button 
                    type="button"
                    onClick={() => setRoleSheet({ open: true, value: empRoleId, onChange: setEmpRoleId })}
                    className="w-full border border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-left flex justify-between items-center"
                  >
                    <span className={empRoleId ? 'text-gray-800' : 'text-gray-400'}>
                      {empRoleId ? roles.find(r => r._id === empRoleId)?.name + ` — ₹${roles.find(r => r._id === empRoleId)?.wagePerShift}/shift` : 'Select Role *'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 mb-1">Joining Date *</label>
                    <input className="w-full border border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" type="date" value={empJoiningDate} onChange={e => setEmpJoiningDate(e.target.value)} required />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={() => setModal('none')} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                    <button type="submit" disabled={submitting} className="flex-1 py-3 text-white font-semibold bg-teal-700 rounded-xl disabled:opacity-60">{submitting ? 'Saving...' : 'Add Employee'}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {editRoleModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-1 text-gray-800">Change Role</h2>
            <p className="text-sm text-gray-500 mb-5">Update the role for this employee.</p>
            <form onSubmit={handleEditRole} className="space-y-4">
              <button 
                type="button"
                onClick={() => setRoleSheet({ open: true, value: editRoleModal.roleId, onChange: (val) => setEditRoleModal(m => ({ ...m, roleId: val })) })}
                className="w-full border border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-left flex justify-between items-center"
              >
                <span className={editRoleModal.roleId ? 'text-gray-800' : 'text-gray-400'}>
                  {editRoleModal.roleId ? roles.find(r => r._id === editRoleModal.roleId)?.name + ` — ₹${roles.find(r => r._id === editRoleModal.roleId)?.wagePerShift}/shift` : 'Select Role *'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setEditRoleModal({ open: false, assignmentId: '', roleId: '' })} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-3 text-white font-semibold bg-teal-700 rounded-xl disabled:opacity-60">{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROLE SELECTION BOTTOM SHEET */}
      {roleSheet.open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setRoleSheet({ ...roleSheet, open: false })}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl p-4 pb-8"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.25s ease-out' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="text-base font-bold text-gray-800 mb-4 px-1">Select Role</h2>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {roles.map(r => {
                const isActive = r._id === roleSheet.value;
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => {
                      roleSheet.onChange(r._id);
                      setRoleSheet({ ...roleSheet, open: false });
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white'
                        : 'bg-gray-50 text-gray-800 hover:bg-teal-50 active:bg-teal-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'}`}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-sm block">{r.name}</span>
                        <span className={`text-xs ${isActive ? 'text-teal-100' : 'text-gray-500'}`}>₹{r.wagePerShift} / shift</span>
                      </div>
                    </div>
                    {isActive && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main className="flex-1 px-4 pt-4 space-y-4">
        {/* TABS */}
        <div className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'active' ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'inactive' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Unverified
          </button>
          <button
            onClick={() => setActiveTab('deactivated')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'deactivated' ? 'border-gray-500 text-gray-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Inactive
          </button>
        </div>

        {roles.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto pb-1 mt-2">
            {roles.map(r => (
              <div key={r._id} className="flex-shrink-0 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-full text-sm text-teal-800 font-medium">
                {r.name} · ₹{r.wagePerShift}
              </div>
            ))}
          </div>
        )}


        {loading ? (
          <div className="flex justify-center items-center pt-20 text-gray-400">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <div className={`p-4 rounded-full mb-4 ${activeTab === 'inactive' ? 'bg-orange-100 text-orange-600' : activeTab === 'deactivated' ? 'bg-gray-100 text-gray-500' : 'bg-teal-100 text-teal-600'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              {activeTab === 'inactive' ? 'No Unverified Employees' : activeTab === 'deactivated' ? 'No Inactive Employees' : 'No Employees Yet'}
            </h2>
            <p className="text-gray-500 text-sm max-w-xs">
              {activeTab === 'inactive'
                ? 'Share your invite link to get employees to join.'
                : activeTab === 'deactivated'
                  ? 'Employees who are deactivated will appear here.'
                  : roles.length === 0 ? 'First, add at least one role using the "+ Role" button.' : 'Tap "+ Employee" to add your first team member.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{employees.length} Employee{employees.length !== 1 ? 's' : ''}</p>
            {employees
              .filter(e => e.employee.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(({ assignmentId, employee, role, joiningDate }) => (
              <div key={assignmentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center space-x-4">
                <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {getInitials(employee?.name || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{employee?.name || 'Unknown Employee'}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <span>{role?.name || 'Unknown'} · ₹{role?.wagePerShift}/shift</span>
                    <button 
                      onClick={() => setEditRoleModal({ open: true, assignmentId, roleId: role._id })}
                      className="ml-2 p-1 text-teal-600 hover:bg-teal-50 rounded-full"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                  {employee?.email && <p className="text-xs text-gray-400 truncate">{employee.email}</p>}
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end justify-center space-y-1">
                  {activeTab === 'inactive' ? (
                    <button
                      onClick={() => handleApprove(assignmentId)}
                      className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 shadow-sm"
                    >
                      Approve
                    </button>
                  ) : activeTab === 'deactivated' ? (
                    <button
                      onClick={() => handleReactivate(assignmentId)}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                      title="Reactivate Employee"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-2">
                        <p className="text-xs text-gray-400">Since</p>
                        <p className="text-xs font-semibold text-gray-600">
                          {new Date(joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeactivate(assignmentId)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Deactivate Employee"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10">
        {navItems.map((item, idx) => (
          <button key={idx} onClick={() => navigate(item.path)} className={`flex flex-col items-center p-1 ${'active' in item && item.active ? 'text-teal-700' : 'text-gray-400 hover:text-gray-600'}`}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            <span className="text-[10px] font-semibold">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default PeoplePage;
