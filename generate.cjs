const DISEASE_CLASS_MAPPING = {
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

const DISEASE_TO_CLASS = {
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

const templates = {
  "Oncology - Keytruda Clone": {
    disease: "Advanced Melanoma",
    cureRequired: "Immune activation",
    category: "Monoclonal Antibody",
    receptors: "PD-1"
  },
  "Diabetes - Ozempic Clone": {
    disease: "Type 2 Diabetes",
    cureRequired: "Blood glucose normalization",
    category: "Peptide",
    receptors: "GLP-1"
  },
  "Autoimmune - Humira Clone": {
    disease: "Rheumatoid Arthritis",
    cureRequired: "Inflammation reduction",
    category: "Monoclonal Antibody",
    receptors: "TNF-alpha"
  }
};

let count = 3;
for (const [disease, dClass] of Object.entries(DISEASE_TO_CLASS)) {
  const mapping = DISEASE_CLASS_MAPPING[dClass];
  for (let i = 0; i < mapping.cures.length; i++) {
    for (let j = 0; j < mapping.categories.length; j++) {
      for (let k = 0; k < mapping.receptors.length; k++) {
        if (count >= 100) break;
        const name = `${dClass.split(" ")[0]} - ${disease} Variant ${count - 2}`;
        if (!templates[name]) {
          templates[name] = {
            disease: disease,
            cureRequired: mapping.cures[i],
            category: mapping.categories[j],
            receptors: mapping.receptors[k]
          };
          count++;
        }
      }
      if (count >= 100) break;
    }
    if (count >= 100) break;
  }
  if (count >= 100) break;
}

const fs = require('fs');
fs.writeFileSync('templates.txt', JSON.stringify(templates, null, 2));
