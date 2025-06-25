#!/bin/bash

# SGBlock Codebase Analysis Script
# Analyzes code quality, unused files, and optimization opportunities

echo "🔍 Analyzing SGBlock codebase..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to count lines in files
count_lines() {
    find $1 -name "*.ts" -o -name "*.vue" -o -name "*.js" | xargs wc -l | tail -1 | awk '{print $1}'
}

# Function to find large files
find_large_files() {
    echo -e "${YELLOW}📏 Files exceeding 200 lines:${NC}"
    find $1 -name "*.ts" -o -name "*.vue" -o -name "*.js" | while read file; do
        lines=$(wc -l < "$file")
        if [ $lines -gt 200 ]; then
            echo -e "${RED}  $file: $lines lines${NC}"
        fi
    done
}

# Function to find unused imports
find_unused_imports() {
    echo -e "${YELLOW}🔗 Checking for unused imports...${NC}"
    # This would require additional tooling in real implementation
    echo "  Use 'npx eslint --ext .ts,.vue src/' to check for unused imports"
}

# Function to analyze bundle size
analyze_bundle() {
    echo -e "${YELLOW}📦 Bundle size analysis:${NC}"
    if [ -d "dist" ]; then
        echo "  Frontend bundle size:"
        du -sh dist/* 2>/dev/null | sort -hr
    else
        echo "  Run 'npm run build' first to analyze bundle size"
    fi
}

# Function to find duplicate code
find_duplicates() {
    echo -e "${YELLOW}🔄 Checking for potential code duplication...${NC}"
    # Simple check for similar function names
    grep -r "function\|const.*=" src/ --include="*.ts" --include="*.vue" | \
    cut -d':' -f2 | sort | uniq -c | sort -nr | head -10
}

# Main analysis
echo -e "${BLUE}📊 Codebase Statistics:${NC}"
echo "===================="

# Frontend analysis
frontend_lines=$(count_lines "src")
echo -e "${GREEN}Frontend:${NC} $frontend_lines lines"

# Backend analysis
if [ -d "backend/src" ]; then
    backend_lines=$(count_lines "backend/src")
    echo -e "${GREEN}Backend:${NC} $backend_lines lines"
    total_lines=$((frontend_lines + backend_lines))
else
    total_lines=$frontend_lines
fi

echo -e "${GREEN}Total:${NC} $total_lines lines"
echo ""

# File count analysis
echo -e "${BLUE}📁 File Distribution:${NC}"
echo "==================="
echo "TypeScript files: $(find src/ -name "*.ts" | wc -l)"
echo "Vue components: $(find src/ -name "*.vue" | wc -l)"
echo "Test files: $(find test/ -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | wc -l)"
echo "Module directories: $(find src/modules/ -maxdepth 1 -type d 2>/dev/null | wc -l)"
echo ""

# Large files analysis
find_large_files "src"
if [ -d "backend/src" ]; then
    find_large_files "backend/src"
fi
echo ""

# Bundle analysis
analyze_bundle
echo ""

# Unused imports
find_unused_imports
echo ""

# Code duplication
find_duplicates
echo ""

# Recommendations
echo -e "${BLUE}💡 Optimization Recommendations:${NC}"
echo "================================"
echo "1. Split files over 200 lines into smaller, focused modules"
echo "2. Use code splitting and lazy loading for large components"
echo "3. Implement tree shaking to remove unused code"
echo "4. Consider using dynamic imports for modules"
echo "5. Run 'npm run test:coverage' to identify untested code"
echo "6. Use 'npm audit' to check for security vulnerabilities"
echo ""

echo -e "${GREEN}✅ Analysis complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "- Review large files and consider refactoring"
echo "- Run 'npm run lint' to check code style"
echo "- Run 'npm run test' to ensure all tests pass"
echo "- Consider implementing automated quality gates"
</parameter>