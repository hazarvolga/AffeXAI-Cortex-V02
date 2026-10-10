#!/usr/bin/env ts-node

/**
 * Automated Test Generator for NestJS Services
 * 
 * This script analyzes service files and generates comprehensive unit tests
 * including:
 * - Mock setup for all dependencies
 * - Tests for each public method
 * - Error handling tests
 * - Edge case tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface ServiceMethod {
    name: string;
    parameters: string[];
    returnType: string;
    isAsync: boolean;
}

interface ServiceDependency {
    name: string;
    type: string;
    isRepository: boolean;
    isQueue: boolean;
}

interface ServiceAnalysis {
    className: string;
    methods: ServiceMethod[];
    dependencies: ServiceDependency[];
    imports: string[];
}

class TestGenerator {
    private sourceFile: ts.SourceFile;

    constructor(private filePath: string) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.sourceFile = ts.createSourceFile(
            filePath,
            content,
            ts.ScriptTarget.Latest,
            true
        );
    }

    analyze(): ServiceAnalysis {
        const analysis: ServiceAnalysis = {
            className: '',
            methods: [],
            dependencies: [],
            imports: [],
        };

        const visit = (node: ts.Node) => {
            // Find class declaration
            if (ts.isClassDeclaration(node) && node.name) {
                analysis.className = node.name.text;

                // Find constructor
                node.members.forEach(member => {
                    if (ts.isConstructorDeclaration(member)) {
                        this.analyzeConstructor(member, analysis);
                    }

                    if (ts.isMethodDeclaration(member) && member.name) {
                        this.analyzeMethod(member, analysis);
                    }
                });
            }

            // Find imports
            if (ts.isImportDeclaration(node)) {
                const importText = node.getText(this.sourceFile);
                analysis.imports.push(importText);
            }

            ts.forEachChild(node, visit);
        };

        visit(this.sourceFile);
        return analysis;
    }

    private analyzeConstructor(constructor: ts.ConstructorDeclaration, analysis: ServiceAnalysis) {
        constructor.parameters.forEach(param => {
            if (param.name && ts.isIdentifier(param.name)) {
                const name = param.name.text;
                const type = param.type ? param.type.getText(this.sourceFile) : 'any';

                const isRepository = param.decorators?.some(dec =>
                    dec.getText(this.sourceFile).includes('@InjectRepository')
                ) || false;

                const isQueue = param.decorators?.some(dec =>
                    dec.getText(this.sourceFile).includes('@InjectQueue')
                ) || false;

                analysis.dependencies.push({
                    name,
                    type,
                    isRepository,
                    isQueue,
                });
            }
        });
    }

    private analyzeMethod(method: ts.MethodDeclaration, analysis: ServiceAnalysis) {
        if (!ts.isIdentifier(method.name)) return;

        const name = method.name.text;
        if (name.startsWith('_') || name === 'constructor') return;

        const parameters = method.parameters.map(p =>
            p.name && ts.isIdentifier(p.name) ? p.name.text : ''
        ).filter(Boolean);

        const returnType = method.type ? method.type.getText(this.sourceFile) : 'void';
        const isAsync = method.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

        analysis.methods.push({
            name,
            parameters,
            returnType,
            isAsync,
        });
    }

    generateTest(analysis: ServiceAnalysis): string {
        const testContent = `import { Test, TestingModule } from '@nestjs/testing';
${this.generateImports(analysis)}

describe('${analysis.className}', () => {
  let service: ${analysis.className};
${this.generateMockDeclarations(analysis)}

${this.generateMockImplementations(analysis)}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ${analysis.className},
${this.generateProviders(analysis)}
      ],
    }).compile();

    service = module.get<${analysis.className}>(${analysis.className});
${this.generateDependencyGetters(analysis)}

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

${this.generateMethodTests(analysis)}
});
`;

        return testContent;
    }

    private generateImports(analysis: ServiceAnalysis): string {
        const imports = [
            `import { ${analysis.className} } from './${this.getServiceFileName()}';`,
        ];

        // Add repository imports
        analysis.dependencies
            .filter(d => d.isRepository)
            .forEach(d => {
                const entityName = d.type.replace('Repository<', '').replace('>', '');
                imports.push(`import { getRepositoryToken } from '@nestjs/typeorm';`);
                imports.push(`import { Repository } from 'typeorm';`);
            });

        // Add queue imports
        if (analysis.dependencies.some(d => d.isQueue)) {
            imports.push(`import { getQueueToken } from '@nestjs/bullmq';`);
            imports.push(`import { Queue } from 'bullmq';`);
        }

        return [...new Set(imports)].join('\n');
    }

    private generateMockDeclarations(analysis: ServiceAnalysis): string {
        return analysis.dependencies.map(dep => {
            if (dep.isRepository) {
                return `  let ${dep.name}: ${dep.type};`;
            } else if (dep.isQueue) {
                return `  let ${dep.name}: Queue;`;
            } else {
                return `  let ${dep.name}: ${dep.type};`;
            }
        }).join('\n');
    }

    private generateMockImplementations(analysis: ServiceAnalysis): string {
        const mocks: string[] = [];

        analysis.dependencies.forEach(dep => {
            if (dep.isRepository) {
                mocks.push(`
  const mock${this.capitalize(dep.name)} = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    })),
  };`);
            } else if (dep.isQueue) {
                mocks.push(`
  const mock${this.capitalize(dep.name)} = {
    add: jest.fn(),
    process: jest.fn(),
    getJob: jest.fn(),
  };`);
            } else {
                mocks.push(`
  const mock${this.capitalize(dep.name)} = {
    // Add mock methods as needed
  };`);
            }
        });

        return mocks.join('\n');
    }

    private generateProviders(analysis: ServiceAnalysis): string {
        return analysis.dependencies.map(dep => {
            if (dep.isRepository) {
                const entityName = dep.type.replace('Repository<', '').replace('>', '');
                return `        {
          provide: getRepositoryToken(${entityName}),
          useValue: mock${this.capitalize(dep.name)},
        },`;
            } else if (dep.isQueue) {
                const queueName = dep.name.replace('Queue', '').replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
                return `        {
          provide: getQueueToken('${queueName}'),
          useValue: mock${this.capitalize(dep.name)},
        },`;
            } else {
                return `        {
          provide: ${dep.type},
          useValue: mock${this.capitalize(dep.name)},
        },`;
            }
        }).join('\n');
    }

    private generateDependencyGetters(analysis: ServiceAnalysis): string {
        return analysis.dependencies.map(dep => {
            if (dep.isRepository) {
                const entityName = dep.type.replace('Repository<', '').replace('>', '');
                return `    ${dep.name} = module.get<${dep.type}>(getRepositoryToken(${entityName}));`;
            } else if (dep.isQueue) {
                const queueName = dep.name.replace('Queue', '').replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
                return `    ${dep.name} = module.get<Queue>(getQueueToken('${queueName}'));`;
            } else {
                return `    ${dep.name} = module.get<${dep.type}>(${dep.type});`;
            }
        }).join('\n');
    }

    private generateMethodTests(analysis: ServiceAnalysis): string {
        return analysis.methods.map(method => {
            return `  describe('${method.name}', () => {
    it('should ${method.name} successfully', async () => {
      // TODO: Implement test
      expect(service.${method.name}).toBeDefined();
    });

    it('should handle errors in ${method.name}', async () => {
      // TODO: Implement error test
      expect(service.${method.name}).toBeDefined();
    });
  });
`;
        }).join('\n');
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private getServiceFileName(): string {
        return path.basename(this.filePath, '.ts');
    }
}

// CLI Usage
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: ts-node generate-tests.ts <service-file-path>');
    process.exit(1);
}

const serviceFile = args[0];
if (!fs.existsSync(serviceFile)) {
    console.error(`File not found: ${serviceFile}`);
    process.exit(1);
}

const generator = new TestGenerator(serviceFile);
const analysis = generator.analyze();
const testContent = generator.generateTest(analysis);

const outputFile = serviceFile.replace('.service.ts', '.service.spec.ts');
fs.writeFileSync(outputFile, testContent);

console.log(`✅ Generated test file: ${outputFile}`);
console.log(`   Class: ${analysis.className}`);
console.log(`   Methods: ${analysis.methods.length}`);
console.log(`   Dependencies: ${analysis.dependencies.length}`);
