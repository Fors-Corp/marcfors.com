# Mensura

Mensura is a private, single-user on-device tracker. A self-made ML model auto-learns an hourly forecast from the user’s own logs. Entries and model fits stay in the browser’s localStorage; the app does not send personal logs to a server.

## How the forecast learns

There is no population model or cloud training job. Mensura builds a fit from the user’s own recent history (up to about 180 calendar days of hourly records). The forecast has two parts: a regularised logistic model estimates the probability of activity in each hour, and a challenger based on gradient-boosted trees can replace it when validation supports the change. Ridge regression estimates amount conditional on activity. Features use only information available before the hour being predicted: clock and weekday patterns, recency after previous logs, same-day activity so far, recent overall rate, and related logged series. Recent days carry more weight; a detected change in pattern can shorten that memory.

## From a fit to an outlook

Mensura uses Monte Carlo simulation to project the remaining hours of a day many times. Simulated activity feeds back into later hours in that same simulated day. The paths produce an expected daily total, a next-hour probability and an hourly risk profile. If the log is too sparse, the app falls back to an hour-of-day profile rather than presenting unsupported precision.

## Boundaries and privacy

Optional access key encryption covers local data and automatic backups in the browser. Page-view analytics are separate and do not receive log contents. The forecast is a personal heuristic for reflection, not a diagnosis, treatment recommendation or clinical predictor.

Live: https://mensura.cc
Stack: Vite, React, TypeScript.
