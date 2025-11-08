import chromadb
from typing import List, Dict
import time

_client = chromadb.PersistentClient(path="./chroma_db")

def get_collection(session_id: str):
    """Get or create collection for session"""
    return _client.get_or_create_collection(
        name=f"session_{session_id}",
        metadata={"hnsw:space": "cosine"}
    )

def store_chunks(session_id: str, chunks: List[str], embeddings: List[List[float]], metadata: List[Dict]):
    """Store chunks for a session (appends to existing chunks)"""
    collection = get_collection(session_id)
    # Generate unique IDs to avoid conflicts when appending multiple PDFs
    base_id = f"{session_id}_{int(time.time() * 1000000)}"
    ids = [f"{base_id}_{i}" for i in range(len(chunks))]
    collection.add(ids=ids, embeddings=embeddings, documents=chunks, metadatas=metadata)

def query_chunks(session_id: str, query_embedding: List[float], top_k: int = 5) -> Dict:
    """Query chunks for a session"""
    collection = get_collection(session_id)
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)
    return {
        "documents": results["documents"][0] if results["documents"] else [],
        "metadatas": results["metadatas"][0] if results["metadatas"] else []
    }

