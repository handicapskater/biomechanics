.PHONY: validate-fsi-data-page validate-fsi-snapshot validate-home-pain-precedent validate-site-entry

PYTHON ?= python

validate-fsi-data-page:
	$(PYTHON) scripts/validate_fsi_data_page_snapshot.py

validate-fsi-snapshot: validate-fsi-data-page

validate-home-pain-precedent:
	$(PYTHON) scripts/validate_home_pain_precedent.py

validate-site-entry: validate-home-pain-precedent validate-fsi-data-page
