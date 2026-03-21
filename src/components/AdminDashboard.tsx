import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft, UserCog, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';

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

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
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

    return () => unsubscribe();
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
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/50 border border-cyan-900/50 rounded text-xs text-cyan-400 uppercase tracking-widest">
          <UserCog className="w-4 h-4" />
          <span>User Management</span>
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
    </motion.div>
  );
}
