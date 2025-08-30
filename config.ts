import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync, writeFileSync } from 'fs';

export interface ICalConfig {
  targetCalendars: string[];
  lastUpdated: string;
  version: string;
}

const CONFIG_FILE_PATH = join(homedir(), '.ical-config.json');

export function configExists(): boolean {
  return existsSync(CONFIG_FILE_PATH);
}

export function loadConfig(): ICalConfig | null {
  try {
    if (!configExists()) {
      return null;
    }
    
    const content = readFileSync(CONFIG_FILE_PATH, 'utf8');
    return JSON.parse(content) as ICalConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

export function saveConfig(config: ICalConfig): void {
  try {
    config.lastUpdated = new Date().toISOString();
    config.version = '1.0';
    
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

export function resetConfig(): void {
  try {
    if (configExists()) {
      writeFileSync(CONFIG_FILE_PATH, '', 'utf8');
    }
  } catch (error) {
    console.error('Error resetting config:', error);
  }
}