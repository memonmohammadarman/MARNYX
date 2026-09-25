# MARNYX Architecture

## Version

0.1.0

## Overview

MARNYX is an AI workspace platform designed around a modular
frontend, backend, database, AI services, and future tool/agent systems.

## Core Architecture

React Frontend
        |
        | HTTP/API
        v
Node.js Backend
        |
        v
PostgreSQL

## Main Applications

### Web

React + TypeScript frontend.

Location:

apps/web

### API

Node.js + TypeScript backend.

Location:

apps/api

## Shared Packages

Reusable types and utilities.

Location:

packages/shared

## Infrastructure

Docker and future deployment configuration.

Location:

infrastructure/
