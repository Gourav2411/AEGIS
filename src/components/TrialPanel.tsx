import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, ShieldAlert, HeartPulse, BrainCircuit, RefreshCw, ChevronRight, CheckCircle2, AlertTriangle, Beaker, LineChart, Users, TrendingUp, Dna, Filter, Globe, FileText, Download, X, Database, Search } from 'lucide-react';
import { TrialResult, FormulationResult, generateClinicalTrialReport, TrialParams } from '../services/geminiService';
import Markdown from 'react-markdown';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface TrialPanelProps {
  result: TrialResult;
  formulation: FormulationResult | null;
  formData: any;
  trialParams?: TrialParams | null;
  onNext: () => void;
  onReset: () => void;
  loading: boolean;
}

export default function TrialPanel({ result, formulation, formData, trialParams, onNext, onReset, loading }: TrialPanelProps) {
  const [reportLoading, setReportLoading] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-neon-green';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const handleGenerateReport = async () => {
    if (!formulation) return;
    setReportLoading(true);
    try {
      const report = await generateClinicalTrialReport(formulation, result, formData, trialParams);
      setReportContent(report);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("Failed to generate report. Please check your API key and try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!reportRef.current) return;
    
    const opt = {
      margin:       10,
      filename:     `CSR_${formulation?.name || 'Drug'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, backgroundColor: '#ffffff' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(reportRef.current).save();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col font-mono"
    >
      <div className="mb-6 border-b border-cyan-900/50 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl text-neon-cyan uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Virtual Trial Simulation
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Globe className="w-3 h-3 text-neon-green animate-pulse" />
            <p className="text-xs text-neon-green/80 uppercase tracking-widest">Simulated using real-world trial data</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Viability Score</div>
          <div className={`text-2xl font-bold tracking-widest ${getScoreColor(result.overallViability)}`}>
            {result.overallViability}%
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading || !formulation}
            className="mt-2 px-3 py-1.5 bg-cyan-950/50 border border-cyan-500/50 text-cyan-400 text-xs uppercase tracking-widest hover:bg-cyan-900/50 hover:text-cyan-200 transition-colors flex items-center gap-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reportLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {reportLoading ? 'Generating...' : 'Generate CSR Report'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Synthetic Control Arm Info */}
        {trialParams?.useSCA && (
          <div className="bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database className="w-24 h-24 text-neon-cyan" />
            </div>
            <h3 className="text-sm text-neon-cyan uppercase tracking-widest flex items-center gap-2 mb-2 font-bold">
              <Database className="w-5 h-5" /> Synthetic Control Arm (SCA) Active
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed max-w-2xl relative z-10">
              A virtual placebo group was generated using anonymized Electronic Health Record (EHR) data. 
              This eliminated the need to recruit <span className="text-neon-green font-bold">{Number(trialParams.cohortSize) / 2}</span> control patients, 
              accelerating the trial timeline by an estimated <span className="text-neon-green font-bold">14 months</span> and reducing costs significantly.
            </p>
          </div>
        )}

        {/* Bayesian Adaptive Design Info */}
        {trialParams?.useAdaptiveDesign && result.adaptiveDesignLog && (
          <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-purple-400" />
            </div>
            <h3 className="text-sm text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-2 font-bold">
              <Activity className="w-5 h-5" /> Bayesian Adaptive Design Active
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed max-w-2xl relative z-10">
              {result.adaptiveDesignLog}
            </p>
          </div>
        )}

        {/* RAG Sources Info */}
        {trialParams?.useRAG && result.ragSources && result.ragSources.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Search className="w-24 h-24 text-blue-400" />
            </div>
            <h3 className="text-sm text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2 font-bold">
              <Search className="w-5 h-5" /> Real-World Grounding (RAG) Active
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed max-w-2xl relative z-10 mb-2">
              Simulation grounded in empirical data from the following sources:
            </p>
            <ul className="list-disc list-inside text-xs text-cyan-500/70 relative z-10">
              {result.ragSources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4" /> In-Silico Success
            </h3>
            <div className="relative h-8 bg-jarvis-bg rounded-md overflow-hidden border border-cyan-900/30">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${getScoreBg(result.inSilicoSuccess)} opacity-80`}
                initial={{ width: 0 }}
                animate={{ width: `${result.inSilicoSuccess}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-lg font-bold text-white drop-shadow-md z-10">{result.inSilicoSuccess}%</span>
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Beaker className="w-4 h-4" /> In-Vitro Success
            </h3>
            <div className="relative h-8 bg-jarvis-bg rounded-md overflow-hidden border border-cyan-900/30">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${getScoreBg(result.inVitroSuccess)} opacity-80`}
                initial={{ width: 0 }}
                animate={{ width: `${result.inVitroSuccess}%` }}
                transition={{ duration: 1, delay: 0.4 }}
              />
              <div className="absolute inset-0 flex items-center justify-end pr-3">
                <span className="text-lg font-bold text-white drop-shadow-md z-10">{result.inVitroSuccess}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toxicity & Side Effects */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Toxicity Profile
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed mb-4">{result.toxicityProfile}</p>
          
          <h4 className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-2">Predicted Side Effects</h4>
          <ul className="space-y-2">
            {result.sideEffects.map((effect, idx) => (
              <li key={idx} className="text-sm px-3 py-2 bg-jarvis-bg border border-red-900/30 text-red-400 rounded flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> 
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pharmacokinetic Profile (ADME) */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
            <LineChart className="w-4 h-4" /> Pharmacokinetic Profile (ADME)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Absorption</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.absorption || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Distribution</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.distribution || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Metabolism</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.metabolism || 'N/A'}</p>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 p-3 rounded">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Excretion</div>
              <p className="text-sm text-cyan-100">{result.pharmacokineticProfile.excretion || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Clinical Projections */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Long-Term Efficacy
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.longTermEfficacy}</p>
        </div>

        {/* Biomarkers & Clearance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Dna className="w-4 h-4" /> Key Biomarkers Tracked
            </h3>
            <ul className="list-disc list-inside text-sm text-cyan-100 space-y-1">
              {result.keyBiomarkers.map((biomarker, idx) => (
                <li key={idx}>{biomarker}</li>
              ))}
            </ul>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Clearance Mechanism
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.clearanceMechanism}</p>
          </div>
        </div>

        {/* Patient Adherence */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> Predicted Patient Adherence
            </h3>
            <span className={`text-lg font-bold ${getScoreColor(result.patientAdherenceScore)}`}>{result.patientAdherenceScore}%</span>
          </div>
          <div className="h-1.5 bg-jarvis-bg rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${getScoreBg(result.patientAdherenceScore)}`}
              initial={{ width: 0 }}
              animate={{ width: `${result.patientAdherenceScore}%` }}
              transition={{ duration: 1, delay: 0.6 }}
            />
          </div>
        </div>

        {/* Human Trial Elimination */}
        <div className="bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg p-4">
          <h3 className="text-xs text-neon-cyan uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Human Trial Elimination Potential
          </h3>
          <p className="text-sm text-cyan-100 leading-relaxed">{result.humanTrialEliminationPotential}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
        <button 
          onClick={onReset}
          disabled={loading}
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Abort & Restart
        </button>
        
        <button 
          onClick={onNext}
          disabled={loading}
          className="group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
          <span className="relative flex items-center gap-2">
            {loading ? 'Designing...' : 'Design Supply Chain'}
            <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showModal && reportContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-jarvis-bg border border-cyan-900 shadow-2xl shadow-cyan-900/20 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-cyan-900/50 bg-cyan-950/20">
                <h3 className="text-lg text-neon-cyan uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Clinical Study Report (CSR)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-neon-cyan text-jarvis-bg text-xs uppercase tracking-widest hover:bg-cyan-400 transition-colors flex items-center gap-2 rounded font-bold"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-cyan-500 hover:text-cyan-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-[#ffffff] text-[#000000]">
                <div ref={reportRef} className="markdown-report p-8 bg-[#ffffff]">
                  <Markdown>{reportContent}</Markdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
