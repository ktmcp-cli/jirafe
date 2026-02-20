# AGENT.md — Jirafe Events CLI for AI Agents

This document explains how to use the Jirafe Events CLI as an AI agent.

## Overview

The `jirafe` CLI provides event tracking for analytics and e-commerce monitoring.

## Prerequisites

```bash
jirafe config set --site-id <id> --token <token>
```

## All Commands

### Config

```bash
jirafe config set --site-id YOUR_SITE_ID --token YOUR_TOKEN
jirafe config show
```

### Track Events

#### Page Views

```bash
jirafe track pageview "/home"
jirafe track pageview "/products" --title "Products" --referrer "/home"
```

#### Products

```bash
jirafe track product view prod-123
jirafe track product add_to_cart prod-123 --name "Shoes" --price 89.99
jirafe track product purchase prod-123
```

#### Cart

```bash
jirafe track cart add --total 199.99
jirafe track cart checkout --total 499.99
```

#### Orders

```bash
jirafe track order order-123 --total 299.99
jirafe track order order-456 --items '[{"id":"prod-1","qty":2}]'
```

#### Users

```bash
jirafe track user signup user-789 --email "user@example.com"
jirafe track user login user-789
```

#### Custom Events

```bash
jirafe track custom "event_name" '{"key":"value"}'
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. Event data should be valid JSON for custom events
3. Product actions: view, add_to_cart, purchase
4. Cart actions: add, remove, checkout
5. User actions: signup, login, update
