import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Thermometer, ShieldCheck, Globe, RefreshCw, Box, Layers, CheckCircle2, Clock, FileCheck, DollarSign, List, Microscope, FileText } from 'lucide-react';
import { PackagingResult, FormulationResult, TrialParams, TrialResult } from '../services/geminiService';
import jsPDF from 'jspdf';
import FeedbackWidget from './FeedbackWidget';

interface PackagingPanelProps {
  result: PackagingResult;
  formulation: FormulationResult | null;
  trialParams: TrialParams | null;
  trialResult: TrialResult | null;
  formData: any;
  onReset: () => void;
}

export default function PackagingPanel({ result, formulation, trialParams, trialResult, formData, onReset }: PackagingPanelProps) {
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleExportHypothesis = () => {
    if (!formulation || !trialResult || !trialParams) return;
    setGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Helper for centered text
      const centerText = (text: string, y: number, size: number = 12) => {
        doc.setFontSize(size);
        const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
      };

      // Cover Page
      doc.setFont("helvetica", "bold");
      centerText("COMPUTATIONAL DRUG CANDIDATE HYPOTHESIS", 40, 20);
      centerText("FOR EXPERIMENTAL VALIDATION", 50, 14);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      centerText("We used AI-assisted virtual screening to generate a prioritized drug candidate hypothesis for experimental validation.", 65, 10);
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(12);
      doc.text(`Sponsor: Aegis Autonomous Drug Discovery`, 20, 80);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 90);
      doc.text(`Investigational Drug: ${formulation.name}`, 20, 100);
      doc.text(`Indication: ${formData?.disease || 'N/A'}`, 20, 110);
      doc.text(`Compound ID: ${formulation.compoundId}`, 20, 120);

      // Module 2: Summaries
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.text("Module 2: Summaries", 20, 20);
      doc.setFont("helvetica", "normal");
      doc.text(`Mechanism of Action:`, 20, 35);
      const moaLines = doc.splitTextToSize(formulation.mechanismOfAction, pageWidth - 40);
      doc.text(moaLines, 20, 45);

      // Module 3: Quality
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.text("Module 3: Quality (CMC)", 20, 20);
      doc.setFont("helvetica", "normal");
      doc.text(`Chemical Formula: ${formulation.chemicalFormula}`, 20, 35);
      doc.text(`SMILES:`, 20, 45);
      const smilesStr = formulation.smilesString || formulation.molecularStructure || 'N/A';
      const smilesLines = doc.splitTextToSize(smilesStr, pageWidth - 40);
      doc.text(smilesLines, 20, 55);
      
      let yPos = 55 + (smilesLines.length * 7) + 10;
      doc.text(`Binding Affinity: ${formulation.bindingAffinity}`, 20, yPos);
      doc.text(`Half-Life: ${formulation.halfLife}`, 20, yPos + 10);
      doc.text(`Bioavailability: ${formulation.bioavailability}`, 20, yPos + 20);
      doc.text(`Solubility: ${formulation.solubility}`, 20, yPos + 30);

      // Module 4 & 5: Clinical
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.text("Module 5: Clinical Study Reports", 20, 20);
      doc.setFont("helvetica", "normal");
      doc.text(`Trial Phase: ${trialParams.phase}`, 20, 35);
      doc.text(`Cohort Size: ${trialParams.cohortSize}`, 20, 45);
      doc.text(`Duration: ${trialParams.duration}`, 20, 55);
      doc.text(`Dosage: ${trialParams.dosage} ${trialParams.dosageUnit}`, 20, 65);
      
      let clinY = 85;
      
      if (trialParams.useSCA) {
        doc.setFont("helvetica", "bold");
        doc.text(`Synthetic Control Arm (SCA): ENABLED`, 20, clinY);
        doc.setFont("helvetica", "normal");
        clinY += 10;
        if (trialParams.liveEHRRecords) {
          doc.text(`Live EHR Network: Pulled ${trialParams.liveEHRRecords.toLocaleString()} records for statistical validation.`, 20, clinY);
          clinY += 10;
        }
      }
      
      if (trialParams.useAdaptiveDesign) {
        doc.setFont("helvetica", "bold");
        doc.text(`Bayesian Adaptive Design: ENABLED`, 20, clinY);
        doc.setFont("helvetica", "normal");
        clinY += 10;
      }
      
      if (trialParams.useRAG) {
        doc.setFont("helvetica", "bold");
        doc.text(`Real-World Grounding (RAG): ENABLED`, 20, clinY);
        doc.setFont("helvetica", "normal");
        clinY += 10;
      }

      clinY += 10;
      doc.text(`Overall Viability: ${trialResult.overallViability}%`, 20, clinY);
      doc.text(`In-Silico Success: ${trialResult.inSilicoSuccess}%`, 20, clinY + 10);
      doc.text(`In-Vitro Success: ${trialResult.inVitroSuccess}%`, 20, clinY + 20);
      
      if (trialResult.statisticalConfidence) {
        doc.text(`Statistical Confidence: ${trialResult.statisticalConfidence}%`, 20, clinY + 30);
      }
      if (trialResult.costSavingsEstimate) {
        doc.text(`Estimated Cost Savings: ${trialResult.costSavingsEstimate}`, 20, clinY + 40);
      }
      if (trialResult.timeSavedEstimate) {
        doc.text(`Estimated Time Saved: ${trialResult.timeSavedEstimate}`, 20, clinY + 50);
      }
      
      clinY += 60;
      doc.text(`Toxicity Profile:`, 20, clinY);
      const toxLines = doc.splitTextToSize(trialResult.toxicityProfile, pageWidth - 40);
      doc.text(toxLines, 20, clinY + 10);
      
      if (trialResult.subgroupAnalysis && trialResult.subgroupAnalysis.length > 0) {
        clinY += (toxLines.length * 7) + 20;
        doc.setFont("helvetica", "bold");
        doc.text(`Subgroup Analysis:`, 20, clinY);
        doc.setFont("helvetica", "normal");
        clinY += 10;
        trialResult.subgroupAnalysis.forEach((group) => {
          doc.text(`- ${group.group}: ${group.efficacy}% efficacy (n=${group.sampleSize})`, 25, clinY);
          clinY += 10;
        });
      }

      // Module 3: Quality (Packaging & Logistics)
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.text("Module 3: Quality (Packaging & Logistics)", 20, 20);
      doc.setFont("helvetica", "normal");
      
      let packY = 35;
      doc.text(`Primary Packaging:`, 20, packY);
      const primLines = doc.splitTextToSize(result.primaryPackaging, pageWidth - 40);
      doc.text(primLines, 20, packY + 10);
      
      packY += (primLines.length * 7) + 15;
      doc.text(`Secondary Packaging:`, 20, packY);
      const secLines = doc.splitTextToSize(result.secondaryPackaging, pageWidth - 40);
      doc.text(secLines, 20, packY + 10);
      
      packY += (secLines.length * 7) + 15;
      doc.text(`Temperature Control:`, 20, packY);
      const tempLines = doc.splitTextToSize(result.temperatureControl, pageWidth - 40);
      doc.text(tempLines, 20, packY + 10);
      
      packY += (tempLines.length * 7) + 15;
      doc.text(`Distribution Plan:`, 20, packY);
      const distLines = doc.splitTextToSize(result.distributionPlan, pageWidth - 40);
      doc.text(distLines, 20, packY + 10);
      
      packY += (distLines.length * 7) + 15;
      doc.text(`Vial Type: ${result.vialType}`, 20, packY);
      doc.text(`Stopper Type: ${result.stopperType}`, 20, packY + 10);
      doc.text(`Seal Type: ${result.sealType}`, 20, packY + 20);
      doc.text(`Shelf Life: ${result.shelfLife}`, 20, packY + 30);

      if (result.sources && result.sources.length > 0) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.text("Module 3: Premium Packaging Suppliers", 20, 20);
        doc.setFont("helvetica", "normal");
        
        let sourceY = 35;
        result.sources.forEach((source, idx) => {
          doc.setFont("helvetica", "bold");
          doc.text(`${idx + 1}. ${source.name} (${source.location})`, 20, sourceY);
          doc.setFont("helvetica", "normal");
          sourceY += 10;
          
          const descLines = doc.splitTextToSize(`Description: ${source.description}`, pageWidth - 40);
          doc.text(descLines, 20, sourceY);
          sourceY += (descLines.length * 7) + 5;
          
          const specLines = doc.splitTextToSize(`Specialty: ${source.specialty}`, pageWidth - 40);
          doc.text(specLines, 20, sourceY);
          sourceY += (specLines.length * 7) + 10;
          
          if (sourceY > 250) {
            doc.addPage();
            sourceY = 20;
          }
        });
      }

      // Save
      doc.save(`Hypothesis_${formulation.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setGeneratingPDF(false);
    }
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
            <Package className="w-5 h-5" />
            Logistics & Packaging
          </h2>
          <p className="text-sm text-cyan-500/70 mt-2">Supply chain and distribution protocols finalized.</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest">Status</div>
          <div className="text-lg text-neon-green font-bold tracking-widest">READY FOR MFG</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* Physical Packaging */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <Box className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Vial Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.vialType}</p>
          </div>
          
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <Layers className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Stopper Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.stopperType}</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 flex flex-col items-center text-center">
            <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Seal Type</h3>
            <p className="text-sm text-cyan-100 font-bold">{result.sealType}</p>
          </div>
        </div>

        {/* Packaging Details */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" /> Primary Packaging
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.primaryPackaging}</p>
          </div>
          <div className="border-t border-cyan-900/30 pt-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" /> Secondary Packaging
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.secondaryPackaging}</p>
          </div>
        </div>

        {/* Temperature & Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-red-400" /> Temperature Control
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.temperatureControl}</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Distribution Plan
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed">{result.distributionPlan}</p>
          </div>
        </div>

        {/* Regulatory & Shelf Life */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" /> Estimated Shelf Life
            </h3>
            <p className="text-sm text-cyan-100 font-bold">{result.shelfLife}</p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-neon-green" /> ISO Standards
            </h3>
            <ul className="list-disc list-inside text-sm text-cyan-100 space-y-1">
              {result.isoStandards.map((standard, idx) => (
                <li key={idx}>{standard}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Materials & Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <List className="w-4 h-4 text-orange-400" /> Raw Materials Needed
            </h3>
            <ul className="list-disc list-inside text-sm text-cyan-100 space-y-1">
              {result.materialsNeeded?.map((material, idx) => (
                <li key={idx}>{material}</li>
              ))}
            </ul>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-purple-400" /> Scientific Specifications
            </h3>
            <ul className="list-disc list-inside text-sm text-cyan-100 space-y-1">
              {result.scientificSpecifications?.map((spec, idx) => (
                <li key={idx}>{spec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Premium Suppliers */}
        {result.sources && result.sources.length > 0 && (
          <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
            <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Premium Packaging Suppliers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.sources.map((source, idx) => (
                <div key={idx} className="bg-jarvis-bg border border-cyan-900/30 rounded p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-neon-cyan">{source.name}</h4>
                    <span className="text-[10px] bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded uppercase tracking-wider">{source.location}</span>
                  </div>
                  <p className="text-xs text-cyan-100 leading-relaxed">{source.description}</p>
                  <div className="mt-auto pt-2 border-t border-cyan-900/30">
                    <span className="text-[10px] text-cyan-500/70 uppercase tracking-widest">Specialty:</span>
                    <p className="text-xs text-cyan-300 mt-1">{source.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Analysis */}
        <div className="bg-cyan-950/20 border border-cyan-900/50 rounded-lg p-4">
          <h3 className="text-xs text-cyan-500/70 uppercase tracking-widest mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neon-green" /> Manufacturing Cost Analysis (Per Batch)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4 text-center">
              <div className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">In-House Manual Manufacturing</div>
              <div className="text-xl text-neon-green font-bold">{result.costs?.manualBatchCost}</div>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/50 rounded-lg p-4 text-center">
              <div className="text-[10px] text-cyan-500/70 uppercase tracking-widest mb-1">Pre-Made Supplier Purchase</div>
              <div className="text-xl text-blue-400 font-bold">{result.costs?.boughtBatchCost}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-jarvis-bg border border-cyan-900/30 rounded p-3">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">R&D Cost</div>
              <div className="text-sm text-cyan-100">{result.costs?.rdCost}</div>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 rounded p-3">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Lab Cost</div>
              <div className="text-sm text-cyan-100">{result.costs?.labCost}</div>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 rounded p-3">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Infrastructure</div>
              <div className="text-sm text-cyan-100">{result.costs?.infraCost}</div>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 rounded p-3">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Labour Cost</div>
              <div className="text-sm text-cyan-100">{result.costs?.labourCost}</div>
            </div>
            <div className="bg-jarvis-bg border border-cyan-900/30 rounded p-3">
              <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">Land Cost</div>
              <div className="text-sm text-cyan-100">{result.costs?.landCost}</div>
            </div>
          </div>
        </div>

        {/* Feedback Widget */}
        <FeedbackWidget 
          stage="packaging" 
          inputContext={{ formulation, formData, trialParams, trialResult }} 
          generatedOutput={result} 
        />
      </div>

      <div className="mt-6 pt-6 border-t border-cyan-900/50 flex justify-between items-center">
        <button 
          onClick={onReset}
          className="px-4 py-2 text-xs text-cyan-500/70 hover:text-cyan-100 uppercase tracking-widest flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Initialize New Protocol
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={handleExportHypothesis}
            disabled={generatingPDF}
            className="group relative px-6 py-3 bg-cyan-900/20 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all overflow-hidden disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-neon-cyan/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span className="relative flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {generatingPDF ? 'Generating PDF...' : 'Export Hypothesis'}
            </span>
          </button>

          <button 
            className="group relative px-6 py-3 bg-neon-green/20 border border-neon-green text-neon-green text-sm uppercase tracking-widest hover:bg-neon-green hover:text-jarvis-bg transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-neon-green/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span className="relative flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Deploy to Manufacturing
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
