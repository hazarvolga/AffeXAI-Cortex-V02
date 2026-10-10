import os
import re
import sys

# Configuration
SKIP_DIRS = ['node_modules', 'dist', 'coverage', 'test', 'migrations']
SKIP_FILES = ['.spec.ts', '.test.ts', '.d.ts']
# Explicitly allowed global services/entities that don't need tenantId
ALLOWLIST = [
    'products.service.ts', # Global catalog
    'tenant.service.ts',   # The provider itself
    'auth.service.ts',     # Handles login (partially global)
]

# Patterns that look like DB queries
DB_PATTERNS = [
    r'\.find\(',
    r'\.findOne\(',
    r'\.findAndCount\(',
    r'\.count\(',
    r'\.createQueryBuilder\(',
    r'\.delete\(',
    r'\.update\(',
]

# Pattern that looks like tenant check
TENANT_CHECK = r'tenantId'

def scan_file(filepath):
    """Scans a single file for missing tenant checks."""
    filename = os.path.basename(filepath)
    if filename in ALLOWLIST:
        return []

    violations = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        line_num = i + 1
        content = line.strip()
        
        # Check if line contains a DB call
        is_db_call = any(re.search(p, content) for p in DB_PATTERNS)
        
        if is_db_call:
            # Simple heuristic: check if 'tenantId' is mentioned in the same line 
            # or closely following lines (not perfect, but catches obvious misses)
            
            # Look ahead a few lines for tenantId if not in current line
            has_tenant_check = 'tenantId' in content
            if not has_tenant_check:
                # Check next 5 lines for context (e.g. multi-line object)
                for j in range(1, 6):
                    if i + j < len(lines):
                        if 'tenantId' in lines[i+j]:
                            has_tenant_check = True
                            break
            
            # Specific exclusion for "this.usersRepository.findOne({ id })" type calls 
            # if they are inside a method that doesn't have tenantId context (hard to detect statically)
            
            # Filter out false positives
            if 'where: {' in content and not has_tenant_check:
                 violations.append({
                    'line': line_num,
                    'content': content,
                    'file': filepath
                })
            elif 'createQueryBuilder' in content and not has_tenant_check:
                 violations.append({
                    'line': line_num,
                    'content': content,
                    'file': filepath
                })

    return violations

def main():
    root_dir = os.path.join(os.getcwd(), 'apps/backend/src')
    print(f"🔒 Starting Security Scan in {root_dir}...")
    
    all_violations = []

    for root, dirs, files in os.walk(root_dir):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        
        for file in files:
            if file.endswith('.ts') and not any(file.endswith(s) for s in SKIP_FILES):
                path = os.path.join(root, file)
                violations = scan_file(path)
                all_violations.extend(violations)

    if all_violations:
        print(f"\n❌ Found {len(all_violations)} potential privacy leaks:")
        for v in all_violations:
            short_path = v['file'].replace(os.getcwd(), '')
            print(f"  [{short_path}:{v['line']}] {v['content']}")
        print("\nFAILURE: Multi-tenancy check failed.")
        sys.exit(1)
    else:
        print("\n✅ Security Scan Passed: No obvious missing tenant checks found.")
        sys.exit(0)

if __name__ == '__main__':
    main()
