const path = require("path");

// @nestjs/mapped-types 12 ships ESM only, which Jest's CommonJS runtime cannot load.
// Tests use the CommonJS 2.x copy installed for @nestjs/swagger (same helper API);
// Node 24 loads the ESM build at runtime.
const mappedTypesCjs = path.dirname(
  require.resolve("@nestjs/mapped-types/package.json", {
    paths: [path.dirname(require.resolve("@nestjs/swagger/package.json"))],
  }),
);

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Each ts-jest worker type-checks a large slice of the backend; unbounded
  // workers (one per core) exhausted machine RAM. Cap parallelism and recycle
  // workers whose heap grows past the limit.
  maxWorkers: 2,
  workerIdleMemoryLimit: "1GB",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@nestjs/mapped-types$": mappedTypesCjs,
  },
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/dist/",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/*.stories.tsx",
    "!src/**/*.test.tsx",
    "!src/**/*.test.ts",
    "!src/setupTests.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};
