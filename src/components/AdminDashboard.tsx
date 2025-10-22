// src/components/AdminDashboard.tsx

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MapPin, Plus, Edit2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import type { User, UserRole } from '../types';

export function AdminDashboard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  
  // State for forms
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showCreateCheckpointForm, setShowCreateCheckpointForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('GATE_OPERATOR');

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return api.admin.getUsers(token);
    },
    enabled: !!token,
  });

  // Fetch checkpoints
  const { data: checkpoints, isLoading: checkpointsLoading, error: checkpointsError } = useQuery({
    queryKey: ['admin-checkpoints'],
    queryFn: async () => {
      if (!token) throw new Error('No token');
      return api.admin.getCheckpoints(token);
    },
    enabled: !!token,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; role: UserRole; password: string; allowed_checkpoints: string[]; supervisor_id?: string }) => {
      if (!token) throw new Error('No token');
      return api.admin.createUser(token, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateUserForm(false);
      setSuccess('User created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create user');
      setTimeout(() => setError(null), 5000);
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      if (!token) throw new Error('No token');
      return api.admin.updateUser(token, userId, { role: newRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      setSuccess('User role updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to update role');
      setTimeout(() => setError(null), 5000);
    },
  });

  // Create checkpoint mutation
  const createCheckpointMutation = useMutation({
    mutationFn: async (checkpointData: { checkpoint_id: string; name: string; location: string }) => {
      if (!token) throw new Error('No token');
      return api.admin.createCheckpoint(token, checkpointData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-checkpoints'] });
      setShowCreateCheckpointForm(false);
      setSuccess('Checkpoint created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create checkpoint');
      setTimeout(() => setError(null), 5000);
    },
  });

  // Get list of supervisors for assignment
  const supervisors = useMemo(() => {
    return users?.filter(u => u.role === 'SUPERVISOR') || [];
  }, [users]);

  // Form handlers
  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedCheckpoints = Array.from(formData.getAll('checkpoints')) as string[];
    const role = formData.get('role') as UserRole;
    const supervisorId = formData.get('supervisor_id') as string;
    
    createUserMutation.mutate({
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: role,
      allowed_checkpoints: selectedCheckpoints,
      supervisor_id: role === 'GATE_OPERATOR' && supervisorId ? supervisorId : undefined,
    });
  };

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleCreateCheckpoint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createCheckpointMutation.mutate({
      checkpoint_id: formData.get('checkpoint_id') as string,
      name: formData.get('name') as string,
      location: formData.get('location') as string,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, roles, and checkpoints</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-800">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">User Management</h2>
              </div>
              <button
                onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                <span>New User</span>
              </button>
            </div>

            {/* Create User Form */}
            {showCreateUserForm && (
              <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="font-bold mb-4 text-indigo-900">Create New User</h3>
                <div className="space-y-3">
                  <input
                    name="username"
                    placeholder="Username"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <select
                    name="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="GATE_OPERATOR">Gate Operator</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  
                  {/* Supervisor Assignment (only for Gate Operators) */}
                  {selectedRole === 'GATE_OPERATOR' && (
                    <div className="border border-gray-300 rounded-lg p-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Supervisor:</label>
                      {supervisors.length === 0 ? (
                        <p className="text-sm text-gray-500">No supervisors available. Create a supervisor first.</p>
                      ) : (
                        <select
                          name="supervisor_id"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">No supervisor (Admin manages)</option>
                          {supervisors.map((sup: User) => (
                            <option key={sup.user_id} value={sup.user_id}>
                              {sup.username} ({sup.user_id})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
                  <div className="border border-gray-300 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Checkpoints:</label>
                    {checkpointsLoading ? (
                      <p className="text-sm text-gray-500">Loading checkpoints...</p>
                    ) : (
                      <div className="space-y-2">
                        {checkpoints?.map(cp => (
                          <label key={cp.checkpoint_id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              name="checkpoints"
                              value={cp.checkpoint_id}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm">{cp.name} ({cp.checkpoint_id})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateUserForm(false)}
                      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Users List */}
            <div>
              <h3 className="font-bold mb-4 text-gray-800">Existing Users</h3>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : usersError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  Failed to load users
                </div>
              ) : users && users.length > 0 ? (
                <div className="space-y-2">
                  {users.map(user => (
                    <div key={user.user_id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{user.username}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            ID: {user.user_id}
                          </div>
                          {user.allowed_checkpoints && user.allowed_checkpoints.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Checkpoints: {user.allowed_checkpoints.join(', ')}
                            </div>
                          )}
                          {user.supervisor_id && (
                            <div className="text-xs text-blue-600 mt-1">
                              Supervisor: {users?.find(u => u.user_id === user.supervisor_id)?.username || user.supervisor_id}
                            </div>
                          )}
                          {user.managed_operators && user.managed_operators.length > 0 && (
                            <div className="text-xs text-green-600 mt-1">
                              Manages: {user.managed_operators.length} operator(s)
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit role"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                      
                      {/* Role Edit Form */}
                      {editingUser?.user_id === user.user_id && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Change Role:</label>
                          <div className="flex space-x-2">
                            <select
                              className="flex-1 p-2 border border-gray-300 rounded-lg"
                              defaultValue={user.role}
                              onChange={(e) => handleUpdateRole(user.user_id, e.target.value as UserRole)}
                            >
                              <option value="GATE_OPERATOR">Gate Operator</option>
                              <option value="SUPERVISOR">Supervisor</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
          </div>
        </div>

        {/* Checkpoint Management Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MapPin className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Checkpoint Management</h2>
              </div>
              <button
                onClick={() => setShowCreateCheckpointForm(!showCreateCheckpointForm)}
                className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={18} />
                <span>New Checkpoint</span>
              </button>
            </div>

            {/* Create Checkpoint Form */}
            {showCreateCheckpointForm && (
              <form onSubmit={handleCreateCheckpoint} className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="font-bold mb-4 text-indigo-900">Create New Checkpoint</h3>
                <div className="space-y-3">
                  <input
                    name="checkpoint_id"
                    placeholder="Checkpoint ID (e.g., CP-NORTH-01)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <input
                    name="name"
                    placeholder="Checkpoint Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <input
                    name="location"
                    placeholder="Location/Description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={createCheckpointMutation.isPending}
                      className="flex-1 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {createCheckpointMutation.isPending ? 'Creating...' : 'Create Checkpoint'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateCheckpointForm(false)}
                      className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Checkpoints List */}
            <div>
              <h3 className="font-bold mb-4 text-gray-800">Existing Checkpoints</h3>
              {checkpointsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-indigo-600" size={32} />
                </div>
              ) : checkpointsError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  Failed to load checkpoints
                </div>
              ) : checkpoints && checkpoints.length > 0 ? (
                <div className="space-y-2">
                  {checkpoints.map(checkpoint => (
                    <div key={checkpoint.checkpoint_id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{checkpoint.name}</div>
                          <div className="text-sm text-gray-600 mt-1">ID: {checkpoint.checkpoint_id}</div>
                          <div className="text-sm text-gray-500 mt-1">📍 {checkpoint.location}</div>
                        </div>
                        <MapPin className="text-indigo-600" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No checkpoints found</p>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">System Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold">{users?.length || 0}</div>
                <div className="text-sm opacity-90">Total Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{checkpoints?.length || 0}</div>
                <div className="text-sm opacity-90">Checkpoints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
