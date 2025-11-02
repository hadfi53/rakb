/**
 * Console Protection
 * Disables console methods in production and detects DevTools usage
 */

// Only enable protection in production
if (import.meta.env.PROD) {
  // Disable all console methods
  const noop = () => {};
  const consoleMethods = [
    'log',
    'info',
    'warn',
    'error',
    'debug',
    'trace',
    'table',
    'group',
    'groupCollapsed',
    'groupEnd',
    'clear',
    'count',
    'time',
    'timeEnd',
    'assert',
    'dir',
    'dirxml',
    'profile',
    'profileEnd',
  ];

  consoleMethods.forEach((method) => {
    if (console[method as keyof Console]) {
      (console as any)[method] = noop;
    }
  });

  // Detect DevTools opening (optional - can be bypassed)
  let devtools = { open: false, orientation: null as 'vertical' | 'horizontal' | null };
  const threshold = 160;

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Optionally redirect or show warning
        // window.location.href = '/';
      }
    } else {
      if (devtools.open) {
        devtools.open = false;
      }
    }
  }, 500);

  // Disable right-click context menu (basic protection)
  document.addEventListener('contextmenu', (e) => {
    if (import.meta.env.PROD) {
      e.preventDefault();
    }
  });

  // Disable common keyboard shortcuts for DevTools
  document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      import.meta.env.PROD &&
      (e.key === 'F12' ||
       (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
       (e.ctrlKey && e.key === 'U'))
    ) {
      e.preventDefault();
      return false;
    }
  });
}

// Export function to manually disable console if needed
export const disableConsole = () => {
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const noop = () => {};
    Object.keys(console).forEach((key) => {
      if (typeof (console as any)[key] === 'function') {
        (console as any)[key] = noop;
      }
    });
  }
};

