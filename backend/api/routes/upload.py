import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from backend.config import settings
from backend.rag import load_document, chunk_documents, embed_and_store

router = APIRouter(prefix="/repository", tags=["Repository"])

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form("default_user"),
    namespace: Optional[str] = Form("uploads")
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is empty.")

    # Determine destination directory
    target_dir = os.path.join(settings.REPOSITORY_BASE_PATH, "users", user_id, namespace)
    os.makedirs(target_dir, exist_ok=True)

    file_path = os.path.join(target_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Trigger immediate RAG ingestion
        docs = load_document(file_path, {"source": file.filename, "uploaded_by": user_id})
        if docs:
            chunks = chunk_documents(docs)
            embed_and_store(chunks, namespace=namespace, user_id=user_id)
            
        return {
            "status": "success",
            "filename": file.filename,
            "path": file_path,
            "chunks_embedded": len(chunks) if docs else 0,
            "message": f"Successfully uploaded and ingested {file.filename} into vault '{namespace}'."
        }
    except Exception as e:
        return {
            "status": "partial_success",
            "filename": file.filename,
            "path": file_path,
            "error": str(e),
            "message": f"File saved, but embedding failed: {str(e)}"
        }

@router.get("/sources")
def list_available_sources(user_id: str = "default_user"):
    """
    Returns list of global collections and user's vault collections.
    """
    global_sources = [
        {"id": "global_ncert", "label": "NCERT Textbooks", "type": "global"},
        {"id": "global_pyqs", "label": "Previous Year Questions (PYQs)", "type": "global"},
        {"id": "global_standard_books", "label": "Standard Reference Books", "type": "global"},
        {"id": "global_current_affairs", "label": "Current Affairs Packs", "type": "global"}
    ]
    
    user_sources = [
        {"id": "notes", "label": "Personal Notes Vault", "type": "personal"},
        {"id": "uploads", "label": "Uploaded PDF & Docs Vault", "type": "personal"},
        {"id": "bookmarks", "label": "Saved Bookmarks", "type": "personal"}
    ]

    return {"global_sources": global_sources, "user_sources": user_sources}
