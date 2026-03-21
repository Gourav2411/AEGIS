import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Activity, Beaker, ShieldAlert, ChevronDown, Save, Download, RotateCcw, CheckCircle2, Circle, Dna, FlaskConical, Search, Info, Upload } from 'lucide-react';
import { FormData } from '../App';
import LiveOptimization from './LiveOptimization';

const Tooltip = ({ text }: { text: string }) => (
  <div className="relative flex items-center group ml-2">
    <Info className="w-4 h-4 text-cyan-500/50 hover:text-neon-cyan cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-cyan-950 border border-cyan-900/50 rounded text-xs text-cyan-100 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cyan-900/50"></div>
    </div>
  </div>
);

interface InputPanelProps {
  onSubmit: (data: FormData) => void;
  loading: boolean;
}

const DISEASE_CLASS_MAPPING: Record<string, { cures: string[], categories: string[], receptors: string[] }> = {
  "Oncology": {
    cures: ["Tumor regression", "Immune activation", "Apoptosis induction", "Angiogenesis inhibition", "Pain management", "Cellular regeneration"],
    categories: ["Small Molecule", "Monoclonal Antibody", "Antibody-Drug Conjugate (ADC)", "Cell Therapy", "Oncolytic Virus", "Vaccine", "Radiopharmaceutical", "PROTAC", "RNA Therapeutics (mRNA, siRNA)"],
    receptors: ["PD-1", "CTLA-4", "BRAF V600E", "HER2", "EGFR", "BRCA1/2", "KRAS G12C", "ALK", "ROS1", "VEGF", "PI3K", "mTOR", "PARP", "CDK4/6", "BCL-2", "MEK", "RET", "MET", "FGFR", "IDH1/2", "FLT3", "KIT", "PDGFRA", "NTRK"]
  },
  "Autoimmune & Inflammatory": {
    cures: ["Inflammation reduction", "Pain management", "Myelin sheath repair", "Fibrosis reversal", "Immune activation", "Antibody production enhancement"],
    categories: ["Small Molecule", "Biologic", "Monoclonal Antibody", "Peptide", "Cell Therapy", "Microbiome Therapeutics", "Recombinant Protein"],
    receptors: ["TNF-alpha", "IL-6", "CD19", "CD20", "JAK1/2/3", "BTK", "Glucocorticoid", "Estrogen", "Progesterone", "S1P"]
  },
  "Neurological & Psychiatric": {
    cures: ["Cognitive decline reversal", "Motor function restoration", "Neuroprotection", "Protein misfolding correction", "Neurotransmitter balance", "Pain management", "Stem cell differentiation"],
    categories: ["Small Molecule", "Gene Therapy", "Peptide", "Antisense Oligonucleotide (ASO)", "Cell Therapy", "Biologic", "Nanomedicine"],
    receptors: ["NMDA", "AMPA", "5-HT (Serotonin)", "D2/D3 (Dopamine)", "GABA-A/B", "Cannabinoid CB1/CB2", "mTOR", "Mu/Kappa/Delta Opioid", "AChE"]
  },
  "Metabolic & Endocrine": {
    cures: ["Blood glucose normalization", "Metabolic rate increase", "Hormone regulation", "Bone density increase", "Oxidative stress reduction", "Inflammation reduction"],
    categories: ["Small Molecule", "Peptide", "Biologic", "Recombinant Protein", "RNA Therapeutics (mRNA, siRNA)"],
    receptors: ["GLP-1", "SGLT2", "DPP-4", "Androgen", "Estrogen", "Thyroid Hormone", "Vitamin D", "PCSK9", "Glucocorticoid"]
  },
  "Infectious Diseases": {
    cures: ["Viral load suppression", "Pathogen eradication", "Immune activation", "Antibody production enhancement", "Inflammation reduction"],
    categories: ["Small Molecule", "Vaccine", "Monoclonal Antibody", "RNA Therapeutics (mRNA, siRNA)", "Phage Therapy", "Peptide", "Recombinant Protein"],
    receptors: ["ACE2", "CD4", "CCR5", "Viral Protease", "Viral Polymerase", "Spike Protein", "TNF-alpha", "IL-6"]
  },
  "Cardiovascular & Renal": {
    cures: ["Blood pressure regulation", "Vasodilation", "Fibrosis reversal", "Oxidative stress reduction", "Inflammation reduction"],
    categories: ["Small Molecule", "Peptide", "Oligonucleotide", "Biologic", "RNA Therapeutics (mRNA, siRNA)"],
    receptors: ["ACE", "ARB", "Beta-1/2 Adrenergic", "Calcium Channel", "Sodium Channel", "Potassium Channel", "Mineralocorticoid", "PCSK9"]
  },
  "Respiratory": {
    cures: ["Bronchodilation", "Inflammation reduction", "Gene expression modulation", "Cellular regeneration", "Pathogen eradication"],
    categories: ["Small Molecule", "Monoclonal Antibody", "Gene Therapy", "RNA Therapeutics (mRNA, siRNA)", "Peptide", "Biologic"],
    receptors: ["Beta-1/2 Adrenergic", "H1/H2 (Histamine)", "Glucocorticoid", "TNF-alpha", "IL-6", "CFTR", "Leukotriene"]
  },
  "Genetic & Rare Diseases": {
    cures: ["Gene expression modulation", "Protein misfolding correction", "Cellular regeneration", "Pain management", "Motor function restoration"],
    categories: ["Gene Therapy", "CRISPR-Cas9 Editor", "RNA Therapeutics (mRNA, siRNA)", "Antisense Oligonucleotide (ASO)", "Recombinant Protein", "Cell Therapy", "Small Molecule"],
    receptors: ["Beta-globin", "Factor VIII", "Dystrophin", "SMN1/2", "CFTR", "mTOR", "Gene Target"]
  }
};

const DISEASE_TO_CLASS: Record<string, string> = {
  "Advanced Melanoma": "Oncology",
  "Non-Small Cell Lung Cancer": "Oncology",
  "Triple-Negative Breast Cancer": "Oncology",
  "Glioblastoma": "Oncology",
  "Rheumatoid Arthritis": "Autoimmune & Inflammatory",
  "Multiple Sclerosis": "Autoimmune & Inflammatory",
  "Crohn's Disease": "Autoimmune & Inflammatory",
  "Ulcerative Colitis": "Autoimmune & Inflammatory",
  "Psoriasis": "Autoimmune & Inflammatory",
  "Endometriosis": "Autoimmune & Inflammatory",
  "Alzheimer's Disease": "Neurological & Psychiatric",
  "Parkinson's Disease": "Neurological & Psychiatric",
  "Amyotrophic Lateral Sclerosis (ALS)": "Neurological & Psychiatric",
  "Huntington's Disease": "Neurological & Psychiatric",
  "Schizophrenia": "Neurological & Psychiatric",
  "Major Depressive Disorder": "Neurological & Psychiatric",
  "Bipolar Disorder": "Neurological & Psychiatric",
  "Epilepsy": "Neurological & Psychiatric",
  "Type 2 Diabetes": "Metabolic & Endocrine",
  "Polycystic Ovary Syndrome (PCOS)": "Metabolic & Endocrine",
  "Osteoporosis": "Metabolic & Endocrine",
  "Osteoarthritis": "Autoimmune & Inflammatory",
  "HIV/AIDS": "Infectious Diseases",
  "Tuberculosis": "Infectious Diseases",
  "Malaria": "Infectious Diseases",
  "Zika Virus": "Infectious Diseases",
  "COVID-19": "Infectious Diseases",
  "Hepatitis C": "Infectious Diseases",
  "Hepatitis B": "Infectious Diseases",
  "Influenza": "Infectious Diseases",
  "Ebola Virus Disease": "Infectious Diseases",
  "Dengue Fever": "Infectious Diseases",
  "Heart Failure": "Cardiovascular & Renal",
  "Hypertension": "Cardiovascular & Renal",
  "Chronic Kidney Disease": "Cardiovascular & Renal",
  "Asthma": "Respiratory",
  "Chronic Obstructive Pulmonary Disease (COPD)": "Respiratory",
  "Cystic Fibrosis": "Genetic & Rare Diseases",
  "Sickle Cell Anemia": "Genetic & Rare Diseases",
  "Hemophilia A": "Genetic & Rare Diseases",
  "Duchenne Muscular Dystrophy": "Genetic & Rare Diseases"
};

const ALL_DISEASES = Object.keys(DISEASE_TO_CLASS).sort();
const ALL_CURES = Array.from(new Set(Object.values(DISEASE_CLASS_MAPPING).flatMap(c => c.cures))).sort();
const ALL_CATEGORIES = Array.from(new Set(Object.values(DISEASE_CLASS_MAPPING).flatMap(c => c.categories))).sort();
const ALL_RECEPTORS = Array.from(new Set(Object.values(DISEASE_CLASS_MAPPING).flatMap(c => c.receptors))).sort();

const PREDEFINED_TEMPLATES: Record<string, FormData> = {
  "Oncology - Keytruda Clone": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Immune activation",
    "category": "Monoclonal Antibody",
    "receptors": "PD-1"
  },
  "Diabetes - Ozempic Clone": {
    "disease": "Type 2 Diabetes",
    "cureRequired": "Blood glucose normalization",
    "category": "Peptide",
    "receptors": "GLP-1"
  },
  "Autoimmune - Humira Clone": {
    "disease": "Rheumatoid Arthritis",
    "cureRequired": "Inflammation reduction",
    "category": "Monoclonal Antibody",
    "receptors": "TNF-alpha"
  }
};

export default function InputPanel({ onSubmit, loading }: InputPanelProps) {
  const [formData, setFormData] = useState<FormData>({
    disease: '',
    cureRequired: '',
    category: '',
    receptors: '',
    agenticMode: false
  });

  const [error, setError] = useState<string | null>(null);

  const [savedTemplates, setSavedTemplates] = useState<Record<string, FormData>>(() => {
    const saved = localStorage.getItem('drug_templates');
    return saved ? JSON.parse(saved) : {};
  });

  const [previousFormData, setPreviousFormData] = useState<FormData | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [simulationPhase, setSimulationPhase] = useState(0);
  const [isReceptorDropdownOpen, setIsReceptorDropdownOpen] = useState(false);
  const [receptorSearch, setReceptorSearch] = useState('');
  const [pdbSearchResults, setPdbSearchResults] = useState<{id: string, title: string}[]>([]);
  const [isSearchingPdb, setIsSearchingPdb] = useState(false);
  const receptorDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (receptorDropdownRef.current && !receptorDropdownRef.current.contains(event.target as Node)) {
        setIsReceptorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (loading) {
      setSimulationPhase(0);
      const interval = setInterval(() => {
        setSimulationPhase(prev => (prev < 4 ? prev + 1 : prev));
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setSimulationPhase(0);
    }
  }, [loading]);

  useEffect(() => {
    const searchPDB = async () => {
      if (!receptorSearch || receptorSearch.length < 3) {
        setPdbSearchResults([]);
        return;
      }
      setIsSearchingPdb(true);
      try {
        const query = {
          query: {
            type: "terminal",
            service: "text",
            parameters: {
              value: receptorSearch
            }
          },
          return_type: "entry",
          request_options: {
            pager: { start: 0, rows: 5 }
          }
        };
        const response = await fetch(`https://search.rcsb.org/rcsbsearch/v2/query?json=${encodeURIComponent(JSON.stringify(query))}`);
        if (response.ok) {
          const data = await response.json();
          if (data.result_set) {
            const ids = data.result_set.map((r: any) => r.identifier);
            // Fetch titles for these IDs
            const titlesResponse = await fetch(`https://data.rcsb.org/graphql?query={entries(entry_ids:[${ids.map((id: string) => `"${id}"`).join(',')}]) {rcsb_id struct {title}}}`);
            if (titlesResponse.ok) {
              const titlesData = await titlesResponse.json();
              if (titlesData.data && titlesData.data.entries) {
                setPdbSearchResults(titlesData.data.entries.map((e: any) => ({
                  id: e.rcsb_id,
                  title: e.struct.title
                })));
              }
            }
          } else {
            setPdbSearchResults([]);
          }
        }
      } catch (e) {
        console.error("PDB Search failed", e);
      } finally {
        setIsSearchingPdb(false);
      }
    };

    const timeoutId = setTimeout(searchPDB, 500);
    return () => clearTimeout(timeoutId);
  }, [receptorSearch]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, receptors: `Custom PDB: ${file.name}` });
      // In a real app, we would read the file and pass the contents to the backend
      // const reader = new FileReader();
      // reader.onload = (e) => { const pdbContent = e.target?.result; };
      // reader.readAsText(file);
    }
  };

  const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    if (!templateName) return;
    
    setPreviousFormData(formData);
    setShowUndo(true);
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
    }, 5000);

    if (PREDEFINED_TEMPLATES[templateName]) {
      setFormData(PREDEFINED_TEMPLATES[templateName]);
    } else if (savedTemplates[templateName]) {
      setFormData(savedTemplates[templateName]);
    }
    setError(null);
  };

  const handleUndo = () => {
    if (previousFormData) {
      setFormData(previousFormData);
      setShowUndo(false);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
  };

  const handleSaveTemplate = () => {
    if (!formData.disease || !formData.cureRequired || !formData.category || !formData.receptors) {
      setError("Please fill all fields before saving a template.");
      return;
    }
    const name = prompt("Enter a name for this template:");
    if (!name) return;
    
    const newTemplates = { ...savedTemplates, [name]: formData };
    setSavedTemplates(newTemplates);
    localStorage.setItem('drug_templates', JSON.stringify(newTemplates));
    setError(null);
  };

  const currentClass = formData.disease ? DISEASE_TO_CLASS[formData.disease] : null;
  const availableCures = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].cures].sort() : ALL_CURES;
  const availableCategories = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].categories].sort() : ALL_CATEGORIES;
  const availableReceptors = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].receptors].sort() : ALL_RECEPTORS;

  const filteredReceptors = useMemo(() => {
    if (!receptorSearch) return availableReceptors;
    return availableReceptors.filter(r => r.toLowerCase().includes(receptorSearch.toLowerCase()));
  }, [availableReceptors, receptorSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.disease) {
      setError("Target disease is required.");
      return;
    }
    if (!formData.cureRequired) {
      setError("Required cure/outcome is required.");
      return;
    }
    if (!formData.category) {
      setError("Drug category is required.");
      return;
    }
    if (!formData.receptors) {
      setError("Target receptors/biomarkers are required.");
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col"
    >
      <div className="mb-8 border-b border-cyan-900/50 pb-4">
        <h2 className="text-xl font-mono text-neon-cyan uppercase tracking-widest flex items-center gap-2">
          <Target className="w-5 h-5" />
          Target Identification Protocol
        </h2>
        <p className="text-sm font-mono text-cyan-500/70 mt-2">Initialize synthesis parameters for novel drug formulation.</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {loading ? (
            formData.agenticMode ? (
              <motion.div
                key="live-optimization"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <LiveOptimization targetReceptor={formData.receptors || 'Target Receptor'} />
              </motion.div>
            ) : (
              <motion.div
                key="formulation-progress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col justify-center max-w-md mx-auto space-y-8 py-8"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl text-neon-cyan uppercase tracking-widest mb-2 font-bold">Synthesizing Formulation</h3>
                  <p className="text-sm text-cyan-500/70">Designing novel molecular structure for {formData.disease || 'target condition'}.</p>
                </div>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-cyan-900/50 before:to-transparent">
                  {[
                    { title: 'Target Identification', desc: `Analyzing ${formData.receptors || 'receptors'} and disease pathways.` },
                    { title: 'High-Throughput Screening', desc: `Searching compound libraries for ${formData.category || 'drug category'} candidates.` },
                    { title: 'Lead Optimization', desc: `Refining molecular structure for ${formData.cureRequired || 'desired outcome'}.` },
                    { title: 'Pre-clinical Formulation', desc: 'Defining dosage form, solubility, and delivery mechanisms.' },
                    { title: 'Finalizing Synthesis', desc: 'Generating SMILES structure and estimating manufacturing costs.' }
                  ].map((phase, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors duration-500 ${
                        simulationPhase > idx ? 'bg-neon-cyan border-neon-cyan text-jarvis-bg' :
                        simulationPhase === idx ? 'bg-jarvis-bg border-neon-cyan text-neon-cyan animate-pulse' :
                        'bg-jarvis-bg border-cyan-900/50 text-cyan-900/50'
                      }`}>
                        {simulationPhase > idx ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3 fill-current" />}
                      </div>
                      <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border transition-all duration-500 ${
                        simulationPhase >= idx ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-transparent border-transparent opacity-30'
                      }`}>
                        <h4 className={`text-sm font-bold uppercase tracking-widest mb-1 ${simulationPhase >= idx ? 'text-cyan-100' : 'text-cyan-500/50'}`}>{phase.title}</h4>
                        <p className="text-xs text-cyan-500/70 leading-relaxed">{phase.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          ) : (
            <motion.form 
              key="input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="flex flex-col h-full space-y-6 font-mono"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <select 
                    onChange={handleLoadTemplate}
                    value=""
                    className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-all appearance-none"
                    disabled={loading}
                  >
                    <option value="" disabled>Load Template...</option>
                    <optgroup label="Predefined">
                      {Object.keys(PREDEFINED_TEMPLATES).map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    {Object.keys(savedTemplates).length > 0 && (
                      <optgroup label="Saved">
                        {Object.keys(savedTemplates).map(t => <option key={t} value={t}>{t}</option>)}
                      </optgroup>
                    )}
                  </select>
                  <Download className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-950/20 border border-cyan-900/50 rounded text-sm text-cyan-500/70 hover:text-neon-cyan hover:border-neon-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Template
                </button>
              </div>

              <AnimatePresence>
                {showUndo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-cyan-900/20 border border-cyan-500/30 text-cyan-100 px-4 py-3 rounded text-sm flex items-center justify-between"
                  >
                    <span>Template loaded successfully.</span>
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="text-neon-cyan hover:text-cyan-300 flex items-center gap-1 font-bold"
                    >
                      <RotateCcw className="w-4 h-4" /> Undo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center">
                    <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Disease / Condition</label>
                    <Tooltip text="Provide a detailed description of the disease, condition, or specific pathology you are targeting. You can include patient demographics, disease stage, or specific symptoms." />
                  </div>
                  <textarea 
                    required
                    rows={3}
                    value={formData.disease}
                    onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                    placeholder="e.g., Advanced Melanoma with BRAF V600E mutation, focusing on patients with resistance to initial PD-1 blockade..."
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all resize-y"
                    disabled={loading}
                  />
                </div>
                
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center">
                    <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Required Cure / Outcome Metrics</label>
                    <Tooltip text="Specify quantifiable metrics or desired therapeutic effects. Be as specific as possible (e.g., 'Reduce tumor size by 50%')." />
                  </div>
                  <textarea 
                    required
                    rows={2}
                    value={formData.cureRequired}
                    onChange={(e) => setFormData({ ...formData, cureRequired: e.target.value })}
                    placeholder="e.g., Reduce tumor size by >50% within 6 months, achieve complete remission, improve cognitive function score by 15 points..."
                    className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all resize-y"
                    disabled={loading}
                  />
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['Reduce tumor size by 50%', 'Achieve complete remission', 'Improve cognitive function by 15 pts', 'Decrease viral load by 99%'].map(metric => (
                      <button
                        key={metric}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cureRequired: prev.cureRequired ? prev.cureRequired + ', ' + metric : metric }))}
                        className="text-[10px] px-2 py-1 bg-cyan-950/30 border border-cyan-900/50 rounded text-cyan-400 hover:bg-cyan-900/50 hover:text-neon-cyan transition-colors"
                      >
                        + {metric}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Drug Category</label>
                    <Tooltip text="Select the modality or class of the drug (e.g., Small Molecule, Monoclonal Antibody, Gene Therapy)." />
                  </div>
                  <div className="relative">
                    <select 
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none disabled:opacity-50"
                      disabled={loading}
                    >
                      <option value="" disabled>Select Drug Category...</option>
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-2" ref={receptorDropdownRef}>
                  <div className="flex items-center">
                    <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Receptors / Biomarkers</label>
                    <Tooltip text="Search and select the specific protein, receptor, or genetic marker the drug is intended to target." />
                  </div>
                  <div className="relative">
                    <div 
                      className={`w-full bg-jarvis-bg border ${isReceptorDropdownOpen ? 'border-neon-cyan ring-1 ring-neon-cyan' : 'border-cyan-900/50'} rounded px-4 py-3 text-cyan-100 cursor-text flex items-center justify-between transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                      onClick={() => !loading && setIsReceptorDropdownOpen(true)}
                    >
                      {isReceptorDropdownOpen ? (
                        <input
                          type="text"
                          autoFocus
                          value={receptorSearch}
                          onChange={(e) => setReceptorSearch(e.target.value)}
                          placeholder="Search receptors..."
                          className="bg-transparent border-none outline-none w-full text-cyan-100 placeholder:text-cyan-500/50"
                        />
                      ) : (
                        <span className={formData.receptors ? 'text-cyan-100' : 'text-cyan-500/50'}>
                          {formData.receptors || 'Search Target Receptors...'}
                        </span>
                      )}
                      {!isReceptorDropdownOpen && <Search className="w-4 h-4 text-cyan-500/70" />}
                    </div>
                    
                    <AnimatePresence>
                      {isReceptorDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 top-full left-0 right-0 mt-1 bg-cyan-950 border border-cyan-900/50 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                        >
                          {isSearchingPdb ? (
                            <div className="px-4 py-3 text-sm text-cyan-500/50 italic flex items-center gap-2">
                              <Activity className="w-4 h-4 animate-spin" /> Searching RCSB PDB...
                            </div>
                          ) : pdbSearchResults.length > 0 ? (
                            <>
                              <div className="px-4 py-2 text-xs font-bold text-neon-cyan uppercase tracking-widest bg-cyan-900/30">RCSB PDB Results</div>
                              {pdbSearchResults.map(r => (
                                <div 
                                  key={r.id}
                                  onClick={() => {
                                    setFormData({ ...formData, receptors: `${r.id} - ${r.title}` });
                                    setIsReceptorDropdownOpen(false);
                                    setReceptorSearch('');
                                  }}
                                  className="px-4 py-2 hover:bg-cyan-900/50 cursor-pointer text-sm text-cyan-100 transition-colors border-b border-cyan-900/30 last:border-0"
                                >
                                  <span className="font-bold text-neon-green mr-2">{r.id}</span>
                                  <span className="text-xs text-cyan-500/80">{r.title}</span>
                                </div>
                              ))}
                            </>
                          ) : filteredReceptors.length > 0 ? (
                            <>
                              <div className="px-4 py-2 text-xs font-bold text-neon-cyan uppercase tracking-widest bg-cyan-900/30">Common Targets</div>
                              {filteredReceptors.map(r => (
                                <div 
                                  key={r}
                                  onClick={() => {
                                    setFormData({ ...formData, receptors: r });
                                    setIsReceptorDropdownOpen(false);
                                    setReceptorSearch('');
                                  }}
                                  className="px-4 py-2 hover:bg-cyan-900/50 cursor-pointer text-sm text-cyan-100 transition-colors"
                                >
                                  {r}
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="px-4 py-3 text-sm text-cyan-500/50 italic">No receptors found.</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Protein Structure (Optional)</label>
                  <Tooltip text="Upload a .pdb file for 3D molecular docking simulation. This enables 'Bring Your Own Target' (BYOT) capabilities." />
                </div>
                <div className="relative border-2 border-dashed border-cyan-900/50 rounded-lg p-6 text-center hover:border-neon-cyan transition-colors cursor-pointer bg-cyan-950/10 group">
                  <input 
                    type="file" 
                    accept=".pdb" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.name.endsWith('.pdb')) {
                          setError("Please upload a valid .pdb file.");
                          return;
                        }
                        setError(null);
                        setFormData({ ...formData, pdbFile: file });
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={loading}
                  />
                  {formData.pdbFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-neon-green" />
                      <span className="text-sm text-neon-green font-bold tracking-wider">{formData.pdbFile.name}</span>
                      <span className="text-xs text-cyan-500/70">Ready for AutoDock Vina & 3D Visualization</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-cyan-500/70 group-hover:text-neon-cyan transition-colors" />
                      <span className="text-sm text-cyan-100 font-bold tracking-wider">Drag & Drop or Click to Upload .pdb</span>
                      <span className="text-xs text-cyan-500/70">Bring Your Own Target (BYOT)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4 mt-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={formData.agenticMode || false}
                      onChange={(e) => setFormData({ ...formData, agenticMode: e.target.checked })}
                      disabled={loading}
                    />
                    <div className="w-5 h-5 border-2 border-cyan-900/50 rounded bg-jarvis-bg peer-checked:bg-neon-cyan peer-checked:border-neon-cyan transition-colors"></div>
                    <CheckCircle2 className="absolute w-3 h-3 text-jarvis-bg opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <div className="text-sm text-neon-cyan font-bold uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Agentic Loop Optimization (2035 Mode)
                      <Tooltip text="When enabled, the AI will autonomously iterate on the formulation, simulating multiple generations of compounds to find the mathematically optimal structure before returning the result." />
                    </div>
                    <p className="text-xs text-cyan-500/70 mt-1 leading-relaxed">
                      Enable autonomous AI iteration. Aegis will generate multiple molecular variants, evaluate their binding affinity and toxicity, mutate the SMILES strings, and return the mathematically optimal compound.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-auto pt-6 border-t border-cyan-900/50 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative px-8 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan font-mono text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-neon-cyan/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                  <span className="relative flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    {loading ? 'Synthesizing...' : 'Initiate Synthesis'}
                  </span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
