#!/bin/bash

# Script to add SSH public key to server
# Usage: ./add-ssh-key-to-server.sh <public_key_file> <server_user> <server_ip>

set -e

if [ $# -lt 3 ]; then
    echo "Usage: $0 <public_key_file> <server_user> <server_ip>"
    echo "Example: $0 ~/.ssh/id_ed25519_yandex_new.pub ubuntu 130.193.56.134"
    exit 1
fi

PUBLIC_KEY_FILE=$1
SERVER_USER=$2
SERVER_IP=$3

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if public key file exists
if [ ! -f "$PUBLIC_KEY_FILE" ]; then
    log_error "Public key file not found: $PUBLIC_KEY_FILE"
    exit 1
fi

# Read public key
PUBLIC_KEY=$(cat "$PUBLIC_KEY_FILE")

log_info "Adding SSH key to server..."
log_info "Server: $SERVER_USER@$SERVER_IP"
log_info "Key file: $PUBLIC_KEY_FILE"

# Check if we can connect with current key
log_info "Testing current SSH connection..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'Connection test'" > /dev/null 2>&1; then
    log_success "Current SSH connection works"

    # Add key via SSH
    log_info "Adding new key to server..."
    ssh "$SERVER_USER@$SERVER_IP" << EOF
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "Key added successfully"
cat ~/.ssh/authorized_keys | tail -1
EOF

    log_success "Key added to server via SSH"
else
    log_warning "Cannot connect via SSH - you'll need to add the key manually"
    log_info "Public key to add:"
    echo ""
    echo "$PUBLIC_KEY"
    echo ""
    log_info "Add this key via console access or manually"
    exit 1
fi

log_success "✅ SSH key added successfully!"
log_info ""
log_info "Next steps:"
log_info "1. Test connection with new key:"
log_info "   ssh -i $PUBLIC_KEY_FILE $SERVER_USER@$SERVER_IP"
log_info "2. Update ~/.ssh/config to use new key"
log_info "3. Update GitHub Actions secrets if needed"
