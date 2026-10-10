#!/bin/bash
# ╔════════════════════════════════════════════════════════════════╗
# ║              Affexai Development Environment                   ║
# ║          Unified Startup & Graceful Shutdown Script            ║
# ╚════════════════════════════════════════════════════════════════╝
#
# Usage: ./dev.sh
#   - Starts both backend (9006) and frontend (9003)
#   - Ctrl+C gracefully stops all services
#   - Auto-cleans zombie processes on startup
#
# Author: Affexai Development Team
# Last Updated: 2025-11-28

set -e

# ═══════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/apps/backend"
FRONTEND_DIR="$SCRIPT_DIR/apps/frontend"
BACKEND_PORT=9006
FRONTEND_PORT=9003
BACKEND_PID=""
FRONTEND_PID=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ═══════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}              ${BOLD}Affexai Development Environment${NC}                   ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════
# Cleanup Functions
# ═══════════════════════════════════════════════════════════════════

cleanup_zombies() {
    log_info "Cleaning up zombie processes..."

    # Kill NestJS processes
    local nest_count=$(pgrep -f "nest start" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$nest_count" -gt 0 ]; then
        pkill -9 -f "nest start" 2>/dev/null || true
        log_warning "Killed $nest_count NestJS zombie process(es)"
    fi

    # Kill Next.js processes
    local next_count=$(pgrep -f "next-server" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$next_count" -gt 0 ]; then
        pkill -9 -f "next-server" 2>/dev/null || true
        log_warning "Killed $next_count Next.js zombie process(es)"
    fi

    # Free ports
    local port_9006=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
    if [ -n "$port_9006" ]; then
        echo "$port_9006" | xargs kill -9 2>/dev/null || true
        log_warning "Freed port $BACKEND_PORT"
    fi

    local port_9003=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
    if [ -n "$port_9003" ]; then
        echo "$port_9003" | xargs kill -9 2>/dev/null || true
        log_warning "Freed port $FRONTEND_PORT"
    fi

    log_success "Zombie cleanup complete"
}

# Graceful shutdown handler
graceful_shutdown() {
    echo ""
    echo ""
    log_info "Shutting down services gracefully..."

    # Kill backend
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        log_info "Stopping Backend (PID: $BACKEND_PID)..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        sleep 2
        kill -9 "$BACKEND_PID" 2>/dev/null || true
        log_success "Backend stopped"
    fi

    # Kill frontend
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log_info "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        sleep 2
        kill -9 "$FRONTEND_PID" 2>/dev/null || true
        log_success "Frontend stopped"
    fi

    # Final cleanup - kill any remaining processes
    pkill -9 -f "nest start" 2>/dev/null || true
    pkill -9 -f "next-server" 2>/dev/null || true
    pkill -9 -f "ts-node" 2>/dev/null || true
    lsof -ti:$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti:$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}              ${BOLD}All services stopped cleanly!${NC}                      ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    exit 0
}

# ═══════════════════════════════════════════════════════════════════
# Startup Functions
# ═══════════════════════════════════════════════════════════════════

check_docker() {
    log_info "Checking Docker services..."

    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running! Please start Docker Desktop first."
        exit 1
    fi

    # Check if postgres is running
    # if ! docker ps | grep -q "postgres"; then
    #     log_warning "PostgreSQL container not running. Starting docker-compose..."
    #     cd "$SCRIPT_DIR"
    #     docker compose up -d
    #     sleep 3
    # fi

    log_success "Docker services check skipped (User managed)"
}

start_backend() {
    log_info "Starting Backend on port $BACKEND_PORT..."

    cd "$BACKEND_DIR"

    # Start in background and capture PID
    npm run start:dev > /tmp/affexai-backend.log 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to be ready (NestJS compilation can take 2-3 minutes)
    local max_attempts=300  # 5 minutes
    local attempt=0

    echo -ne "  ${YELLOW}Compiling TypeScript & starting backend"
    while [ $attempt -lt $max_attempts ]; do
        # Check if process is still running
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            echo -e "${NC}"
            log_error "Backend process crashed!"
            log_info "Last 30 lines of log:"
            tail -30 /tmp/affexai-backend.log
            return 1
        fi

        if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
            echo -e "${NC}"
            log_success "Backend is ready! (PID: $BACKEND_PID) - took ${attempt}s"
            return 0
        fi

        # Show progress indicator every 10 seconds
        if [ $((attempt % 10)) -eq 0 ] && [ $attempt -gt 0 ]; then
            echo -n " ${attempt}s"
        else
            echo -n "."
        fi

        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${NC}"
    log_error "Backend failed to start within 3 minutes"
    log_info "Check logs: tail -f /tmp/affexai-backend.log"
    return 1
}

start_frontend() {
    log_info "Starting Frontend on port $FRONTEND_PORT..."

    cd "$FRONTEND_DIR"

    # Start in background and capture PID
    npm run dev > /tmp/affexai-frontend.log 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to be ready
    local max_attempts=90
    local attempt=0

    echo -ne "  ${YELLOW}Waiting for frontend"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            echo -e "${NC}"
            log_success "Frontend is ready! (PID: $FRONTEND_PID)"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "${NC}"
    log_error "Frontend failed to start within 45 seconds"
    log_info "Check logs: tail -f /tmp/affexai-frontend.log"
    return 1
}

print_status() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}              ${BOLD}All Services Running!${NC}                             ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT   (PID: $BACKEND_PID)         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT   (PID: $FRONTEND_PID)         ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}Admin:${NC}     http://localhost:$FRONTEND_PORT/admin              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}Portal:${NC}    http://localhost:$FRONTEND_PORT/portal             ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}API Docs:${NC}  http://localhost:$BACKEND_PORT/api                 ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${RED}Press Ctrl+C to stop all services${NC}                           ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Logs:${NC}"
    echo -e "  Backend:  tail -f /tmp/affexai-backend.log"
    echo -e "  Frontend: tail -f /tmp/affexai-frontend.log"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════
# Main Execution
# ═══════════════════════════════════════════════════════════════════

# Trap Ctrl+C (SIGINT) and terminal close (SIGTERM)
trap graceful_shutdown SIGINT SIGTERM

# Start
print_header
cleanup_zombies
check_docker
start_backend
start_frontend
print_status

# Keep script running and wait for Ctrl+C
log_info "Monitoring services... (Ctrl+C to stop)"
echo ""

# Monitor both processes
while true; do
    # Check if backend is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        log_error "Backend process died unexpectedly!"
        log_info "Restarting backend..."
        start_backend
    fi

    # Check if frontend is still running
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        log_error "Frontend process died unexpectedly!"
        log_info "Restarting frontend..."
        start_frontend
    fi

    sleep 5
done
