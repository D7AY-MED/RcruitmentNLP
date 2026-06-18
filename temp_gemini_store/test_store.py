"""
Simple test script to interact with Gemini File Search Store.
Uses the google-genai SDK v2.x.
- Create a store
- List existing stores
- Delete a store
"""

from dotenv import load_dotenv
from google import genai
from google.genai.types import CreateFileSearchStoreConfig
import os

# --- Configuration ---
load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    print("⚠️  GOOGLE_API_KEY not found in environment variables.")
    print("Set it with:  set GOOGLE_API_KEY=your_key_here  (Windows)")
    exit(1)

client = genai.Client(api_key=API_KEY)


def list_stores():
    """List all existing file search stores."""
    print("\n📂 Listing all file search stores...")
    print("-" * 50)
    stores = list(client.file_search_stores.list())
    if not stores:
        print("  (No stores found)")
    for store in stores:
        print(f"  Name:         {store.name}")
        print(f"  Display Name: {store.display_name}")
        print(f"  Created:      {store.create_time}")
        print(f"  Updated:      {store.update_time}")
        print("-" * 50)
    return stores


def create_store(display_name: str):
    """Create a new file search store."""
    print(f"\n🆕 Creating store: '{display_name}'...")
    store = client.file_search_stores.create(
        config=CreateFileSearchStoreConfig(display_name=display_name)
    )
    print(f"  ✅ Created successfully!")
    print(f"  Name:         {store.name}")
    print(f"  Display Name: {store.display_name}")
    return store


def delete_store(store_name: str):
    """Delete a file search store."""
    print(f"\n🗑️  Deleting store: '{store_name}'...")
    client.file_search_stores.delete(name=store_name)
    print(f"  ✅ Deleted successfully!")


# --- Main ---
if __name__ == "__main__":
    print("=" * 50)
    print("  Gemini File Search Store Test")
    print("=" * 50)

    # 1. List existing stores
    list_stores()

    # 2. Create a test store
    test_store = create_store("test-store-demo")

    # 3. List stores again to see the new one
    list_stores()

    # 4. (Optional) Uncomment below to delete the test store
    # delete_store(test_store.name)
    # print("\nAfter deletion:")
    # list_stores()

    print("\n✅ Done! Script finished.")
