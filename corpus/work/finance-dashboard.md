# Finance Dashboard

Live demo (read-only, sample portfolio): https://marcfors-finance.vercel.app
Stack: Next.js, Prisma, SQLite, Claude API.

## Problem

Personal metals, crypto and portfolio positions needed cost basis and alerts without sending holdings to a multi-tenant SaaS.

## Approach

A single-user Next.js app on Prisma and SQLite tracks metals, crypto and portfolio rows, raises alerts, and can optionally import from Revolut X.

## Result

A private finance desk for one operator — no public source link.

## Links

Stack: Next.js, Prisma, SQLite.
Private source.
Case study: /work/finance-dashboard

A floating Ask chat answers questions about the whole dashboard — holdings, prices, alerts, settings and every chart range — through embedded-rag over a snapshot of the page, and each answer's sources scroll to the card they came from. A wide golden eval checks answers, citations and abstains in English and Spanish.
