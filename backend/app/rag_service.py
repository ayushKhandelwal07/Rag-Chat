from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.vector_store import store_chunks, query_chunks
from app.ollama_client import generate_response

_model = SentenceTransformer('all-MiniLM-L6-v2')
_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200, length_function=len)

def process_document(session_id: str, text: str, filename: str):
    """Process and store document for session (appends to existing chunks)"""
    chunks = _splitter.split_text(text)
    embeddings = _model.encode(chunks).tolist()
    # Include filename in metadata to track which PDF each chunk came from
    metadata = [{"filename": filename} for _ in range(len(chunks))]
    store_chunks(session_id, chunks, embeddings, metadata)
    return len(chunks)

def query_document(session_id: str, query: str) -> dict:
    """Query documents in session (searches across all PDFs)"""
    query_embedding = _model.encode([query]).tolist()[0]
    # Increase top_k to get more context from multiple PDFs
    results = query_chunks(session_id, query_embedding, top_k=10)
    
    if not results["documents"]:
        return {"answer": "No relevant information found.", "sources": []}
    
    # Include filename information in context for better answers
    context_parts = []
    for i, doc in enumerate(results["documents"]):
        filename = results["metadatas"][i].get("filename", "document") if i < len(results["metadatas"]) else "document"
        context_parts.append(f"[From {filename}]:\n{doc}")
    
    context = "\n\n".join(context_parts)
    prompt = f"Context from multiple PDFs:\n{context}\n\nQuestion: {query}\n\nAnswer based on the context from all provided PDFs:"
    answer = generate_response(prompt)
    return {"answer": answer, "sources": results["metadatas"]}

