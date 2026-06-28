"""
Drive the live admin app with Playwright: verify every page loads, capture
console errors (incl. React duplicate-key warnings), screenshot each area at
desktop + mobile, and exercise key interactions (detail drawer, logout).

Usage (from backend venv, which has playwright installed):
    python docs/sprints/sprint-admin-dashboard/verify_and_screenshot.py

Outputs screenshots to docs/sprints/sprint-admin-dashboard/screenshots/ and
prints a PASS/FAIL verification report. Exit code is non-zero if any checked
page failed to render or a duplicate-key warning was seen.
"""
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows console is cp1252 by default
except Exception:
    pass

from playwright.sync_api import sync_playwright

BASE = "http://localhost:5173"
EMAIL = "verify.admin@example.com"
PASSWORD = "VerifyAdmin#2026"
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

console_errors: list[str] = []
dupe_key_warnings: list[str] = []
results: list[tuple[str, bool, str]] = []


def shot(page, name):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)


def check(page, label, expect_text=None, expect_selector=None):
    ok = True
    detail = ""
    try:
        if expect_selector:
            page.wait_for_selector(expect_selector, timeout=8000)
        if expect_text:
            page.wait_for_function(
                "t => document.body.innerText.includes(t)", arg=expect_text, timeout=8000
            )
    except Exception as e:  # noqa: BLE001
        ok = False
        detail = str(e).splitlines()[0]
    results.append((label, ok, detail))
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {label}" + (f" -- {detail}" if detail else ""))
    return ok


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        def on_console(msg):
            if msg.type in ("error", "warning"):
                text = msg.text
                console_errors.append(f"[{msg.type}] {text}")
                low = text.lower()
                if "same key" in low or ("key" in low and "warning" in low) or "unique key" in low:
                    dupe_key_warnings.append(text)

        page.on("console", on_console)
        page.on("pageerror", lambda e: console_errors.append(f"[pageerror] {e}"))

        print("== Login ==")
        page.goto(f"{BASE}/admin/login", wait_until="domcontentloaded")
        shot(page, "01-login")
        page.fill('input[type="email"]', EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=12000)
        check(page, "Login -> Dashboard", expect_text="Dashboard")
        page.wait_for_timeout(2500)  # let charts animate/data load
        shot(page, "02-dashboard")

        print("== Pages ==")
        # Navigate CLIENT-SIDE via the sidebar so the SPA boots only once. Full
        # reloads re-verify the token on every page and trip auth rate limits.
        nav = [
            ("Users", "03-users"),
            ("Companies", "04-companies"),
            ("Jobs", "05-jobs"),
            ("Applications", "06-applications"),
            ("Reports", "07-reports"),
        ]
        for text, fname in nav:
            page.click(f"aside a:has-text('{text}')")
            page.wait_for_timeout(1600)
            check(page, f"{text} page", expect_text=text)
            shot(page, fname)

        # Settings via the profile dropdown (the only entry point per spec).
        page.click("header button:has-text('Verify Admin')")
        page.wait_for_timeout(300)
        page.click("text=Settings")
        page.wait_for_timeout(1200)
        check(page, "Settings page", expect_text="Settings")
        shot(page, "08-settings-profile")

        # Settings sub-sections via the in-page tabs.
        for tab, fname in [("Admin Users", "09-settings-admins"), ("Security", "10-settings-security")]:
            page.click(f"button[role='tab']:has-text('{tab}')")
            page.wait_for_timeout(900)
            shot(page, fname)

        print("== Interactions ==")
        # User detail drawer: go to Users (client-side), click first row.
        page.click("aside a:has-text('Users')")
        page.wait_for_timeout(1600)
        try:
            page.click("tbody tr:first-child", timeout=6000)
            page.wait_for_selector('[role="dialog"]', timeout=6000)
            page.wait_for_timeout(1200)
            shot(page, "11-user-drawer")
            check(page, "User detail drawer opens", expect_selector='[role="dialog"]')
            page.keyboard.press("Escape")
        except Exception as e:  # noqa: BLE001
            results.append(("User detail drawer opens", False, str(e).splitlines()[0]))
            print("  [FAIL] User detail drawer:", e)

        # Application detail drawer (client-side nav)
        page.click("aside a:has-text('Applications')")
        page.wait_for_timeout(1600)
        try:
            page.click("tbody tr:first-child", timeout=6000)
            page.wait_for_selector('[role="dialog"]', timeout=6000)
            page.wait_for_timeout(1200)
            shot(page, "12-application-drawer")
        except Exception:
            pass

        # Responsive (mobile) dashboard. Reuse the existing session by copying the
        # admin token into the mobile context's localStorage (avoids a second UI
        # login, which would trip Supabase auth rate limits).
        print("== Responsive ==")
        token = page.evaluate("() => window.localStorage.getItem('admin_token')")
        mobile = browser.new_context(viewport={"width": 390, "height": 844})
        mobile.add_init_script(f"window.localStorage.setItem('admin_token', {token!r});")
        mp = mobile.new_page()
        mp.goto(f"{BASE}/admin", wait_until="domcontentloaded")
        mp.wait_for_timeout(2500)
        mp.screenshot(path=str(SHOTS / "13-dashboard-mobile.png"), full_page=True)
        check(mp, "Mobile dashboard renders", expect_text="Dashboard")
        # Mobile nav drawer
        try:
            mp.click("header button[aria-label='Open navigation']", timeout=4000)
            mp.wait_for_timeout(600)
            mp.screenshot(path=str(SHOTS / "14-mobile-nav.png"))
        except Exception:
            pass
        mobile.close()

        # Logout (already authenticated; navigate with 'load' since Vite's HMR
        # websocket means 'networkidle' never settles).
        print("== Logout ==")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            page.click("header button:has-text('Verify Admin')", timeout=5000)
            page.wait_for_timeout(400)
            page.click("text=Sign out", timeout=5000)
            page.wait_for_url("**/admin/login", timeout=8000)
            check(page, "Logout -> login", expect_text="Sign in")
        except Exception as e:  # noqa: BLE001
            results.append(("Logout -> login", False, str(e).splitlines()[0]))
            print("  [FAIL] Logout:", str(e).splitlines()[0])

        browser.close()

    # ---- Report ----
    print("\n== Verification summary ==")
    passed = sum(1 for _, ok, _ in results if ok)
    for label, ok, detail in results:
        print(f"  {'PASS' if ok else 'FAIL'}  {label}")
    print(f"\n{passed}/{len(results)} checks passed")

    print(f"\nConsole errors/warnings captured: {len(console_errors)}")
    # Persist full console log (UTF-8) for inspection, and show unique samples.
    log_path = SHOTS.parent / "console.log"
    log_path.write_text("\n".join(console_errors), encoding="utf-8")
    print(f"Full console log written to {log_path.name}")
    seen = set()
    for e in console_errors:
        key = e[:160]
        if key not in seen:
            seen.add(key)
            safe = key.encode("ascii", "replace").decode("ascii")
            print("   -", safe)
        if len(seen) >= 15:
            break

    if dupe_key_warnings:
        print(f"\n!! React duplicate-key warnings: {len(dupe_key_warnings)}")
        for w in dupe_key_warnings[:5]:
            print("   -", w[:160])
    else:
        print("\nNo React duplicate-key warnings detected.")

    failed = [r for r in results if not r[1]]
    sys.exit(1 if (failed or dupe_key_warnings) else 0)


if __name__ == "__main__":
    main()
