#!/bin/bash

# Load environment variables safely for Prisma
set -a  # automatically export all variables

# Process the .env file line by line, handling quotes properly
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key and value, handling quotes properly
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Remove surrounding quotes if they exist and match
        if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        fi
        
        # Export the variable
        export "$key"="$value"
    fi
done < .env.local

set +a  # turn off automatic export

# Run the command passed as argument
exec "$@"
