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
