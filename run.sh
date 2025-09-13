#!/bin/bash

# Marina Obuv - Web Application Runner
# Simple script to run the web application

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js and npm
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command_exists node; then
        echo "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command_exists npm; then
        echo "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    
    # Install web dependencies
    if [ ! -d "web/node_modules" ]; then
        print_status "Installing web dependencies..."
        cd web && npm install && cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to run web application
run_web() {
    print_status "Starting web application..."
    print_status "Web will be available at http://localhost:3000"
    cd web
    npm run dev
}

# Function to show help
show_help() {
    echo "Marina Obuv - Web Application Runner"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  (no args)  Run web application"
    echo "  install    Install dependencies"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0         # Start the web application"
    echo "  $0 install # Install dependencies"
}

# Main script logic
main() {
    case "${1:-}" in
        "install")
            check_dependencies
            install_deps
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        "")
            check_dependencies
            install_deps
            run_web
            ;;
        *)
            echo "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
