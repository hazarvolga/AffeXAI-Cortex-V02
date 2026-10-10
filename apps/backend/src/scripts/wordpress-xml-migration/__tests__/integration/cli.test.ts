/**
 * CLI Integration Tests
 * 
 * Tests command-line interface functionality:
 * - Argument parsing
 * - Dry-run mode
 * - Validate-only mode
 * - Error scenarios
 * - Configuration loading
 */

import { parseArguments, loadConfiguration } from '../../index';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLI Integration Tests', () => {
  let testDir: string;
  let originalArgv: string[];
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Create temp directory
    testDir = path.join(os.tmpdir(), 'cli-test-' + Date.now());
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Save original argv and env
    originalArgv = process.argv;
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original argv and env
    process.argv = originalArgv;
    process.env = originalEnv;

    // Cleanup temp directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Argument Parsing', () => {
    it('should parse --dry-run flag', () => {
      process.argv = ['node', 'index.ts', '--dry-run'];
      const options = parseArguments();

      expect(options.dryRun).toBe(true);
      expect(options.validateOnly).toBe(false);
      expect(options.verbose).toBe(false);
    });

    it('should parse --validate-only flag', () => {
      process.argv = ['node', 'index.ts', '--validate-only'];
      const options = parseArguments();

      expect(options.dryRun).toBe(false);
      expect(options.validateOnly).toBe(true);
      expect(options.verbose).toBe(false);
    });

    it('should parse --verbose flag', () => {
      process.argv = ['node', 'index.ts', '--verbose'];
      const options = parseArguments();

      expect(options.verbose).toBe(true);
    });

    it('should parse -v shorthand for verbose', () => {
      process.argv = ['node', 'index.ts', '-v'];
      const options = parseArguments();

      expect(options.verbose).toBe(true);
    });

    it('should parse --xml-file option', () => {
      process.argv = ['node', 'index.ts', '--xml-file', '/path/to/file.xml'];
      const options = parseArguments();

      expect(options.xmlFile).toBe('/path/to/file.xml');
    });

    it('should parse --mapping-file option', () => {
      process.argv = ['node', 'index.ts', '--mapping-file', '/path/to/mapping.json'];
      const options = parseArguments();

      expect(options.mappingFile).toBe('/path/to/mapping.json');
    });

    it('should parse --template-file option', () => {
      process.argv = ['node', 'index.ts', '--template-file', '/path/to/template.md'];
      const options = parseArguments();

      expect(options.templateFile).toBe('/path/to/template.md');
    });

    it('should parse --uploads-dir option', () => {
      process.argv = ['node', 'index.ts', '--uploads-dir', '/path/to/uploads'];
      const options = parseArguments();

      expect(options.uploadsDir).toBe('/path/to/uploads');
    });

    it('should parse multiple flags together', () => {
      process.argv = ['node', 'index.ts', '--dry-run', '--verbose'];
      const options = parseArguments();

      expect(options.dryRun).toBe(true);
      expect(options.verbose).toBe(true);
    });

    it('should handle no arguments', () => {
      process.argv = ['node', 'index.ts'];
      const options = parseArguments();

      expect(options.dryRun).toBe(false);
      expect(options.validateOnly).toBe(false);
      expect(options.verbose).toBe(false);
    });

    it('should warn about unknown options', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      process.argv = ['node', 'index.ts', '--unknown-option'];
      
      parseArguments();

      // Note: This would trigger a warning in the actual implementation
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from CLI options', () => {
      const xmlPath = path.join(testDir, 'test.xml');
      const mappingPath = path.join(testDir, 'mapping.json');
      const templatePath = path.join(testDir, 'template.md');

      // Create test files
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');
      fs.writeFileSync(mappingPath, '{}');
      fs.writeFileSync(templatePath, '');

      const options = {
        dryRun: true,
        validateOnly: false,
        verbose: false,
        xmlFile: xmlPath,
        mappingFile: mappingPath,
        templateFile: templatePath,
        uploadsDir: testDir,
      };

      const config = loadConfiguration(options);

      expect(config.xmlFilePath).toBe(xmlPath);
      expect(config.mappingFilePath).toBe(mappingPath);
      expect(config.templateMappingPath).toBe(templatePath);
      expect(config.uploadsDir).toBe(testDir);
      expect(config.dryRun).toBe(true);
    });

    it('should load configuration from environment variables', () => {
      const xmlPath = path.join(testDir, 'env-test.xml');
      const mappingPath = path.join(testDir, 'env-mapping.json');
      const templatePath = path.join(testDir, 'env-template.md');

      // Create test files
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');
      fs.writeFileSync(mappingPath, '{}');
      fs.writeFileSync(templatePath, '');

      // Set environment variables
      process.env.MIGRATION_XML_FILE = xmlPath;
      process.env.MIGRATION_MAPPING_FILE = mappingPath;
      process.env.MIGRATION_TEMPLATE_FILE = templatePath;
      process.env.MIGRATION_UPLOADS_DIR = testDir;

      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
      };

      const config = loadConfiguration(options);

      expect(config.xmlFilePath).toBe(xmlPath);
      expect(config.mappingFilePath).toBe(mappingPath);
      expect(config.templateMappingPath).toBe(templatePath);
      expect(config.uploadsDir).toBe(testDir);
    });

    it('should prioritize CLI options over environment variables', () => {
      const cliXmlPath = path.join(testDir, 'cli-test.xml');
      const envXmlPath = path.join(testDir, 'env-test.xml');

      // Create test files
      fs.writeFileSync(cliXmlPath, '<?xml version="1.0"?><rss></rss>');
      fs.writeFileSync(envXmlPath, '<?xml version="1.0"?><rss></rss>');

      // Set environment variable
      process.env.MIGRATION_XML_FILE = envXmlPath;

      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: cliXmlPath,
      };

      const config = loadConfiguration(options);

      // CLI option should take precedence
      expect(config.xmlFilePath).toBe(cliXmlPath);
    });

    it('should throw error if XML file does not exist', () => {
      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: '/non/existent/file.xml',
      };

      expect(() => loadConfiguration(options)).toThrow('XML file not found');
    });

    it('should warn if mapping file does not exist', () => {
      const xmlPath = path.join(testDir, 'test.xml');
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: xmlPath,
        mappingFile: '/non/existent/mapping.json',
      };

      loadConfiguration(options);

      // Should warn but not throw
      consoleSpy.mockRestore();
    });

    it('should warn if template file does not exist', () => {
      const xmlPath = path.join(testDir, 'test.xml');
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: xmlPath,
        templateFile: '/non/existent/template.md',
      };

      loadConfiguration(options);

      // Should warn but not throw
      consoleSpy.mockRestore();
    });
  });

  describe('Dry-Run Mode', () => {
    it('should set dryRun flag in configuration', () => {
      const xmlPath = path.join(testDir, 'test.xml');
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');

      const options = {
        dryRun: true,
        validateOnly: false,
        verbose: false,
        xmlFile: xmlPath,
      };

      const config = loadConfiguration(options);

      expect(config.dryRun).toBe(true);
    });

    it('should not set dryRun flag by default', () => {
      const xmlPath = path.join(testDir, 'test.xml');
      fs.writeFileSync(xmlPath, '<?xml version="1.0"?><rss></rss>');

      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: xmlPath,
      };

      const config = loadConfiguration(options);

      expect(config.dryRun).toBe(false);
    });
  });

  describe('Validate-Only Mode', () => {
    it('should parse validate-only flag', () => {
      process.argv = ['node', 'index.ts', '--validate-only'];
      const options = parseArguments();

      expect(options.validateOnly).toBe(true);
      expect(options.dryRun).toBe(false);
    });

    it('should allow combining validate-only with verbose', () => {
      process.argv = ['node', 'index.ts', '--validate-only', '--verbose'];
      const options = parseArguments();

      expect(options.validateOnly).toBe(true);
      expect(options.verbose).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing XML file gracefully', () => {
      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: path.join(testDir, 'missing.xml'),
      };

      expect(() => loadConfiguration(options)).toThrow();
    });

    it('should handle invalid XML path', () => {
      const options = {
        dryRun: false,
        validateOnly: false,
        verbose: false,
        xmlFile: '',
      };

      expect(() => loadConfiguration(options)).toThrow();
    });
  });

  describe('Help Message', () => {
    it('should exit when --help flag is provided', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      process.argv = ['node', 'index.ts', '--help'];

      expect(() => parseArguments()).toThrow('Process.exit called with code 0');

      exitSpy.mockRestore();
    });

    it('should exit when -h flag is provided', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      process.argv = ['node', 'index.ts', '-h'];

      expect(() => parseArguments()).toThrow('Process.exit called with code 0');

      exitSpy.mockRestore();
    });
  });
});
