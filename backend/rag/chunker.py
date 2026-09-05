from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_documents(docs: List[Document], chunk_size: int = 1500, chunk_overlap: int = 200) -> List[Document]:
    """
    Chunks documents semantically using RecursiveCharacterTextSplitter.
    Default size ~1500 chars (512 tokens), overlap 200 chars (50 tokens).
    """
    if not docs:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    chunks = splitter.split_documents(docs)
    print(f"[Chunker] Split {len(docs)} document(s) into {len(chunks)} chunk(s).")
    return chunks
