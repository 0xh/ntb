import * as path from 'path';
import * as fs from 'fs';


const DEV_SETTINGS_FILE = path.resolve(
  __dirname, '..', '..', 'settings-dev.json',
);
const TEST_SETTINGS_FILE = path.resolve(
  __dirname, '..', '..', 'settings-test.json',
);
let OVERRIDE_SETTINGS_FILE: string | undefined;

// Use settings file for test
if (process.env.NODE_ENV === 'test') {
  OVERRIDE_SETTINGS_FILE = TEST_SETTINGS_FILE;
}

// Use settings file for development
if (process.env.NODE_ENV === 'development') {
  OVERRIDE_SETTINGS_FILE = DEV_SETTINGS_FILE;
}

// Read from override file if exists
let settingsJson = {} as { [index: string]: string | undefined };
if (OVERRIDE_SETTINGS_FILE && fs.existsSync(OVERRIDE_SETTINGS_FILE)) {
  const settingsFile = fs.readFileSync(OVERRIDE_SETTINGS_FILE, 'utf-8');
  settingsJson = JSON.parse(settingsFile);
}


export default function getEnvValue(
  name: string, type: 'string', required: false, defaultValue: string,
): string;
export default function getEnvValue(
  name: string, type: 'string', required: false, defaultValue: null,
): string | null;
export default function getEnvValue(
  name: string, type: 'string', required: true,
): string;
export default function getEnvValue(
  name: string, type: 'number', required: false, defaultValue: number,
): number;
export default function getEnvValue(
  name: string, type: 'number', required: false, defaultValue: null,
): number | null;
export default function getEnvValue(
  name: string, type: 'number', required: true,
): number;

export default function getEnvValue(
  name: string,
  type: 'string' | 'number',
  required: boolean = false,
  defaultValue: string | number | null = null,
): string | number | null {
  let value: number | string | undefined | null =
    settingsJson[name] || process.env[name];
  const valueIsNotSet = value === null || value === undefined;

  if (type === 'number' && value) {
    value = +value;
  }

  if (defaultValue && valueIsNotSet) {
    value = defaultValue;
  }

  if (required && valueIsNotSet) {
    const settingsFileInfo = OVERRIDE_SETTINGS_FILE
      ? ` (Using settingsfile: ${OVERRIDE_SETTINGS_FILE})`
      : '';
    console.log(settingsJson);
    throw new Error(
      `The environment variable ${name} is required${settingsFileInfo}`,
    );
  }

  return value === undefined ? null : value;
}
