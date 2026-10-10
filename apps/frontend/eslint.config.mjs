import nextVitals from 'eslint-config-next/core-web-vitals';

// This package already exports flat config; FlatCompat recursively serializes plugins.
export default [...nextVitals];
