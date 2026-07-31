from __future__ import annotations

import csv
import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "evidence" / "strava-gps-skate-maps" / "data"
CSV_PATH = DATA_DIR / "strava_routes_weather_conditions_9pm_midnight.csv"
JSON_PATH = DATA_DIR / "strava_routes_weather_conditions_9pm_midnight.json"

REQUIRED_FIELDS = {
    "date",
    "route_title",
    "route_url",
    "substantial_weather_flag",
    "rain_between_9pm_midnight",
    "downtown_daily_rain",
    "window_precip_inches",
    "daily_precip_inches",
    "temp_label",
    "wind_label",
    "visibility_label",
    "route_key",
    "weather_badge_label",
    "weather_severity",
    "rain_window_label",
    "daily_rain_label",
    "evidence_summary",
    "activity_id",
    "activity_start_local",
    "weather_source",
    "weather_provider",
    "weather_station",
    "weather_coverage_status",
    "weather_missing_reason",
}

ROUTE_RE = re.compile(
    r'<li><a href="/maps/(?P<filename>[^"]+-(?P<activity_id>\d+)\.html)">'
    r"(?P<label>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} - .*?)</a></li>"
)


def contains_nan_string(value: object) -> bool:
    if isinstance(value, str):
        return bool(re.search(r"\bnan\b", value, flags=re.IGNORECASE))
    if isinstance(value, list):
        return any(contains_nan_string(item) for item in value)
    if isinstance(value, dict):
        return any(contains_nan_string(item) for item in value.values())
    return False


def main() -> None:
    if not JSON_PATH.exists():
        raise SystemExit(f"Missing JSON: {JSON_PATH.relative_to(ROOT)}")

    with CSV_PATH.open(newline="", encoding="utf-8") as csv_file:
        csv_rows = list(csv.DictReader(csv_file))

    payload = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    records = payload.get("records")
    if not isinstance(records, list):
        raise SystemExit("JSON payload must contain a records list")

    if len(records) != len(csv_rows):
        raise SystemExit(f"Row count mismatch: CSV={len(csv_rows)} JSON={len(records)}")

    for index, record in enumerate(records, start=1):
        missing = REQUIRED_FIELDS - set(record)
        if missing:
            raise SystemExit(
                f"Record {index} is missing required fields: {sorted(missing)}"
            )

    if not any(record.get("rain_between_9pm_midnight") is True for record in records):
        raise SystemExit("Expected at least one rain_between_9pm_midnight=true record")

    if not any(record.get("downtown_daily_rain") is True for record in records):
        raise SystemExit("Expected at least one downtown_daily_rain=true record")

    csv_urls = [row["route_url"] for row in csv_rows]
    json_urls = [record.get("route_url") for record in records]
    if csv_urls != json_urls:
        raise SystemExit("route_url values are not preserved in row order")

    if contains_nan_string(payload):
        raise SystemExit("JSON contains a raw NaN string")

    index_path = ROOT / "evidence/strava-gps-skate-maps/index.html"
    index_text = index_path.read_text(encoding="utf-8")
    listed = list(ROUTE_RE.finditer(index_text))
    if len(listed) != len(records):
        raise SystemExit(
            f"Route/weather count mismatch: routes={len(listed)} weather={len(records)}"
        )
    route_ids = []
    for match in listed:
        local_start = datetime.strptime(match.group("label")[:19], "%Y-%m-%d %H:%M:%S")
        if local_start.weekday() not in {4, 5}:
            raise SystemExit(
                f"Non-Friday/Saturday route remains: {match.group('label')}"
            )
        route_ids.append(match.group("activity_id"))

    weather_ids = [str(record.get("activity_id") or "") for record in records]
    if route_ids != weather_ids:
        raise SystemExit("Route and weather activity IDs are not aligned in row order")
    for index, record in enumerate(records, start=1):
        coverage = record.get("weather_coverage_status")
        if coverage not in {
            "legacy_fixed_local_window",
            "activity_time_point_observation",
            "unavailable",
        }:
            raise SystemExit(
                f"Record {index} has invalid weather coverage status: {coverage}"
            )
        if coverage == "unavailable" and not record.get("weather_missing_reason"):
            raise SystemExit(f"Record {index} lacks an explicit weather missing reason")

    missing = sum(
        record.get("weather_coverage_status") == "unavailable" for record in records
    )
    print(
        f"Validated {len(records)} Friday/Saturday Strava weather records "
        f"({missing} explicitly unavailable)"
    )


if __name__ == "__main__":
    main()
