from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "evidence" / "strava-gps-skate-maps" / "data"
CSV_PATH = DATA_DIR / "strava_routes_weather_conditions_9pm_midnight.csv"
JSON_PATH = DATA_DIR / "strava_routes_weather_conditions_9pm_midnight.json"

BOOLEAN_FIELDS = {
    "substantial_weather_flag",
    "rain_between_9pm_midnight",
    "downtown_daily_rain",
    "weather_hourly_available",
}

INTEGER_FIELDS = {
    "rain_hours",
    "weather_hourly_observed_hours",
}

NUMERIC_FIELDS = {
    "window_precip_inches",
    "max_hourly_precip_inches",
    "daily_precip_inches",
    "temp_mean_f",
    "temp_min_f",
    "temp_max_f",
    "dew_point_mean_f",
    "relative_humidity_mean_pct",
    "wind_speed_mean_mph",
    "wind_speed_max_mph",
    "wind_gust_max_mph",
    "wind_direction_mean_deg",
    "visibility_min_miles",
    "visibility_mean_miles",
    "weather_hourly_station_lat",
    "weather_hourly_station_lon",
    "daily_station_lat",
    "daily_station_lon",
}


def normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def sanitize_text(value: str | None) -> str | None:
    if value is None:
        return None
    text = normalize_whitespace(str(value))
    if not text or text.lower() in {"nan", "null", "none", "na", "n/a"}:
        return None
    text = re.sub(
        r"\bmax gust\s+nan\s+mph\b",
        "max gust unavailable",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"\bnan\s*(mph|inches|inch|miles|mi|f|°f)?\b",
        "unavailable",
        text,
        flags=re.IGNORECASE,
    )
    return text


def parse_bool(value: str | None) -> bool | None:
    text = sanitize_text(value)
    if text is None:
        return None
    lowered = text.lower()
    if lowered in {"true", "1", "yes", "y"}:
        return True
    if lowered in {"false", "0", "no", "n"}:
        return False
    return None


def parse_number(value: str | None, *, as_integer: bool = False) -> float | int | None:
    text = sanitize_text(value)
    if text is None:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    if math.isnan(number) or math.isinf(number):
        return None
    if as_integer:
        return int(number)
    return number


def normalize_url_path(value: str | None) -> str | None:
    text = sanitize_text(value)
    if not text:
        return None
    parsed = urlparse(text)
    path = parsed.path if parsed.scheme or parsed.netloc else text
    path = unquote(path).strip()
    if not path:
        return None
    if not path.startswith("/"):
        path = "/" + path
    return path.lower()


def normalize_title(value: str | None) -> str:
    text = sanitize_text(value) or ""
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def date_title_key(date: str | None, title: str | None) -> str:
    return f"{sanitize_text(date) or ''}|{normalize_title(title)}"


def route_key(row: dict[str, object]) -> str:
    path = normalize_url_path(str(row.get("route_url") or ""))
    if path:
        return f"url:{path}"
    return f"date_title:{date_title_key(str(row.get('date') or ''), str(row.get('route_title') or ''))}"


def fmt_number(value: object, digits: int = 1) -> str:
    if value is None:
        return "unavailable"
    number = float(value)
    return f"{number:.{digits}f}"


def fmt_precip(value: object) -> str:
    if value is None:
        return "unavailable"
    number = float(value)
    if number == 0:
        return "0.00"
    return f"{number:.3f}".rstrip("0").rstrip(".")


def temp_label(row: dict[str, object]) -> str:
    mean = row.get("temp_mean_f")
    low = row.get("temp_min_f")
    high = row.get("temp_max_f")
    category = row.get("temp_category") or "uncategorized"
    if mean is None and low is None and high is None:
        return f"Temperature unavailable, {category}"
    return f"{fmt_number(mean)}°F mean, {fmt_number(low, 0)}-{fmt_number(high, 0)}°F, {category}"


def wind_label(row: dict[str, object]) -> str:
    mean = row.get("wind_speed_mean_mph")
    max_wind = row.get("wind_speed_max_mph")
    gust = row.get("wind_gust_max_mph")
    category = row.get("wind_category") or "uncategorized"
    gust_text = "gust unavailable" if gust is None else f"{fmt_number(gust)} mph gust"
    return f"{fmt_number(mean)} mph mean, {fmt_number(max_wind)} mph max, {gust_text}, {category}"


def rain_window_label(row: dict[str, object]) -> str:
    if row.get("rain_between_9pm_midnight"):
        return (
            "Rain 9 PM-midnight: "
            f"{fmt_precip(row.get('window_precip_inches'))} in, "
            f"{fmt_precip(row.get('max_hourly_precip_inches'))} in max hourly, "
            f"{row.get('rain_hours') if row.get('rain_hours') is not None else 'unavailable'} rain hours, "
            f"{row.get('rain_category') or 'rain recorded'}"
        )
    return (
        "No recorded rain 9 PM-midnight"
        if not row.get("rain_category")
        else str(row.get("rain_category"))
    )


def daily_rain_label(row: dict[str, object]) -> str:
    if row.get("downtown_daily_rain"):
        return (
            "Daily rain: "
            f"{fmt_precip(row.get('daily_precip_inches'))} in, "
            f"{row.get('daily_rain_category') or 'downtown daily rain recorded'}"
        )
    return (
        "No downtown daily rain"
        if not row.get("daily_rain_category")
        else str(row.get("daily_rain_category"))
    )


def visibility_label(row: dict[str, object]) -> str:
    category = row.get("visibility_category") or "uncategorized"
    return f"{fmt_number(row.get('visibility_min_miles'))} mi min, {category}"


def badge_label(row: dict[str, object]) -> str:
    if row.get("rain_between_9pm_midnight"):
        return "Rain during skate window"
    if row.get("downtown_daily_rain"):
        return "Rain recorded that day"
    return "No recorded rain"


def severity(row: dict[str, object]) -> str:
    if row.get("rain_between_9pm_midnight"):
        return "rain_window"
    if row.get("downtown_daily_rain"):
        return "daily_rain"
    if row.get("substantial_weather_flag"):
        return "substantial"
    return "none"


def evidence_summary(row: dict[str, object]) -> str:
    title = row.get("route_title") or "route"
    date = row.get("date") or "undated"
    rain = rain_window_label(row)
    daily = daily_rain_label(row)
    temp = temp_label(row)
    wind = wind_label(row)
    visibility = visibility_label(row)
    return f"{date} {title}: {rain}; {daily}; {temp}; {wind}; {visibility}."


def normalize_row(raw: dict[str, str]) -> dict[str, object]:
    row: dict[str, object] = {}
    for field, value in raw.items():
        if field in BOOLEAN_FIELDS:
            row[field] = parse_bool(value)
        elif field in INTEGER_FIELDS:
            row[field] = parse_number(value, as_integer=True)
        elif field in NUMERIC_FIELDS:
            row[field] = parse_number(value)
        else:
            row[field] = sanitize_text(value)

    row["route_url_path"] = normalize_url_path(str(row.get("route_url") or ""))
    row["date_title_key"] = date_title_key(
        str(row.get("date") or ""),
        str(row.get("route_title") or ""),
    )
    row["route_key"] = route_key(row)
    row["weather_badge_label"] = badge_label(row)
    row["weather_severity"] = severity(row)
    row["rain_window_label"] = rain_window_label(row)
    row["daily_rain_label"] = daily_rain_label(row)
    row["temp_label"] = temp_label(row)
    row["wind_label"] = wind_label(row)
    row["visibility_label"] = visibility_label(row)
    row["evidence_summary"] = evidence_summary(row)
    return row


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open(newline="", encoding="utf-8") as csv_file:
        rows = [normalize_row(row) for row in csv.DictReader(csv_file)]

    payload = {
        "source_csv": str(CSV_PATH.relative_to(ROOT)),
        "row_count": len(rows),
        "records": rows,
    }
    JSON_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(rows)} weather records to {JSON_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
