import { getCalendars, getAuthorizationStatus, requestFullAccessToEvents } from 'eventkit-node';
import { saveConfig, type ICalConfig } from './config';

export async function simpleSetup(): Promise<string[] | null> {
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

    console.log('Available calendars:');
    calendars.forEach((cal, index) => {
      const marker = cal.allowsContentModifications ? '✓' : ' ';
      console.log(`${marker} ${index + 1}. ${cal.title} (${cal.source})`);
    });

    console.log('\n✓ = Recommended (calendars you can modify)');
    console.log('\nEnter calendar numbers to include (e.g., 1,3,15) or press Enter for recommended:');

    // Read user input
    const input = await new Promise<string>((resolve) => {
      process.stdin.setRawMode(false);
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });

    let selectedCalendarIds: string[] = [];

    if (input === '') {
      // Use recommended calendars (modifiable ones)
      selectedCalendarIds = calendars
        .filter(cal => cal.allowsContentModifications)
        .map(cal => cal.id);
      
      console.log('\nUsing recommended calendars:');
      selectedCalendarIds.forEach(id => {
        const cal = calendars.find(c => c.id === id);
        if (cal) console.log(`  - ${cal.title}`);
      });
    } else {
      // Parse user input
      const indices = input.split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => n >= 1 && n <= calendars.length);
      
      selectedCalendarIds = indices.map(i => calendars[i - 1].id);
      
      console.log('\nSelected calendars:');
      selectedCalendarIds.forEach(id => {
        const cal = calendars.find(c => c.id === id);
        if (cal) console.log(`  - ${cal.title}`);
      });
    }

    if (selectedCalendarIds.length === 0) {
      console.log('No calendars selected.');
      return null;
    }

    // Save configuration
    const config: ICalConfig = {
      targetCalendars: selectedCalendarIds,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    
    saveConfig(config);
    console.log('\n✅ Configuration saved successfully!');
    console.log('\nNow you can use:');
    console.log('  ical        - Show today\'s events');
    console.log('  ical tom    - Show tomorrow\'s events');
    console.log('  ical week   - Show this week\'s events');
    
    return selectedCalendarIds;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return null;
  }
}