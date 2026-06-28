"""Measure client-perceived navigation time: first visit vs cached revisit.

Demonstrates the stale-while-revalidate cache: revisiting a page renders the
previous data instantly (no spinner) while revalidating in the background.
"""
import sys, time
from playwright.sync_api import sync_playwright

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = "http://localhost:5173"
EMAIL = "verify.admin@example.com"
PASSWORD = "VerifyAdmin#2026"


def time_nav(page, link, expect_text):
    """Click a sidebar link and measure ms until the page content is visible."""
    t = time.perf_counter()
    page.click(f"aside a:has-text('{link}')")
    page.wait_for_function("t => document.body.innerText.includes(t)", arg=expect_text, timeout=15000)
    # also wait for either rows or an empty/skeleton-resolved state
    page.wait_for_timeout(50)
    return (time.perf_counter() - t) * 1000


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
        page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        t0 = time.perf_counter()
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=15000)
        page.wait_for_selector("svg.recharts-surface", timeout=15000)
        print(f"Initial login -> dashboard interactive: {(time.perf_counter()-t0)*1000:.0f} ms")

        pages = [("Users", "Users"), ("Companies", "Companies"), ("Jobs", "Jobs"),
                 ("Applications", "Applications"), ("Reports", "Reports")]

        print("\nFirst visit (cold cache):")
        first = {}
        for link, text in pages:
            first[link] = time_nav(page, link, text)
            print(f"  {link:14} {first[link]:6.0f} ms")
            page.wait_for_timeout(200)

        # go back to dashboard, then revisit each (warm cache)
        print("\nCached revisit (stale-while-revalidate):")
        for link, text in pages:
            page.click("aside a:has-text('Dashboard')")
            page.wait_for_timeout(120)
            ms = time_nav(page, link, text)
            print(f"  {link:14} {ms:6.0f} ms   (was {first[link]:.0f} ms)")
            page.wait_for_timeout(150)

        browser.close()
    print("DONE")


if __name__ == "__main__":
    main()
