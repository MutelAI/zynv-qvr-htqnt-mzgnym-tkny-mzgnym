import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

// Override console to use red color
const _originalLog = console.log.bind(console);
const _originalWarn = console.warn.bind(console);
const _originalError = console.error.bind(console);

console.log = (...args: unknown[]) => {
  _originalLog('%c' + args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(' '), 'color: red');
};

console.warn = (...args: unknown[]) => {
  _originalWarn('%c[WARN] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(' '), 'color: red; font-weight: bold');
};

console.error = (...args: unknown[]) => {
  const parts = args.map(a => {
    if (a instanceof Error) {
      return `${a.name}: ${a.message}\n${a.stack ?? ''}`;
    }
    if (typeof a === 'object') {
      return JSON.stringify(a, null, 2);
    }
    return String(a);
  });
  _originalError('%c[ERROR] ' + parts.join('\n'), 'color: red; font-weight: bold; font-size: 13px');
};

bootstrapApplication(App, appConfig);

