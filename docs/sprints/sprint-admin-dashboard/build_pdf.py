"""
Build the educational PDF: docs/sprints/sprint-admin-dashboard/admin-dashboard.pdf

Assembles the sprint Markdown docs + a screenshot gallery into one styled,
self-contained HTML, then prints it to PDF with Playwright (Chromium). The HTML
is also kept as admin-dashboard.html for inspection.
"""
import sys
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright

HERE = Path(__file__).parent
SHOTS = HERE / "screenshots"

# Section order in the PDF (after cover + auto TOC).
SECTIONS = [
    ("Overview", "README.md"),
    ("Architecture", "architecture.md"),
    ("MVC Mapping", "mvc-mapping.md"),
    ("Folder Structure", "folder-structure.md"),
    ("Database Mapping", "database-mapping.md"),
    ("Implementation Plan", "implementation-plan.md"),
    ("Testing & Verification", "testing.md"),
    ("Cleanup Report", "cleanup-report.md"),
    ("Performance Optimization — Audit", "PERFORMANCE_AUDIT.md"),
    ("Performance Optimization — Results", "SPRINT_REPORT.md"),
    ("File-by-File Reference", "FILES.md"),
]

# Screenshot gallery: (filename, caption).
GALLERY = [
    ("01-login.png", "Admin login — branded, accessible sign-in."),
    ("02-dashboard.png", "Dashboard — KPI cards, growth & status charts, activity, quick actions."),
    ("03-users.png", "Users — unified candidates + recruiters with search, filters and 3-dot actions."),
    ("11-user-drawer.png", "User detail drawer — large view/edit of every schema field."),
    ("04-companies.png", "Companies — derived from hr_profiles, searchable card grid."),
    ("05-jobs.png", "Jobs — job_pools with status filters and management actions."),
    ("06-applications.png", "Applications — interview_sessions with progress and status."),
    ("12-application-drawer.png", "Application detail — AI summary (Candidate_summaries) + transcript."),
    ("07-reports.png", "Reports — analytics, completion gauge, top companies, CSV/Excel export."),
    ("08-settings-profile.png", "Settings → My Profile (reached via the profile dropdown)."),
    ("09-settings-admins.png", "Settings → Admin Users — the only admin-management surface."),
    ("10-settings-security.png", "Settings → Security — change password."),
    ("13-dashboard-mobile.png", "Responsive — dashboard at 390px (mobile)."),
    ("14-mobile-nav.png", "Responsive — off-canvas navigation drawer on mobile."),
]

CSS = """
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
       color: #1f2933; line-height: 1.55; font-size: 11px; }
h1, h2, h3, h4 { color: #111827; line-height: 1.25; }
h1 { font-size: 22px; border-bottom: 3px solid #4f46e5; padding-bottom: 6px; margin-top: 0; }
h2 { font-size: 16px; margin-top: 22px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
h3 { font-size: 13px; margin-top: 16px; color: #4338ca; }
h4 { font-size: 12px; margin-top: 12px; }
p, li { font-size: 11px; }
a { color: #4f46e5; text-decoration: none; }
code { background: #f3f4f6; padding: 1px 4px; border-radius: 4px;
       font-family: 'SFMono-Regular', Consolas, monospace; font-size: 10px; color: #be185d; }
pre { background: #0f172a; color: #e2e8f0; padding: 12px 14px; border-radius: 8px;
      overflow-x: auto; font-size: 9.5px; line-height: 1.4; }
pre code { background: none; color: inherit; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10px; }
th, td { border: 1px solid #e5e7eb; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #eef2ff; color: #3730a3; font-weight: 600; }
tr:nth-child(even) td { background: #fafafa; }
blockquote { border-left: 3px solid #c7d2fe; background: #f5f3ff; margin: 10px 0;
             padding: 6px 12px; color: #4338ca; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
.section { page-break-before: always; }
.cover { page-break-after: always; text-align: center; padding-top: 120px; }
.cover .logo { width: 84px; height: 84px; border-radius: 22px; background: #4f46e5; color: #fff;
   font-size: 46px; font-weight: 800; line-height: 84px; display: inline-block; margin-bottom: 24px; }
.cover h1 { font-size: 34px; border: none; color: #111827; }
.cover .sub { font-size: 15px; color: #6b7280; margin-top: 6px; }
.cover .meta { margin-top: 40px; font-size: 11px; color: #9ca3af; }
.cover .pill { display:inline-block; background:#eef2ff; color:#4338ca; border-radius:999px;
   padding:4px 12px; margin:4px; font-size:10px; font-weight:600; }
.toc { page-break-after: always; }
.toc ol { font-size: 12px; line-height: 2; }
.gallery { page-break-before: always; }
.shot { page-break-inside: avoid; margin: 0 0 18px; }
.shot img { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.shot .cap { font-size: 10px; color: #6b7280; margin-top: 5px; font-style: italic; }
.muted { color:#6b7280; }
"""


def md_to_html(text: str) -> str:
    return markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "toc", "sane_lists"],
    )


def build_html() -> str:
    parts = [f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>"]

    # Cover
    parts.append(
        """
        <div class='cover'>
          <div class='logo'>x</div>
          <h1>xQuesty Admin Dashboard</h1>
          <div class='sub'>Complete Rebuild — Engineering &amp; Architecture Guide</div>
          <div style='margin-top:28px'>
            <span class='pill'>MVC</span><span class='pill'>FastAPI</span>
            <span class='pill'>React + Vite</span><span class='pill'>Supabase</span>
            <span class='pill'>No schema changes</span>
          </div>
          <div class='meta'>
            Sprint: Admin Dashboard Rebuild<br/>
            Backend module: <code>backend/app/admin</code> &nbsp;·&nbsp;
            Frontend module: <code>frontend/src/admin</code><br/>
            Educational reference for onboarding developers.
          </div>
        </div>
        """
    )

    # TOC
    toc = ["<div class='toc'><h1>Contents</h1><ol>"]
    for title, _ in SECTIONS:
        toc.append(f"<li>{title}</li>")
    toc.append("<li>Screenshots</li>")
    toc.append("</ol></div>")
    parts.append("".join(toc))

    # Sections
    for title, fname in SECTIONS:
        raw = (HERE / fname).read_text(encoding="utf-8")
        html = md_to_html(raw)
        parts.append(f"<div class='section'>{html}</div>")

    # Gallery
    gal = ["<div class='gallery'><h1>Screenshots</h1>",
           "<p class='muted'>Captured from the live application driving real data "
           "(Playwright). Files in <code>screenshots/</code>.</p>"]
    for fname, cap in GALLERY:
        if (SHOTS / fname).exists():
            gal.append(
                f"<div class='shot'><img src='screenshots/{fname}'/>"
                f"<div class='cap'>{cap}</div></div>"
            )
    gal.append("</div>")
    parts.append("".join(gal))

    parts.append("</body></html>")
    return "".join(parts)


def main():
    html = build_html()
    html_path = HERE / "admin-dashboard.html"
    html_path.write_text(html, encoding="utf-8")
    print(f"wrote {html_path.name} ({len(html)//1024} KB)")

    pdf_path = HERE / "admin-dashboard.pdf"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(html_path.as_uri(), wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            print_background=True,
            margin={"top": "16mm", "bottom": "16mm", "left": "14mm", "right": "14mm"},
        )
        browser.close()
    size = pdf_path.stat().st_size // 1024
    print(f"wrote {pdf_path.name} ({size} KB)")


if __name__ == "__main__":
    main()
