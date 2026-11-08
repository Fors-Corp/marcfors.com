# LMaaS

## Problem

My own apps needed local language-model inference and versioned ML releases without depending on a cloud provider for every call.

## Approach

LMaaS is a self-hosted service on Apple Silicon: a Go API that speaks an OpenAI-compatible surface for local models, plus train, serve and retrain flows behind SemVer releases, with a React console.

## Result

A private model desk my products can call locally, with a console demo live and source unpublished.

## Links

Stack: Go, React, TypeScript.
Live: https://mlaas-console.vercel.app
Private source.
Case study: /work/lmaas
