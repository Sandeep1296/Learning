import os
from typing import List
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from backend.config import settings
from backend.rag.embedder import get_embedding_function, get_collection_name

def get_scoped_documents(query: str, user_id: str = "default_user", active_sources: List[str] = None, k: int = 4) -> List[Document]:
    """
    Retrieves top-k relevant document chunks across all active vector collections for the user.
    """
    if active_sources is None or len(active_sources) == 0:
        active_sources = ["global_ncert", "global_pyqs", "global_standard_books", "global_current_affairs", "notes", "uploads"]

    embeddings = get_embedding_function()
    persist_directory = os.path.abspath(settings.CHROMA_PERSIST_DIR)
    
    all_retrieved: List[Document] = []
    seen_contents = set()

    for source in active_sources:
        col_name = get_collection_name(source, user_id=user_id if not source.startswith("global_") else None)
        try:
            vector_store = Chroma(
                collection_name=col_name,
                embedding_function=embeddings,
                persist_directory=persist_directory
            )
            # Retrieve documents
            results = vector_store.similarity_search(query, k=k)
            for doc in results:
                content_key = doc.page_content.strip()
                if content_key not in seen_contents:
                    seen_contents.add(content_key)
                    # Annotate source collection in metadata
                    doc.metadata["collection"] = col_name
                    all_retrieved.append(doc)
        except Exception as err:
            # Collection may not exist yet or be empty
            continue

    # Return top results sorted or limited
    return all_retrieved[: k * 2]
