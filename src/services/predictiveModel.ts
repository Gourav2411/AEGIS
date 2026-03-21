import Papa from 'papaparse';

export interface TrialDataRow {
  NCTId: string;
  Drug_Name: string;
  Target_Disease: string;
  Phase: string;
  Cohort_Size: number;
  Status: string;
  Duration_Months: number;
}

// Simple text similarity (Jaccard-like)
const calculateSimilarity = (str1: string, str2: string) => {
  const words1 = new Set(str1.toLowerCase().split(/\W+/));
  const words2 = new Set(str2.toLowerCase().split(/\W+/));
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }
  const union = words1.size + words2.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export const runPredictiveModel = async (
  csvData: string,
  targetDisease: string,
  phase: string,
  cohortSize: number,
  durationMonths: number,
  dosageNum: number,
  useSCA: boolean,
  useAdaptiveDesign: boolean
) => {
  return new Promise<{
    inSilicoSuccess: number;
    inVitroSuccess: number;
    overallViability: number;
    patientAdherenceScore: number;
    efficacyOverTime: { month: number; efficacy: number; placeboEfficacy?: number }[];
    historicalMatches: TrialDataRow[];
  }>((resolve, reject) => {
    Papa.parse<TrialDataRow>(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;

        // 1. Find Historical Matches (KNN-style)
        // We score each historical trial based on how closely it matches the user's parameters
        const scoredTrials = data.map(trial => {
          let score = 0;
          
          // Match Phase (High weight)
          if (trial.Phase && trial.Phase.toLowerCase().includes(phase.toLowerCase().replace(' ', ''))) {
            score += 3;
          }
          
          // Match Disease (Highest weight)
          const diseaseSim = calculateSimilarity(trial.Target_Disease || '', targetDisease);
          score += diseaseSim * 5;
          
          // Match Cohort Size (Medium weight)
          if (trial.Cohort_Size) {
             const sizeDiff = Math.abs(trial.Cohort_Size - cohortSize) / Math.max(trial.Cohort_Size, cohortSize);
             score += (1 - sizeDiff) * 2;
          }
          
          // Match Duration (Medium weight)
          if (trial.Duration_Months) {
             const durDiff = Math.abs(trial.Duration_Months - durationMonths) / Math.max(trial.Duration_Months, durationMonths);
             score += (1 - durDiff) * 2;
          }

          return { trial, score };
        });

        // Sort by score descending and take top 5 matches
        scoredTrials.sort((a, b) => b.score - a.score);
        const topMatches = scoredTrials.slice(0, 5).map(s => s.trial);

        // 2. Calculate Base Success based on Historical Matches
        let baseSuccess = 50; // Default
        
        if (topMatches.length > 0) {
           // Average duration of successful matches vs failed (simplified logic here since we only have COMPLETED status in this dataset)
           // In a real scenario, we'd look at Status = COMPLETED vs TERMINATED/WITHDRAWN
           // Here we'll use a heuristic: longer trials in the same phase generally indicate harder problems or more side effects
           const avgHistoricalDuration = topMatches.reduce((sum, t) => sum + (t.Duration_Months || 0), 0) / topMatches.length;
           const avgHistoricalCohort = topMatches.reduce((sum, t) => sum + (t.Cohort_Size || 0), 0) / topMatches.length;
           
           // If user's cohort is much smaller than historical average for this disease/phase, success drops (less statistical power)
           if (cohortSize < avgHistoricalCohort * 0.5) baseSuccess -= 10;
           if (cohortSize > avgHistoricalCohort * 1.5) baseSuccess += 5;
           
           // If user's duration is much shorter than historical average, success drops (might not capture long-term effects)
           if (durationMonths < avgHistoricalDuration * 0.5) baseSuccess -= 15;
           
           // Base phase adjustments
           if (phase === 'Phase 1') baseSuccess += 20;
           if (phase === 'Phase 2') baseSuccess += 5;
           if (phase === 'Phase 3') baseSuccess -= 10;
        } else {
           // Fallback if no matches
           if (phase === 'Phase 1') baseSuccess = 75;
           if (phase === 'Phase 2') baseSuccess = 55;
           if (phase === 'Phase 3') baseSuccess = 40;
        }

        // 3. Apply Parameter Adjustments
        if (useSCA) baseSuccess += 12; // SCA improves statistical power
        if (useAdaptiveDesign) baseSuccess += 15; // Adaptive design drops failing cohorts early
        
        if (dosageNum > 500) baseSuccess -= 10; // High dosage penalty
        
        // Cap success rates
        const inSilicoSuccess = Math.min(99, Math.max(10, Math.round(baseSuccess + (Math.random() * 10 - 5))));
        const inVitroSuccess = Math.min(99, Math.max(10, Math.round(baseSuccess - 5 + (Math.random() * 10 - 5))));
        const overallViability = Math.round((inSilicoSuccess * 0.6) + (inVitroSuccess * 0.4));

        // 4. Calculate Adherence Score
        let adherence = 85;
        if (durationMonths > 12) adherence -= 10; 
        if (durationMonths > 36) adherence -= 15;
        if (dosageNum > 200) adherence -= 5; 
        const patientAdherenceScore = Math.min(99, Math.max(20, Math.round(adherence + (Math.random() * 10 - 5))));

        // 5. Generate Efficacy Curve
        const efficacyOverTime = [];
        let currentEfficacy = 10;
        for (let i = 1; i <= durationMonths; i++) {
          currentEfficacy = Math.min(95, currentEfficacy + (Math.random() * 15));
          const dataPoint: any = { month: i, efficacy: Math.round(currentEfficacy) };
          if (useSCA) {
            dataPoint.placeboEfficacy = Math.round(currentEfficacy * 0.3 + (Math.random() * 5));
          }
          efficacyOverTime.push(dataPoint);
        }

        resolve({
          inSilicoSuccess,
          inVitroSuccess,
          overallViability,
          patientAdherenceScore,
          efficacyOverTime,
          historicalMatches: topMatches
        });
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};
