#!/usr/bin/env bun

import { 
  getAuthorizationStatus,
  requestFullAccessToEvents, 
  createEventPredicate, 
  getEventsWithPredicate,
  type Event 
} from 'eventkit-node';
import { loadConfig, configExists, resetConfig } from './config';
import { setupCalendars, showCurrentConfig } from './setup';

function getDateRange(option: string) {
  const today = new Date();
  
  switch (option) {
    case 'tom':
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return {
        start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0),
        end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59),
        label: 'tomorrow'
      };
    }
    case 'w':
    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
      endOfWeek.setHours(23, 59, 59, 999);
      
      return {
        start: startOfWeek,
        end: endOfWeek,
        label: 'this week'
      };
    }
    case 'today':
    default: {
      return {
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
        label: 'today'
      };
    }
  }
}

async function getEvents(option: string = 'today') {
  try {
    // Load configuration
    const config = loadConfig();
    
    if (!config || config.targetCalendars.length === 0) {
      console.log('No calendar configuration found. Running setup...\n');
      const selectedCalendars = await setupCalendars();
      if (!selectedCalendars || selectedCalendars.length === 0) {
        console.log('Setup cancelled or failed.');
        return;
      }
      // Reload config after setup
      const newConfig = loadConfig();
      if (!newConfig) {
        console.log('Failed to load configuration.');
        return;
      }
    }
    
    // Check current authorization status first
    const currentStatus = getAuthorizationStatus('event');
    
    let hasAccess = false;
    
    if (currentStatus === 'fullAccess' || currentStatus === 'authorized') {
      hasAccess = true;
    } else {
      hasAccess = await requestFullAccessToEvents();
    }
    
    if (!hasAccess) {
      console.log('Calendar access denied. Please check system preferences.');
      return;
    }

    // Get date range based on option
    const { start, end, label } = getDateRange(option);

    // Create predicate for events with target calendars
    const finalConfig = loadConfig();
    const predicate = createEventPredicate(start, end, finalConfig?.targetCalendars);
    
    // Get events
    const events = getEventsWithPredicate(predicate);

    if (events.length === 0) {
      console.log(`No events scheduled for ${label}.`);
      return;
    }

    // Sort events by start time
    events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    events.forEach((event: Event) => {
      let timeDisplay: string;
      
      if (event.isAllDay) {
        timeDisplay = 'All Day';
      } else {
        const startTime = event.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const endTime = event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        timeDisplay = `${startTime} - ${endTime}`;
      }
      
      let eventLine = `- ${event.title} (${timeDisplay})`;
      
      // For week view, add date
      if (option === 'w' || option === 'week') {
        const eventDate = event.startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        eventLine = `- [${eventDate}] ${event.title} (${timeDisplay})`;
      }
      
      if (event.location) {
        const firstLine = event.location.split('\n')[0]?.trim();
        if (firstLine) {
          eventLine += ` @ ${firstLine}`;
        }
      }
      
      if (event.notes) {
        eventLine += ` - ${event.notes}`;
      }
      
      console.log(eventLine);
    });

  } catch (error) {
    console.error('Error occurred:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'today';

async function main() {
  switch (command) {
    case 'setup':
      await setupCalendars();
      break;
      
    case 'config':
      const config = loadConfig();
      showCurrentConfig(config);
      break;
      
    case 'reset':
      resetConfig();
      console.log('✅ Configuration reset. Run "ical setup" to reconfigure.');
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      // Handle date options (today, tom, tomorrow, w, week)
      await getEvents(command);
      break;
  }
}

function showHelp() {
  console.log(`
📅 ical - Calendar Events CLI

USAGE:
  ical [COMMAND | DATE_OPTION]

DATE OPTIONS:
  (none)     Show today's events (default)
  today      Show today's events  
  tom        Show tomorrow's events
  tomorrow   Show tomorrow's events
  w          Show this week's events
  week       Show this week's events

COMMANDS:
  setup      Set up which calendars to display
  config     Show current configuration
  reset      Reset configuration
  help       Show this help message

EXAMPLES:
  ical              # Today's events
  ical tom          # Tomorrow's events  
  ical setup        # Choose calendars
  ical config       # View settings
`);
}

await main();