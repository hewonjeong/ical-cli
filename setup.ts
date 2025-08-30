import { checkbox, confirm, select } from '@inquirer/prompts';
import { getCalendars, getAuthorizationStatus, requestFullAccessToEvents } from 'eventkit-node';
import { saveConfig, type ICalConfig } from './config';

export async function setupCalendars(): Promise<string[] | null> {
  try {
    console.log('📅 Setting up your calendar preferences...\n');
    
    // Check and request calendar access
    let hasAccess = false;
    const currentStatus = getAuthorizationStatus('event');
    
    if (currentStatus === 'fullAccess' || currentStatus === 'authorized') {
      hasAccess = true;
    } else {
      console.log('Requesting calendar access...');
      hasAccess = await requestFullAccessToEvents();
    }
    
    if (!hasAccess) {
      console.log('❌ Calendar access denied. Please check system preferences.');
      return null;
    }

    const calendars = getCalendars('event');
    
    if (calendars.length === 0) {
      console.log('No calendars found.');
      return null;
    }

    // Create choices for calendar selection - sorted by source alphabetically, then by calendar name
    const choices = calendars
      .sort((a, b) => {
        // First sort by source alphabetically
        const sourceCompare = a.source.localeCompare(b.source);
        if (sourceCompare !== 0) {
          return sourceCompare;
        }
        // Then sort by title within the same source
        return a.title.localeCompare(b.title);
      })
      .map(cal => ({
        name: `${cal.title} (${cal.source})`,
        value: cal.id,
        checked: cal.allowsContentModifications // Default: select modifiable calendars
      }));

    console.log('Select which calendars to display events from:');
    
    const selectedCalendarIds = await checkbox({
      message: 'Choose calendars (Space to select/deselect, Enter to confirm)',
      choices: choices,
      pageSize: Math.min(choices.length, 10),
      loop: false,
      instructions: false,
    });

    if (selectedCalendarIds.length === 0) {
      console.log('No calendars selected. Please select at least one calendar.');
      return null;
    }

    console.log('\n✅ Selected calendars:');
    selectedCalendarIds.forEach(id => {
      const cal = calendars.find(c => c.id === id);
      if (cal) {
        console.log(`  - ${cal.title}`);
      }
    });

    const shouldSave = await confirm({
      message: '\nSave this configuration?',
      default: true,
    });

    if (shouldSave) {
      const config: ICalConfig = {
        targetCalendars: selectedCalendarIds,
        lastUpdated: new Date().toISOString(),
        version: '1.0'
      };
      
      saveConfig(config);
      console.log('✅ Configuration saved successfully!\n');
      console.log('Now you can use:');
      console.log('  ical        - Show today\'s events');
      console.log('  ical tom    - Show tomorrow\'s events');
      console.log('  ical week   - Show this week\'s events');
      
      return selectedCalendarIds;
    }

    return null;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return null;
  }
}

export function showCurrentConfig(config: ICalConfig | null): void {
  if (!config) {
    console.log('No configuration found. Run "ical setup" to get started.');
    return;
  }

  console.log('📅 Current configuration:');
  console.log(`Last updated: ${new Date(config.lastUpdated).toLocaleString()}`);
  console.log(`Target calendars: ${config.targetCalendars.length} selected`);
  
  // Show calendar names if possible
  try {
    const status = getAuthorizationStatus('event');
    if (status === 'fullAccess' || status === 'authorized') {
      const allCalendars = getCalendars('event');
      console.log('\nSelected calendars:');
      config.targetCalendars.forEach(id => {
        const cal = allCalendars.find(c => c.id === id);
        if (cal) {
          console.log(`  - ${cal.title}`);
        } else {
          console.log(`  - Unknown calendar (${id.substring(0, 8)}...)`);
        }
      });
    }
  } catch (error) {
    // Silently fail if can't access calendars
  }
}