# Strava Route Weather Conditions

This directory stores weather context for the Strava GPS skate map list.

`strava_routes_weather_conditions_9pm_midnight.csv` is the existing source table
used to join skate route records to local weather observations. Each retained
Friday or Saturday route has exactly one row and an explicit coverage status.
The filename is preserved for URL and pipeline compatibility.

The 9 PM to midnight window is a local-time route-context window. It is shown
separately from the full-day downtown station record because a day can include
rain outside the skate window, and a skate window can include observed rain even
when the full-day summary needs separate review.

Legacy rows retain that NOAA NCEI fixed-window context. Newly imported routes
use the activity-time weather observation supplied by the Strava export and
record its local route interval. Those point observations do not claim complete
interval coverage; the upstream provider and station are marked unavailable
when Strava does not identify them. Missing observations remain present with an
explicit `unavailable` status, and no weather values are invented.

The generated JSON file is built for the browser page:

```sh
python scripts/build_strava_weather_json.py
python scripts/validate_strava_weather_json.py
```

The page uses both daily rain and skate-window rain as route-context evidence.
This can rebut categorical assumptions by documenting completed skate routes
under recorded weather conditions, but it does not claim rain is always safe or
replace route, setting, surface, skill, and factual review.
