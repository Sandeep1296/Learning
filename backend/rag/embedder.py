import os
from typing import List
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from backend.config import settings

def get_embedding_function():
    """
    Returns configured embedding function (OpenAI or local Ollama embeddings).
    """
    if settings.OPENAI_API_KEY and not settings.USE_OLLAMA:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            api_key=settings.OPENAI_API_KEY,
            model=settings.EMBEDDING_MODEL
        )
    else:
        from langchain_community.embeddings import OllamaEmbeddings
        return OllamaEmbeddings(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL
        )

def get_collection_name(namespace: str, user_id: str = None) -> str:
    """
    Generates sanitized ChromaDB collection name based on namespace strategy.
    """
    clean_ns = namespace.lower().replace("-", "_").replace(" ", "_")
    if clean_ns.startswith("global_"):
        return clean_ns
    if user_id:
        return f"user_{user_id}_{clean_ns}"
    return f"user_global_{clean_ns}"

def embed_and_store(chunks: List[Document], namespace: str, user_id: str = None) -> Chroma:
    """
    Stores document chunks into local ChromaDB for the specified namespace collection.
    """
    if not chunks:
        return None

    collection_name = get_collection_name(namespace, user_id)
    embeddings = get_embedding_function()

    persist_directory = os.path.abspath(settings.CHROMA_PERSIST_DIR)
    os.makedirs(persist_directory, exist_ok=True)

    vector_store = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_directory
    )

    vector_store.add_documents(chunks)
    print(f"[Embedder] Embedded {len(chunks)} chunk(s) into Chroma collection: {collection_name}")
    return vector_store
