import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Target, Activity, Beaker, ShieldAlert, ChevronDown } from 'lucide-react';
import { FormData } from '../App';

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

export default function InputPanel({ onSubmit, loading }: InputPanelProps) {
  const [formData, setFormData] = useState<FormData>({
    disease: '',
    cureRequired: '',
    category: '',
    receptors: ''
  });

  const [error, setError] = useState<string | null>(null);

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

  const handleDiseaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      disease: e.target.value,
      cureRequired: '',
      category: '',
      receptors: ''
    });
  };

  const currentClass = formData.disease ? DISEASE_TO_CLASS[formData.disease] : null;
  const availableCures = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].cures].sort() : ALL_CURES;
  const availableCategories = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].categories].sort() : ALL_CATEGORIES;
  const availableReceptors = currentClass ? [...DISEASE_CLASS_MAPPING[currentClass].receptors].sort() : ALL_RECEPTORS;

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

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 font-mono">
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Disease / Condition</label>
            <div className="relative">
              <select 
                required
                value={formData.disease}
                onChange={handleDiseaseChange}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none"
                disabled={loading}
              >
                <option value="" disabled>Select Target Disease...</option>
                {ALL_DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Required Cure / Outcome</label>
            <div className="relative">
              <select 
                required
                value={formData.cureRequired}
                onChange={(e) => setFormData({ ...formData, cureRequired: e.target.value })}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none disabled:opacity-50"
                disabled={loading || !formData.disease}
              >
                <option value="" disabled>Select Required Outcome...</option>
                {availableCures.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Drug Category</label>
            <div className="relative">
              <select 
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none disabled:opacity-50"
                disabled={loading || !formData.disease}
              >
                <option value="" disabled>Select Drug Category...</option>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-cyan-500/70 uppercase tracking-widest">Target Receptors / Biomarkers</label>
            <div className="relative">
              <select 
                required
                value={formData.receptors}
                onChange={(e) => setFormData({ ...formData, receptors: e.target.value })}
                className="w-full bg-jarvis-bg border border-cyan-900/50 rounded px-4 py-3 text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all appearance-none disabled:opacity-50"
                disabled={loading || !formData.disease}
              >
                <option value="" disabled>Select Primary Target...</option>
                {availableReceptors.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/70 pointer-events-none" />
            </div>
          </div>
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
      </form>
    </motion.div>
  );
}
