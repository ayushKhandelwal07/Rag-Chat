from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.vector_store import store_chunks, query_chunks
from app.ollama_client import generate_response

_model = SentenceTransformer('all-MiniLM-L6-v2')
_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200, length_function=len)

def process_document(session_id: str, text: str, filename: str):
    """Process and store document for session"""
    chunks = _splitter.split_text(text)
    embeddings = _model.encode(chunks).tolist()
    metadata = [{"chunk_id": i, "source": filename} for i in range(len(chunks))]
    store_chunks(session_id, chunks, embeddings, metadata)
    return len(chunks)

def query_document(session_id: str, query: str) -> dict:
    """Query documents in session"""
    query_embedding = _model.encode([query]).tolist()[0]
    results = query_chunks(session_id, query_embedding, top_k=5)
    
    if not results["documents"]:
        return {"answer": "No relevant information found.", "sources": []}
    
    context = "\n\n".join(results["documents"])
    prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
    answer = generate_response(prompt)
    return {"answer": answer, "sources": results["metadatas"]}

