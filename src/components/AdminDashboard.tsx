import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft, UserCog, AlertTriangle, CheckCircle2, FileText, Activity } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, onSnapshot, orderBy, limit } from 'firebase/firestore';

interface AdminDashboardProps {
  onBack: () => void;
}

interface UserData {
  userId: string;
  email: string;
  displayName?: string;
  professionCategory: string;
  role?: string;
  createdAt?: any;
}

interface AuditLogData {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: any;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogData[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersList: UserData[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as UserData);
      });
      setUsers(usersList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Ensure you have admin privileges.");
      setLoading(false);
    });

    const logsRef = collection(db, 'audit_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsList: AuditLogData[] = [];
      snapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() } as AuditLogData);
      });
      setAuditLogs(logsList);
    }, (err) => {
      console.error("Error fetching audit logs:", err);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string | undefined, newRole: string) => {
    if (currentRole === newRole) return;
    
    // Prevent changing the super admin role
    const userToChange = users.find(u => u.userId === userId);
    if (userToChange?.email === 'gourav.k.24@gmail.com') {
      setError("Cannot modify the super admin's role.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { role: newRole, updatedAt: new Date() }, { merge: true });
      setSuccessMsg(`Role updated successfully for ${userToChange?.email || userId}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error("Error updating role:", err);
      setError("Failed to update role. " + (err.message || ""));
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center font-mono text-neon-cyan">Loading Admin Dashboard...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col font-mono max-w-6xl mx-auto w-full p-4"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 hover:text-neon-cyan hover:border-neon-cyan transition-colors rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-colors ${activeTab === 'users' ? 'bg-cyan-950/50 border border-cyan-900/50 text-cyan-400' : 'text-gray-500 hover:text-cyan-400'}`}
          >
            <UserCog className="w-4 h-4" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-colors ${activeTab === 'audit' ? 'bg-cyan-950/50 border border-cyan-900/50 text-cyan-400' : 'text-gray-500 hover:text-cyan-400'}`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Logs (FDA)</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/50 rounded flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <p>{successMsg}</p>
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="flex-1 overflow-auto border border-cyan-900/30 rounded bg-black/40 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyan-900/50 bg-cyan-950/30">
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Email</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Profession</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900/20">
              {users.map((u) => {
                const isSuperAdmin = u.email === 'gourav.k.24@gmail.com';
                const currentRole = u.role || 'user';
                
                return (
                  <tr key={u.userId} className="hover:bg-cyan-900/10 transition-colors">
                    <td className="p-4">
                      <div className="text-sm text-gray-200">{u.displayName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 font-mono">{u.userId.substring(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{u.email}</td>
                    <td className="p-4 text-sm text-gray-400">{u.professionCategory}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isSuperAdmin ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' :
                        currentRole === 'admin' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 
                        currentRole === 'scientist' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30' :
                        'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {isSuperAdmin ? 'SUPER ADMIN' : currentRole.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {!isSuperAdmin ? (
                        <select
                          value={currentRole}
                          onChange={(e) => handleRoleChange(u.userId, currentRole, e.target.value)}
                          className="bg-cyan-950/50 border border-cyan-900/50 text-cyan-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-neon-cyan"
                        >
                          <option value="user">User</option>
                          <option value="scientist">Scientist</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border-cyan-900/30 rounded bg-black/40 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyan-900/50 bg-cyan-950/30">
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">User ID</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-cyan-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-900/20">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-cyan-900/10 transition-colors">
                  <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Unknown'}
                  </td>
                  <td className="p-4 text-xs text-gray-500 font-mono">{log.userId.substring(0, 8)}...</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-400 font-mono max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
