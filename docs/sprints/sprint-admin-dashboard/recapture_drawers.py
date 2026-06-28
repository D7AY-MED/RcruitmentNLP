"""Re-capture the user + application detail drawers, waiting for full content."""
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
EMAIL = "verify.admin@example.com"
PASSWORD = "VerifyAdmin#2026"
SHOTS = Path(__file__).parent / "screenshots"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = ctx.new_page()

        page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=15000)
        page.wait_for_timeout(1500)

        def wait_rows(retries=4):
            """Wait for table rows; reload (with backoff) if the call was throttled."""
            for attempt in range(retries):
                try:
                    page.wait_for_selector("tbody tr", timeout=12000)
                    return True
                except Exception:
                    print(f"  rows not ready (attempt {attempt+1}); backing off + reload")
                    page.wait_for_timeout(15000)
                    page.reload(wait_until="domcontentloaded")
                    page.wait_for_timeout(2500)
            return False

        # User drawer
        print("user drawer…")
        page.click("aside a:has-text('Users')")
        wait_rows()
        page.wait_for_timeout(700)
        page.click("tbody tr:first-child")
        page.wait_for_selector('[role="dialog"]', timeout=8000)
        # Wait for the loaded content: the "Identity" section + footer Edit button.
        page.wait_for_selector('[role="dialog"] >> text=Identity', timeout=15000)
        page.wait_for_selector('[role="dialog"] button:has-text("Edit")', timeout=15000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "11-user-drawer.png"), full_page=True)
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)

        # Application drawer
        print("application drawer…")
        page.click("aside a:has-text('Applications')")
        wait_rows()
        page.wait_for_timeout(700)
        page.click("tbody tr:first-child")
        page.wait_for_selector('[role="dialog"]', timeout=8000)
        page.wait_for_selector('[role="dialog"] >> text=Transcript', timeout=15000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "12-application-drawer.png"), full_page=True)

        browser.close()
    print("DONE")


if __name__ == "__main__":
    main()
