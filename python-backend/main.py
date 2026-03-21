from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from worker import run_agentic_loop
from celery.result import AsyncResult

app = FastAPI(title="Aegis AI - GPU Backend", description="Python microservice for PyTorch GNNs and AutoDock Vina")

class DiscoveryRequest(BaseModel):
    disease: str
    cureRequired: str
    category: str
    receptors: str
    pdbFileContent: str = None

@app.post("/api/v1/discover")
async def discover_drug(req: DiscoveryRequest):
    """
    Dispatches a heavy drug discovery task to the GPU cluster via Celery.
    """
    # Dispatch to Celery worker for GPU processing
    task = run_agentic_loop.delay(req.disease, req.cureRequired, req.category, req.receptors, req.pdbFileContent)
    return {"task_id": task.id, "status": "Processing on GPU cluster..."}

@app.get("/api/v1/task/{task_id}")
async def get_task_status(task_id: str):
    """
    Poll this endpoint to get the status of the GPU simulation.
    """
    task_result = AsyncResult(task_id)
    if task_result.ready():
        return {"status": "completed", "result": task_result.result}
    return {"status": task_result.status}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
