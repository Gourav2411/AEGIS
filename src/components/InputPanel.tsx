import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Activity, Beaker, ShieldAlert, ChevronDown, Save, Download, RotateCcw, CheckCircle2, Circle, Dna, FlaskConical, Search } from 'lucide-react';
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
  },
  "Oncology - Advanced Melanoma Variant 1": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "PD-1"
  },
  "Oncology - Advanced Melanoma Variant 2": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "CTLA-4"
  },
  "Oncology - Advanced Melanoma Variant 3": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "BRAF V600E"
  },
  "Oncology - Advanced Melanoma Variant 4": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "HER2"
  },
  "Oncology - Advanced Melanoma Variant 5": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "EGFR"
  },
  "Oncology - Advanced Melanoma Variant 6": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "BRCA1/2"
  },
  "Oncology - Advanced Melanoma Variant 7": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "KRAS G12C"
  },
  "Oncology - Advanced Melanoma Variant 8": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "ALK"
  },
  "Oncology - Advanced Melanoma Variant 9": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "ROS1"
  },
  "Oncology - Advanced Melanoma Variant 10": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "VEGF"
  },
  "Oncology - Advanced Melanoma Variant 11": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "PI3K"
  },
  "Oncology - Advanced Melanoma Variant 12": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "mTOR"
  },
  "Oncology - Advanced Melanoma Variant 13": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "PARP"
  },
  "Oncology - Advanced Melanoma Variant 14": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "CDK4/6"
  },
  "Oncology - Advanced Melanoma Variant 15": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "BCL-2"
  },
  "Oncology - Advanced Melanoma Variant 16": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "MEK"
  },
  "Oncology - Advanced Melanoma Variant 17": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "RET"
  },
  "Oncology - Advanced Melanoma Variant 18": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "MET"
  },
  "Oncology - Advanced Melanoma Variant 19": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "FGFR"
  },
  "Oncology - Advanced Melanoma Variant 20": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "IDH1/2"
  },
  "Oncology - Advanced Melanoma Variant 21": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "FLT3"
  },
  "Oncology - Advanced Melanoma Variant 22": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "KIT"
  },
  "Oncology - Advanced Melanoma Variant 23": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "PDGFRA"
  },
  "Oncology - Advanced Melanoma Variant 24": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Small Molecule",
    "receptors": "NTRK"
  },
  "Oncology - Advanced Melanoma Variant 25": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "PD-1"
  },
  "Oncology - Advanced Melanoma Variant 26": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "CTLA-4"
  },
  "Oncology - Advanced Melanoma Variant 27": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "BRAF V600E"
  },
  "Oncology - Advanced Melanoma Variant 28": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "HER2"
  },
  "Oncology - Advanced Melanoma Variant 29": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "EGFR"
  },
  "Oncology - Advanced Melanoma Variant 30": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "BRCA1/2"
  },
  "Oncology - Advanced Melanoma Variant 31": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "KRAS G12C"
  },
  "Oncology - Advanced Melanoma Variant 32": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "ALK"
  },
  "Oncology - Advanced Melanoma Variant 33": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "ROS1"
  },
  "Oncology - Advanced Melanoma Variant 34": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "VEGF"
  },
  "Oncology - Advanced Melanoma Variant 35": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "PI3K"
  },
  "Oncology - Advanced Melanoma Variant 36": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "mTOR"
  },
  "Oncology - Advanced Melanoma Variant 37": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "PARP"
  },
  "Oncology - Advanced Melanoma Variant 38": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "CDK4/6"
  },
  "Oncology - Advanced Melanoma Variant 39": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "BCL-2"
  },
  "Oncology - Advanced Melanoma Variant 40": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "MEK"
  },
  "Oncology - Advanced Melanoma Variant 41": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "RET"
  },
  "Oncology - Advanced Melanoma Variant 42": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "MET"
  },
  "Oncology - Advanced Melanoma Variant 43": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "FGFR"
  },
  "Oncology - Advanced Melanoma Variant 44": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "IDH1/2"
  },
  "Oncology - Advanced Melanoma Variant 45": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "FLT3"
  },
  "Oncology - Advanced Melanoma Variant 46": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "KIT"
  },
  "Oncology - Advanced Melanoma Variant 47": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "PDGFRA"
  },
  "Oncology - Advanced Melanoma Variant 48": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Monoclonal Antibody",
    "receptors": "NTRK"
  },
  "Oncology - Advanced Melanoma Variant 49": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "PD-1"
  },
  "Oncology - Advanced Melanoma Variant 50": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "CTLA-4"
  },
  "Oncology - Advanced Melanoma Variant 51": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "BRAF V600E"
  },
  "Oncology - Advanced Melanoma Variant 52": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "HER2"
  },
  "Oncology - Advanced Melanoma Variant 53": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "EGFR"
  },
  "Oncology - Advanced Melanoma Variant 54": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "BRCA1/2"
  },
  "Oncology - Advanced Melanoma Variant 55": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "KRAS G12C"
  },
  "Oncology - Advanced Melanoma Variant 56": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "ALK"
  },
  "Oncology - Advanced Melanoma Variant 57": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "ROS1"
  },
  "Oncology - Advanced Melanoma Variant 58": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "VEGF"
  },
  "Oncology - Advanced Melanoma Variant 59": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "PI3K"
  },
  "Oncology - Advanced Melanoma Variant 60": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "mTOR"
  },
  "Oncology - Advanced Melanoma Variant 61": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "PARP"
  },
  "Oncology - Advanced Melanoma Variant 62": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "CDK4/6"
  },
  "Oncology - Advanced Melanoma Variant 63": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "BCL-2"
  },
  "Oncology - Advanced Melanoma Variant 64": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "MEK"
  },
  "Oncology - Advanced Melanoma Variant 65": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "RET"
  },
  "Oncology - Advanced Melanoma Variant 66": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "MET"
  },
  "Oncology - Advanced Melanoma Variant 67": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "FGFR"
  },
  "Oncology - Advanced Melanoma Variant 68": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "IDH1/2"
  },
  "Oncology - Advanced Melanoma Variant 69": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "FLT3"
  },
  "Oncology - Advanced Melanoma Variant 70": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "KIT"
  },
  "Oncology - Advanced Melanoma Variant 71": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "PDGFRA"
  },
  "Oncology - Advanced Melanoma Variant 72": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Antibody-Drug Conjugate (ADC)",
    "receptors": "NTRK"
  },
  "Oncology - Advanced Melanoma Variant 73": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "PD-1"
  },
  "Oncology - Advanced Melanoma Variant 74": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "CTLA-4"
  },
  "Oncology - Advanced Melanoma Variant 75": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "BRAF V600E"
  },
  "Oncology - Advanced Melanoma Variant 76": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "HER2"
  },
  "Oncology - Advanced Melanoma Variant 77": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "EGFR"
  },
  "Oncology - Advanced Melanoma Variant 78": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "BRCA1/2"
  },
  "Oncology - Advanced Melanoma Variant 79": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "KRAS G12C"
  },
  "Oncology - Advanced Melanoma Variant 80": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "ALK"
  },
  "Oncology - Advanced Melanoma Variant 81": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "ROS1"
  },
  "Oncology - Advanced Melanoma Variant 82": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "VEGF"
  },
  "Oncology - Advanced Melanoma Variant 83": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "PI3K"
  },
  "Oncology - Advanced Melanoma Variant 84": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "mTOR"
  },
  "Oncology - Advanced Melanoma Variant 85": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "PARP"
  },
  "Oncology - Advanced Melanoma Variant 86": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "CDK4/6"
  },
  "Oncology - Advanced Melanoma Variant 87": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "BCL-2"
  },
  "Oncology - Advanced Melanoma Variant 88": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "MEK"
  },
  "Oncology - Advanced Melanoma Variant 89": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "RET"
  },
  "Oncology - Advanced Melanoma Variant 90": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "MET"
  },
  "Oncology - Advanced Melanoma Variant 91": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "FGFR"
  },
  "Oncology - Advanced Melanoma Variant 92": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "IDH1/2"
  },
  "Oncology - Advanced Melanoma Variant 93": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "FLT3"
  },
  "Oncology - Advanced Melanoma Variant 94": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "KIT"
  },
  "Oncology - Advanced Melanoma Variant 95": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "PDGFRA"
  },
  "Oncology - Advanced Melanoma Variant 96": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Cell Therapy",
    "receptors": "NTRK"
  },
  "Oncology - Advanced Melanoma Variant 97": {
    "disease": "Advanced Melanoma",
    "cureRequired": "Tumor regression",
    "category": "Oncolytic Virus",
    "receptors": "PD-1"
  }
};

export default function InputPanel({ onSubmit, loading }: InputPanelProps) {
  const [formData, setFormData] = useState<FormData>({
    disease: '',
    cureRequired: '',
    category: '',
    receptors: ''
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
    if (!availableCures.includes(formData.cureRequired)) {
      setError(`Selected cure is not valid for ${formData.disease}.`);
      return;
    }
    if (!formData.category) {
      setError("Drug category is required.");
      return;
    }
    if (!availableCategories.includes(formData.category)) {
      setError(`Selected category is not valid for ${formData.disease}.`);
      return;
    }
    if (!formData.receptors) {
      setError("Target receptors/biomarkers are required.");
      return;
    }
    if (!availableReceptors.includes(formData.receptors)) {
      setError(`Selected receptor is not valid for ${formData.disease}.`);
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  const handleDiseaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisease = e.target.value;
    const newClass = DISEASE_TO_CLASS[newDisease];
    
    let newCure = '';
    let newCategory = '';
    let newReceptors = '';

    if (newClass) {
      const cures = [...DISEASE_CLASS_MAPPING[newClass].cures].sort();
      const categories = [...DISEASE_CLASS_MAPPING[newClass].categories].sort();
      const receptors = [...DISEASE_CLASS_MAPPING[newClass].receptors].sort();
      
      // Auto-populate if there is only one option available
      if (cures.length === 1) newCure = cures[0];
      if (categories.length === 1) newCategory = categories[0];
      if (receptors.length === 1) newReceptors = receptors[0];
    }

    setFormData({
      ...formData,
      disease: newDisease,
      cureRequired: newCure,
      category: newCategory,
      receptors: newReceptors
    });
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
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
