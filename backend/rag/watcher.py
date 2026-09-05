import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from backend.config import settings
from backend.rag.loader import load_document
from backend.rag.chunker import chunk_documents
from backend.rag.embedder import embed_and_store

class IngestionHandler(FileSystemEventHandler):
    """
    Handles file events in repository/ folder and triggers RAG ingestion pipeline.
    """
    def on_created(self, event):
        if not event.is_directory:
            self._process_file(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._process_file(event.src_path)

    def _process_file(self, file_path: str):
        # Ignore hidden files and temp files
        filename = os.path.basename(file_path)
        if filename.startswith(".") or filename.endswith(".tmp") or filename.endswith(".swp"):
            return

        print(f"[Watcher] Detected file change: {file_path}")
        time.sleep(0.5)  # Wait briefly for writing to complete

        rel_path = os.path.relpath(file_path, settings.REPOSITORY_BASE_PATH)
        parts = rel_path.split(os.sep)

        namespace = "uploads"
        user_id = "default_user"

        if parts[0] == "global" and len(parts) > 1:
            namespace = f"global_{parts[1]}"
            user_id = None
        elif parts[0] == "users" and len(parts) > 2:
            user_id = parts[1]
            namespace = parts[2]

        try:
            metadata = {"source": filename, "rel_path": rel_path}
            docs = load_document(file_path, metadata)
            if docs:
                chunks = chunk_documents(docs)
                embed_and_store(chunks, namespace=namespace, user_id=user_id)
                print(f"[Watcher] Successfully ingested: {filename}")
        except Exception as e:
            print(f"[Watcher] Ingestion failed for {file_path}: {e}")

class RepositoryWatcher:
    """
    Manages background folder watcher observer.
    """
    def __init__(self, watch_dir: str = None):
        self.watch_dir = os.path.abspath(watch_dir or settings.REPOSITORY_BASE_PATH)
        os.makedirs(self.watch_dir, exist_ok=True)
        self.observer = Observer()
        self.handler = IngestionHandler()

    def start(self):
        self.observer.schedule(self.handler, self.watch_dir, recursive=True)
        self.observer.start()
        print(f"[Watcher] Watching repository folder: {self.watch_dir}")

    def stop(self):
        self.observer.stop()
        self.observer.join()
        print("[Watcher] Repository watcher stopped.")
