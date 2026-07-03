# Strava Route Weather Conditions

This directory stores weather context for the Strava GPS skate map list.

`strava_routes_weather_conditions_9pm_midnight.csv` is the source table used to
join skate route records to local weather observations. Each row represents one
route, with the route date, title, route URL, daily rain context, and local
hourly weather summarized for the 9 PM to midnight skate window.

The 9 PM to midnight window is a local-time route-context window. It is shown
separately from the full-day downtown station record because a day can include
rain outside the skate window, and a skate window can include observed rain even
when the full-day summary needs separate review.

The generated JSON file is built for the browser page:

```sh
python scripts/build_strava_weather_json.py
python scripts/validate_strava_weather_json.py
```

The page uses both daily rain and skate-window rain as route-context evidence.
This can rebut categorical assumptions by documenting completed skate routes
under recorded weather conditions, but it does not claim rain is always safe or
replace route, setting, surface, skill, and factual review.
