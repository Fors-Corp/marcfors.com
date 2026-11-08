# forsight

## Problem

I wanted an observability stack I could version as two artifacts from one tree: the agent that collects and serves, and the React library it renders through.

## Approach

forsight ships a Go agent that collects metrics, serves an HTTP API and embeds its own dashboard, with ML anomaly scoring and forecasts, alongside the React component library used to draw it. The public Pages site is the demo surface.

## Result

A living observability instrument with a public demo and private source.

## Links

Stack: Go, TypeScript, React.
Live: https://fors-corp.github.io/forsight/
Private source.
Case study: /work/forsight
