from pydantic import BaseModel
from typing import List

class ChatRequest(BaseModel):
    query: str
    session_id: str = None

class UploadResponse(BaseModel):
    success: bool
    session_id: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]

