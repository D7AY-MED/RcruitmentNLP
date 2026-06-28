"""
Capture clean, data-loaded screenshots of the admin app for the documentation.

Differs from verify_and_screenshot.py: it WAITS for real content (rendered
charts / table rows) before each screenshot, navigates client-side (single SPA
session to stay under auth rate limits), and pauses between heavy pages.
"""
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
SHOTS.mkdir(parents=True, exist_ok=True)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = ctx.new_page()

        print("login…")
        page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOTS / "01-login.png"), full_page=True)
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=15000)

        print("dashboard… (waiting for charts)")
        # Wait for the growth area chart to render -> data has loaded.
        page.wait_for_selector("svg.recharts-surface", timeout=20000)
        page.wait_for_timeout(2500)
        page.screenshot(path=str(SHOTS / "02-dashboard.png"), full_page=True)

        def nav_and_shot(link, fname, wait_rows=True):
            print(f"{link}…")
            page.click(f"aside a:has-text('{link}')")
            page.wait_for_timeout(1200)
            if wait_rows:
                try:
                    page.wait_for_selector("tbody tr, [class*='Empty'], h3", timeout=12000)
                except Exception:
                    pass
            page.wait_for_timeout(1500)
            page.screenshot(path=str(SHOTS / fname), full_page=True)

        nav_and_shot("Users", "03-users.png")
        nav_and_shot("Companies", "04-companies.png", wait_rows=False)
        page.wait_for_timeout(800)
        nav_and_shot("Jobs", "05-jobs.png")
        nav_and_shot("Applications", "06-applications.png")
        # Reports has charts
        print("Reports…")
        page.click("aside a:has-text('Reports')")
        page.wait_for_selector("svg.recharts-surface", timeout=15000)
        page.wait_for_timeout(2000)
        page.screenshot(path=str(SHOTS / "07-reports.png"), full_page=True)

        # Settings via profile dropdown
        print("Settings…")
        page.click("header button:has-text('Verify Admin')")
        page.wait_for_timeout(300)
        page.click("text=Settings")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "08-settings-profile.png"), full_page=True)
        page.click("button[role='tab']:has-text('Admin Users')")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(SHOTS / "09-settings-admins.png"), full_page=True)
        page.click("button[role='tab']:has-text('Security')")
        page.wait_for_timeout(900)
        page.screenshot(path=str(SHOTS / "10-settings-security.png"), full_page=True)

        # User detail drawer
        print("User drawer…")
        page.click("aside a:has-text('Users')")
        page.wait_for_selector("tbody tr", timeout=12000)
        page.wait_for_timeout(800)
        page.click("tbody tr:first-child")
        page.wait_for_selector('[role="dialog"]', timeout=8000)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "11-user-drawer.png"), full_page=True)
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

        # Application detail drawer
        print("Application drawer…")
        page.click("aside a:has-text('Applications')")
        page.wait_for_selector("tbody tr", timeout=12000)
        page.wait_for_timeout(800)
        page.click("tbody tr:first-child")
        page.wait_for_selector('[role="dialog"]', timeout=8000)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(SHOTS / "12-application-drawer.png"), full_page=True)
        page.keyboard.press("Escape")

        # Mobile dashboard (reuse token; single boot)
        print("Mobile…")
        token = page.evaluate("() => window.localStorage.getItem('admin_token')")
        mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        mobile.add_init_script(f"window.localStorage.setItem('admin_token', {token!r});")
        mp = mobile.new_page()
        mp.goto(f"{BASE}/admin", wait_until="domcontentloaded")
        try:
            mp.wait_for_selector("svg.recharts-surface", timeout=15000)
        except Exception:
            pass
        mp.wait_for_timeout(2000)
        mp.screenshot(path=str(SHOTS / "13-dashboard-mobile.png"), full_page=True)
        try:
            mp.click("header button[aria-label='Open navigation']", timeout=4000)
            mp.wait_for_timeout(700)
            mp.screenshot(path=str(SHOTS / "14-mobile-nav.png"))
        except Exception:
            pass
        mobile.close()

        browser.close()
    print("DONE — screenshots refreshed")


if __name__ == "__main__":
    main()
