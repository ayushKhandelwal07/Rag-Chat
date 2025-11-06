from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models import ChatRequest, ChatResponse, UploadResponse
from app.ocr_processor import process_pdf
from app.rag_service import process_document, query_document
import tempfile
import os
import uuid

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload PDF - creates new session"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    session_id = str(uuid.uuid4())
    temp_path = None
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            temp_path = tmp.name
            tmp.write(await file.read())
        
        extracted = process_pdf(temp_path)
        process_document(session_id, extracted["text"], extracted["filename"])
        
        return UploadResponse(success=True, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Query documents in session"""
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        result = query_document(request.session_id, request.query)
        return ChatResponse(answer=result["answer"], sources=result["sources"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
