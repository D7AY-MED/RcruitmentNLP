"""Tests for CompanyService aggregation and ReportService serialisation."""

from types import SimpleNamespace

from app.admin.services.company_service import CompanyService
from app.admin.services.report_service import ReportService, _cell


# --- CompanyService ----------------------------------------------------------

def _company_service(recruiters, pools):
    svc = CompanyService()
    svc.recruiters = SimpleNamespace(
        list_all=lambda: recruiters,
        update_company_fields=lambda name, data: recruiters,
    )
    svc.pools = SimpleNamespace(list_all=lambda: pools)
    return svc


def test_companies_grouped_by_name():
    recruiters = [
        {"id": "h1", "full_name": "Bob", "email": "b@x.com", "company_name": "Acme",
         "company_industry": "Tech", "created_at": "t1"},
        {"id": "h2", "full_name": "Sue", "email": "s@x.com", "company_name": "Acme",
         "company_industry": None, "created_at": "t2"},
        {"id": "h3", "full_name": "Jo", "email": "j@y.com", "company_name": "Globex",
         "created_at": "t3"},
    ]
    pools = [{"hr_id": "h1"}, {"hr_id": "h1"}, {"hr_id": "h3"}]
    svc = _company_service(recruiters, pools)
    companies = svc.list_companies()
    acme = next(c for c in companies if c["company_name"] == "Acme")
    assert acme["recruiters"] == 2
    assert acme["jobs"] == 2          # both pools belong to h1 (Acme)
    assert acme["company_industry"] == "Tech"  # first non-null wins
    assert len(companies) == 2


def test_company_search_filter():
    recruiters = [{"id": "h1", "company_name": "Acme", "created_at": "t"}]
    svc = _company_service(recruiters, [])
    assert len(svc.list_companies(search="acm")) == 1
    assert len(svc.list_companies(search="zzz")) == 0


# --- ReportService -----------------------------------------------------------

def test_cell_serialisation():
    assert _cell(None) == ""
    assert _cell(True) == "Yes"
    assert _cell(False) == "No"
    assert _cell(["a", "b"]) == "a, b"
    assert _cell("plain") == "plain"


def test_csv_export_has_header_and_rows():
    svc = ReportService()
    svc.candidates = SimpleNamespace(list_all=lambda: [
        {"id": "c1", "full_name": "Alice", "email": "a@x.com", "open_to_work": True},
    ])
    data = svc.to_csv("candidates").decode("utf-8-sig")
    lines = [ln for ln in data.splitlines() if ln.strip()]
    assert lines[0].startswith("id,full_name,email")
    assert "Alice" in lines[1]
    assert "Yes" in lines[1]  # open_to_work bool rendered


def test_xlsx_export_is_valid_zip():
    svc = ReportService()
    svc.candidates = SimpleNamespace(list_all=lambda: [
        {"id": "c1", "full_name": "Alice", "email": "a@x.com"},
    ])
    blob = svc.to_xlsx("candidates")
    # XLSX is a zip; the magic bytes are 'PK'.
    assert blob[:2] == b"PK"
    assert len(blob) > 100
