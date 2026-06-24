import os
import logging
from google import genai
from google.genai.types import CreateFileSearchStoreConfig

logger = logging.getLogger(__name__)


class GeminiStoreService:
    def __init__(self):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_API_KEY not set — Gemini store creation disabled")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)

    def create_store(self, display_name: str):
        if not self.client:
            raise RuntimeError("Gemini client not initialized: GOOGLE_API_KEY is missing")
        logger.info("Creating Gemini File Search store: %s", display_name)
        store = self.client.file_search_stores.create(
            config=CreateFileSearchStoreConfig(display_name=display_name)
        )
        logger.info("Gemini store created: %s (name=%s)", store.display_name, store.name)
        return store

    def list_stores(self):
        if not self.client:
            raise RuntimeError("Gemini client not initialized: GOOGLE_API_KEY is missing")
        return list(self.client.file_search_stores.list())

    def delete_store(self, store_name: str):
        if not self.client:
            raise RuntimeError("Gemini client not initialized: GOOGLE_API_KEY is missing")
        self.client.file_search_stores.delete(name=store_name)
        logger.info("Gemini store deleted: %s", store_name)

    def upload_candidate_summary(self, store_name: str, candidate_name: str, candidate_id: str, summary_text: str):
        if not self.client:
            raise RuntimeError("Gemini client not initialized: GOOGLE_API_KEY is missing")
            
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.txt', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(summary_text)
            temp_file_path = temp_file.name
            
        try:
            display_name = f"summary-{candidate_name.replace(' ', '_')}-{candidate_id}"
            logger.info("Uploading summary to Gemini File Search Store: %s", store_name)
            self.client.file_search_stores.upload_to_file_search_store(
                file=temp_file_path,
                file_search_store_name=store_name,
                config={
                    "display_name": display_name
                }
            )
            logger.info("Successfully uploaded summary to store %s", store_name)
        finally:
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_err:
                logger.error("Failed to clean up temporary file %s: %s", temp_file_path, cleanup_err)
