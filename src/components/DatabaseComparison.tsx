import React, { useState, useEffect } from 'react';
import { Database, Activity, Dna, AlertTriangle, RefreshCw, Search, Target, FlaskConical, Pill } from 'lucide-react';
import { FormulationResult } from '../services/geminiService';

interface DatabaseComparisonProps {
  formulation: FormulationResult;
  formData: any;
}

export default function DatabaseComparison({ formulation, formData }: DatabaseComparisonProps) {
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [chemblData, setChemblData] = useState<any>(null);
  const [drugbankData, setDrugbankData] = useState<any>(null);
  const [drugbankError, setDrugbankError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatabaseInfo = async () => {
      setLoading(true);
      setDrugbankError(null);
      try {
        // Fetch PubChem Data based on closest medicine or base name
        const compoundToSearch = formulation.closestMedicines?.[0]?.name || formulation.name.split(' ')[0];
        const pubchemRes = await fetch(`/api/database/pubchem?compound=${encodeURIComponent(compoundToSearch)}`);
        if (pubchemRes.ok) {
          const pData = await pubchemRes.json();
          if (pData.found) {
            setPubchemData(pData.data);
          }
        }

        // Fetch DrugBank Data
        const drugbankRes = await fetch(`/api/database/drugbank?compound=${encodeURIComponent(compoundToSearch)}`);
        if (drugbankRes.ok) {
          const dData = await drugbankRes.json();
          if (dData.found) {
            setDrugbankData(dData.data);
          }
        } else if (drugbankRes.status === 401) {
          const errData = await drugbankRes.json();
          setDrugbankError(errData.error || "DRUGBANK_API_KEY required. Please add it to your environment variables.");
        } else {
          setDrugbankError(`DrugBank API Error: ${drugbankRes.statusText}`);
        }

        // Fetch ChEMBL Data based on target receptor or disease
        const targetToSearch = formData?.receptors || formData?.disease || 'kinase';
        const chemblRes = await fetch(`/api/database/chembl?target=${encodeURIComponent(targetToSearch)}`);
        if (chemblRes.ok) {
          const cData = await chemblRes.json();
          if (cData.found) {
            setChemblData(cData.targets);
          }
        }
      } catch (error) {
        console.error("Failed to fetch database comparison data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseInfo();
  }, [formulation, formData]);

  if (loading) {
    return (
      <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px]">
        <RefreshCw className="w-6 h-6 text-neon-cyan animate-spin mb-4" />
        <p className="text-sm text-cyan-500/70 uppercase tracking-widest">Querying Global Databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Database className="w-4 h-4" /> Global Database Comparison
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PubChem Comparison */}
        <div className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-cyan-900/30 pb-2">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">PubChem Match</h4>
          </div>
          
          {pubchemData ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-cyan-500/70 uppercase">Closest Known Compound</div>
                <div className="text-sm text-neon-cyan font-bold">{pubchemData.IUPACName || 'Unknown'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-cyan-500/70 uppercase">Molecular Weight</div>
                  <div className="text-sm text-white">{pubchemData.MolecularWeight} g/mol</div>
                </div>
                <div>
                  <div className="text-xs text-cyan-500/70 uppercase">Formula</div>
                  <div className="text-sm text-white">{pubchemData.MolecularFormula}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-cyan-500/70 uppercase">SMILES</div>
                <div className="text-xs text-cyan-100 font-mono break-all bg-black/30 p-2 rounded border border-cyan-900/30 mt-1">
                  {pubchemData.CanonicalSMILES}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-500/70">
              <AlertTriangle className="w-4 h-4" /> No direct PubChem match found for comparison.
            </div>
          )}
        </div>

        {/* DrugBank Comparison */}
        <div className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-cyan-900/30 pb-2">
            <Pill className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">DrugBank Profile</h4>
          </div>
          
          {drugbankError ? (
            <div className="flex items-center gap-2 text-sm text-red-500/70">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> 
              <span>{drugbankError}</span>
            </div>
          ) : drugbankData ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-cyan-500/70 uppercase">Indication</div>
                <div className="text-sm text-white line-clamp-2" title={drugbankData.indication}>{drugbankData.indication || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-cyan-500/70 uppercase">Mechanism of Action</div>
                <div className="text-sm text-white line-clamp-2" title={drugbankData.mechanism_of_action}>{drugbankData.mechanism_of_action || 'N/A'}</div>
              </div>
              {drugbankData.interactions && drugbankData.interactions.length > 0 && (
                <div>
                  <div className="text-xs text-cyan-500/70 uppercase mb-1">Key Interactions</div>
                  <div className="space-y-1">
                    {drugbankData.interactions.map((interaction: any, idx: number) => (
                      <div key={idx} className="bg-black/30 p-1.5 rounded border border-cyan-900/30 text-xs">
                        <span className="text-neon-cyan font-bold">{interaction.name}:</span> <span className="text-cyan-100/80">{interaction.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-500/70">
              <AlertTriangle className="w-4 h-4" /> No DrugBank profile found for comparison.
            </div>
          )}
        </div>

        {/* ChEMBL Target Comparison */}
        <div className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 border-b border-cyan-900/30 pb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-cyan-100 uppercase tracking-wider">ChEMBL Target Bioactivity</h4>
          </div>
          
          {chemblData && chemblData.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs text-cyan-500/70 uppercase mb-2">Known Targets for {formData?.receptors || formData?.disease}</div>
              {chemblData.map((target: any, idx: number) => (
                <div key={idx} className="bg-black/30 p-2 rounded border border-cyan-900/30">
                  <div className="text-sm text-neon-cyan font-bold truncate" title={target.pref_name}>{target.pref_name}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-cyan-500/70">Type: {target.target_type}</span>
                    <span className="text-xs text-purple-400 font-mono">{target.target_chembl_id}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-500/70">
              <AlertTriangle className="w-4 h-4" /> No ChEMBL target data found for comparison.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
