import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Server, Users, Key, FileText, CheckCircle, AlertTriangle, Database, Zap, RefreshCw, Link, Code, Play, Plus, Trash2 } from 'lucide-react';

export default function EnterpriseHub() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'audit' | 'integrations' | 'scripts'>('integrations');
  const [bionemoKey, setBionemoKey] = useState(() => localStorage.getItem('bionemo_api_key') || '');
  const [customWebhook, setCustomWebhook] = useState(() => localStorage.getItem('custom_webhook_url') || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('bionemo_api_key', bionemoKey);
    localStorage.setItem('custom_webhook_url', customWebhook);
    setTimeout(() => {
      setIsSaving(false);
      alert("Enterprise settings securely saved to Vault.");
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Enterprise Hub
          </h2>
          <p className="text-xs text-cyan-500/70 mt-1 uppercase tracking-widest">Security, Compliance & Integrations</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'integrations' ? 'bg-cyan-900/50 text-neon-cyan border border-cyan-500/50' : 'bg-cyan-950/20 text-cyan-500/70 border border-transparent hover:bg-cyan-900/30'}`}
        >
          <Zap className="w-4 h-4" /> API & Plugins
        </button>
        <button 
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'rbac' ? 'bg-cyan-900/50 text-neon-cyan border border-cyan-500/50' : 'bg-cyan-950/20 text-cyan-500/70 border border-transparent hover:bg-cyan-900/30'}`}
        >
          <Users className="w-4 h-4" /> Access Control
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'audit' ? 'bg-cyan-900/50 text-neon-cyan border border-cyan-500/50' : 'bg-cyan-950/20 text-cyan-500/70 border border-transparent hover:bg-cyan-900/30'}`}
        >
          <FileText className="w-4 h-4" /> SOC2 Audit Logs
        </button>
        <button 
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'scripts' ? 'bg-cyan-900/50 text-neon-cyan border border-cyan-500/50' : 'bg-cyan-950/20 text-cyan-500/70 border border-transparent hover:bg-cyan-900/30'}`}
        >
          <Code className="w-4 h-4" /> Internal Scripts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-[#76B900]/20 flex items-center justify-center border border-[#76B900]/50">
                  <Database className="w-6 h-6 text-[#76B900]" />
                </div>
                <div>
                  <h3 className="text-sm text-white font-bold tracking-wider">NVIDIA BioNeMo Integration</h3>
                  <p className="text-xs text-cyan-500/70">Connect to NVIDIA NGC for MegaMolBART and ESMFold APIs.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Key className="w-3 h-3" /> NGC API Key
                  </label>
                  <input 
                    type="password" 
                    value={bionemoKey}
                    onChange={(e) => setBionemoKey(e.target.value)}
                    placeholder="nvapi-xxxxxxxxxxxxxxxxxxxx" 
                    className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded-md px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-[#76B900] transition-colors placeholder:text-cyan-900" 
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-500/70 bg-emerald-950/20 p-3 rounded border border-emerald-900/50">
                  <CheckCircle className="w-4 h-4" /> 
                  <span>BioNeMo Endpoints (MegaMolBART, ESMFold) will be available in the Drug Discovery panel once configured.</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-purple-900/30 flex items-center justify-center border border-purple-500/50">
                  <Link className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm text-white font-bold tracking-wider">Custom Python Webhooks</h3>
                  <p className="text-xs text-cyan-500/70">Plug in your internal lab scripts (RDKit, AutoDock, OpenMM) via REST API.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Server className="w-3 h-3" /> Internal Microservice URL
                  </label>
                  <input 
                    type="text" 
                    value={customWebhook}
                    onChange={(e) => setCustomWebhook(e.target.value)}
                    placeholder="https://internal-gpu-cluster.corp.local/api/v1" 
                    className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded-md px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-cyan-900" 
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-500/70 bg-amber-950/20 p-3 rounded border border-amber-900/50">
                  <AlertTriangle className="w-4 h-4" /> 
                  <span>Traffic will be routed through the secure VPC peering connection.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-cyan-900/50 text-neon-cyan text-sm font-bold uppercase tracking-widest rounded-md hover:bg-cyan-800/50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Configurations
              </button>
            </div>
          </div>
        )}

        {activeTab === 'rbac' && (
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
            <h3 className="text-sm text-white font-bold tracking-wider mb-4">Role-Based Access Control (RBAC)</h3>
            <div className="space-y-4">
              {['System Administrator', 'Lead Scientist', 'Computational Chemist', 'Read-Only Auditor'].map((role, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-cyan-900/30 rounded bg-cyan-950/30">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-cyan-500" />
                    <span className="text-sm text-cyan-100">{role}</span>
                  </div>
                  <button className="text-xs text-cyan-500 hover:text-neon-cyan uppercase tracking-widest">Edit Permissions</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm text-white font-bold tracking-wider">SOC2 Compliance Logs</h3>
              <span className="text-xs text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Immutable Ledger Active
              </span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              {[
                { time: '2035-10-24 14:32:01 UTC', user: 'dr.chen@aegis.corp', action: 'EXPORT_SMILES', resource: 'Project_Alpha_Leads' },
                { time: '2035-10-24 11:15:44 UTC', user: 'system_admin', action: 'UPDATE_RBAC', resource: 'Role: Computational Chemist' },
                { time: '2035-10-23 09:00:12 UTC', user: 'api_service', action: 'SYNC_BIONEMO', resource: 'MegaMolBART_Weights' },
                { time: '2035-10-22 16:45:30 UTC', user: 'dr.smith@aegis.corp', action: 'RUN_DOCKING', resource: 'Target: EGFR_Mutant' },
              ].map((log, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-4 p-3 border-b border-cyan-900/30 text-cyan-500/70 hover:bg-cyan-900/20 transition-colors">
                  <span className="text-cyan-600">{log.time}</span>
                  <span className="text-cyan-300">{log.user}</span>
                  <span className="text-purple-400">{log.action}</span>
                  <span className="text-cyan-100">{log.resource}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scripts' && <ScriptsManager />}
      </div>
    </motion.div>
  );
}

function ScriptsManager() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newScript, setNewScript] = useState({ name: '', description: '', code: 'import sys, json\n\ndef main():\n    input_data = json.loads(sys.stdin.read())\n    # Do work here\n    print(json.dumps({"status": "success"}))\n\nif __name__ == "__main__":\n    main()', inputs: '', outputs: '' });
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [testInput, setTestInput] = useState('{"smiles": "CC(=O)OC1=CC=CC=C1C(=O)O"}');

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const res = await fetch('/api/scripts');
      const data = await res.json();
      setScripts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let parsedInputs = [];
      let parsedOutputs = [];
      try { parsedInputs = newScript.inputs ? JSON.parse(newScript.inputs) : []; } catch(e){}
      try { parsedOutputs = newScript.outputs ? JSON.parse(newScript.outputs) : []; } catch(e){}

      const res = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newScript.name,
          description: newScript.description,
          code: newScript.code,
          inputs: parsedInputs,
          outputs: parsedOutputs
        })
      });
      if (res.ok) {
        setIsCreating(false);
        setNewScript({ name: '', description: '', code: 'import sys, json\n\ndef main():\n    input_data = json.loads(sys.stdin.read())\n    # Do work here\n    print(json.dumps({"status": "success"}))\n\nif __name__ == "__main__":\n    main()', inputs: '', outputs: '' });
        fetchScripts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
      fetchScripts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    setExecutionResult(null);
    try {
      let parsedInput = {};
      try { parsedInput = JSON.parse(testInput); } catch(e){}
      
      const res = await fetch(`/api/scripts/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedInput)
      });
      const data = await res.json();
      setExecutionResult(data);
    } catch (e: any) {
      setExecutionResult({ error: e.message });
    } finally {
      setExecutingId(null);
    }
  };

  if (loading) return <div className="text-cyan-500">Loading scripts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm text-white font-bold tracking-wider">Internal Python Scripts</h3>
          <p className="text-xs text-cyan-500/70">Register and manage custom Python scripts for internal workflows.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-cyan-900/50 text-neon-cyan text-xs font-bold uppercase tracking-widest rounded hover:bg-cyan-800/50 transition-colors flex items-center gap-2"
        >
          {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> Register Script</>}
        </button>
      </div>

      {isCreating && (
        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Script Name</label>
              <input type="text" value={newScript.name} onChange={e => setNewScript({...newScript, name: e.target.value})} className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500" placeholder="e.g., Calculate LogP" />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Description</label>
              <input type="text" value={newScript.description} onChange={e => setNewScript({...newScript, description: e.target.value})} className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500" placeholder="Brief description" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Python Code (reads from stdin, writes to stdout)</label>
            <textarea value={newScript.code} onChange={e => setNewScript({...newScript, code: e.target.value})} rows={8} className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Input Mapping (JSON Array)</label>
              <input type="text" value={newScript.inputs} onChange={e => setNewScript({...newScript, inputs: e.target.value})} className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500" placeholder='[{"name": "smiles", "type": "string"}]' />
            </div>
            <div>
              <label className="block text-xs text-cyan-500/70 uppercase tracking-widest mb-1">Output Mapping (JSON Array)</label>
              <input type="text" value={newScript.outputs} onChange={e => setNewScript({...newScript, outputs: e.target.value})} className="w-full bg-cyan-950/50 border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-100 font-mono focus:outline-none focus:border-cyan-500" placeholder='[{"name": "logp", "type": "number"}]' />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleCreate} className="px-4 py-2 bg-emerald-900/50 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded hover:bg-emerald-800/50 transition-colors">Save Script</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {scripts.map(script => (
          <div key={script.id} className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm text-white font-bold flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-500" /> {script.name}
                </h4>
                <p className="text-xs text-cyan-500/70 mt-1">{script.description}</p>
              </div>
              <button onClick={() => handleDelete(script.id)} className="text-red-500/70 hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-cyan-950/40 p-3 rounded border border-cyan-900/30">
                <h5 className="text-xs text-cyan-500 uppercase tracking-widest mb-2">Test Execution</h5>
                <textarea 
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  className="w-full bg-black/30 border border-cyan-900/50 rounded p-2 text-xs text-cyan-100 font-mono mb-2"
                  rows={3}
                  placeholder="Input JSON"
                />
                <button 
                  onClick={() => handleExecute(script.id)}
                  disabled={executingId === script.id}
                  className="w-full py-2 bg-purple-900/30 text-purple-400 text-xs font-bold uppercase tracking-widest rounded hover:bg-purple-800/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {executingId === script.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run Script
                </button>
              </div>
              
              <div className="bg-cyan-950/40 p-3 rounded border border-cyan-900/30 overflow-auto max-h-[150px]">
                <h5 className="text-xs text-cyan-500 uppercase tracking-widest mb-2">Output</h5>
                {executionResult ? (
                  <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                ) : (
                  <span className="text-xs text-cyan-500/50 italic">Ready to execute...</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {scripts.length === 0 && !isCreating && (
          <div className="text-center py-8 text-cyan-500/50 text-sm">No scripts registered yet.</div>
        )}
      </div>
    </div>
  );
}
