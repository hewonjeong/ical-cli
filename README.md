# ical-cli

Simple macOS calendar CLI to view your events in terminal.

## Installation

```bash
npm install -g ical-cli
```

## Usage

```bash
# Today's events
ical

# Tomorrow's events  
ical tom

# This week's events
ical week

# Setup calendars
ical setup

# View configuration
ical config
```

## Features

- 📅 View today, tomorrow, or week events
- 🎯 Select specific calendars to display
- ⏰ Clean formatting for all-day and timed events
- 📍 Show event locations (first line only)
- 🔧 Simple configuration management

## Requirements

- macOS (uses EventKit framework)
- Node.js 18+

## Commands

| Command | Description |
|---------|-------------|
| `ical` | Show today's events |
| `ical tom` | Show tomorrow's events |
| `ical week` | Show this week's events |
| `ical setup` | Choose which calendars to display |
| `ical config` | View current configuration |
| `ical reset` | Reset configuration |

## Development

```bash
git clone https://github.com/hewonjeong/ical-cli.git
cd ical-cli
bun install
bun index.ts
```
