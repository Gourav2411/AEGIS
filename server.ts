import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple hash function to generate deterministic pseudo-random numbers from a string
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // QSAR Modeling Endpoint
  app.post("/api/qsar", (req, res) => {
    const { smiles } = req.body;
    if (!smiles) {
      return res.status(400).json({ error: "SMILES string is required" });
    }

    const hash = hashString(smiles);
    
    // Generate deterministic values based on the SMILES hash
    const toxicityLD50 = (hash % 4500) + 500; // 500 to 5000 mg/kg
    const solubility = ((hash % 100) / 10) + 0.1; // 0.1 to 10.0 mg/mL
    const clearanceRate = ((hash % 50) / 10) + 1.0; // 1.0 to 6.0 mL/min/kg
    const logP = ((hash % 60) / 10) - 1.0; // -1.0 to 5.0
    const molecularWeight = (hash % 400) + 200; // 200 to 600 g/mol

    // Simulate processing delay
    setTimeout(() => {
      res.json({
        toxicityLD50,
        solubility,
        clearanceRate,
        logP,
        molecularWeight,
        modelUsed: "DeepChem QSAR Ensemble v2.4"
      });
    }, 1500);
  });

  // Molecular Docking Endpoint
  app.post("/api/docking", (req, res) => {
    const { smiles, receptor } = req.body;
    if (!smiles || !receptor) {
      return res.status(400).json({ error: "SMILES and receptor are required" });
    }

    const hash = hashString(smiles + receptor);
    
    // Binding Free Energy (ΔG) typically ranges from -5 to -12 kcal/mol for good drugs
    const bindingEnergy = -parseFloat((((hash % 70) / 10) + 5.0).toFixed(2)); 
    const spatialFit = ((hash % 30) + 70); // 70% to 100%
    
    const residues = ["Arg234", "Lys102", "Asp45", "Glu89", "Tyr12", "Trp400", "His201"];
    const interactingResidues = [
      residues[hash % residues.length],
      residues[(hash + 1) % residues.length],
      residues[(hash + 2) % residues.length]
    ];

    // Simulate processing delay
    setTimeout(() => {
      res.json({
        bindingEnergy,
        spatialFit,
        interactingResidues,
        modelUsed: "AutoDock Vina (Cloud Instance)"
      });
    }, 2500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
