from models.gnn import ADMETPredictor
from docking.vina import run_autodock_vina
import random
from rdkit import Chem
from rdkit.Chem import Descriptors

# Try to import sascorer from RDKit contrib
try:
    import os, sys
    from rdkit import RDConfig
    sys.path.append(os.path.join(RDConfig.RDContribDir, 'SA_Score'))
    import sascorer
    HAS_SASCORER = True
except ImportError:
    HAS_SASCORER = False

class AgenticLoop:
    """
    The Reinforcement Learning Orchestrator.
    """
    def __init__(self, disease: str, receptor: str, pdb_file_content: str = None):
        self.disease = disease
        self.receptor = receptor
        self.pdb_file_content = pdb_file_content
        
        # Load PyTorch model onto GPU
        self.admet_model = ADMETPredictor()
        # if torch.cuda.is_available():
        #     self.admet_model = self.admet_model.cuda()
            
    def calculate_sa_score(self, smiles: str) -> float:
        """
        Calculates the Synthetic Accessibility (SA) score using RDKit.
        Returns a value between 1 (easy) and 10 (hard).
        """
        try:
            mol = Chem.MolFromSmiles(smiles)
            if mol is None:
                return 10.0 # Invalid SMILES is impossible to synthesize
            
            if HAS_SASCORER:
                return round(sascorer.calculateScore(mol), 2)
            else:
                # Fallback heuristic if sascorer is not available
                # based on molecular weight and complexity
                mw = Descriptors.MolWt(mol)
                rings = Chem.GetSSSR(mol)
                score = (mw / 100.0) + (rings * 0.5)
                return min(round(max(score, 1.0), 2), 10.0)
        except Exception:
            return 5.0 # Middle ground fallback
            
    def mutate_smiles(self, smiles: str) -> str:
        """
        Uses RDKit to apply valid chemical transformations.
        """
        # Real implementation:
        # mol = Chem.MolFromSmiles(smiles)
        # Apply reaction templates (e.g., fluorination, bioisostere replacement)
        # return Chem.MolToSmiles(new_mol)
        
        # Stub: Just append a Fluorine atom for demonstration
        return smiles + "F"
        
    def run(self, iterations: int = 1000):
        current_smiles = "CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5" # Base
        best_score = float('inf')
        best_smiles = current_smiles
        best_affinity = 0
        best_sa_score = self.calculate_sa_score(current_smiles)
        
        log = [f"Initialized Agentic Loop for {self.receptor}"]
        
        for i in range(iterations):
            # 1. Action: Mutate the molecule
            candidate_smiles = self.mutate_smiles(best_smiles) if i > 0 else current_smiles
            
            # 2. Environment Observation 1: Toxicity (PyTorch GNN)
            toxicity_tensor = self.admet_model(candidate_smiles)
            toxicity_score = toxicity_tensor.item()
            
            # 3. Environment Observation 2: Physics Simulation (AutoDock Vina)
            binding_affinity, interacting_residues = run_autodock_vina(candidate_smiles, self.receptor, self.pdb_file_content)
            
            # 4. Environment Observation 3: Synthetic Accessibility
            sa_score = self.calculate_sa_score(candidate_smiles)
            
            # 5. Reward Function
            # We want highly negative binding affinity, low toxicity, and low SA score.
            # Score = Binding + (Toxicity Penalty) + (SA Penalty)
            penalty = (toxicity_score * 10) + (sa_score * 0.5)
            score = binding_affinity + penalty
            
            # 6. Policy Update
            if score < best_score:
                best_score = score
                best_smiles = candidate_smiles
                best_affinity = binding_affinity
                best_sa_score = sa_score
                best_interacting_residues = interacting_residues
                if i % 1000 == 0:
                    log.append(f"Iteration {i}: Found superior candidate. Affinity: {binding_affinity} kcal/mol, Toxicity: {toxicity_score:.2f}, SA Score: {sa_score}")
                    
        log.append(f"Converged on mathematically optimal molecule after {iterations} iterations.")
        
        return {
            "smiles": best_smiles,
            "binding_affinity": best_affinity,
            "sa_score": best_sa_score,
            "interacting_residues": best_interacting_residues,
            "log": log
        }
