#!/bin/bash

# Script to generate RSA key pair for JWT signing

echo "Generating RSA key pair for JWT..."

# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

echo "Keys generated successfully!"
echo ""
echo "Private key: private.pem"
echo "Public key: public.pem"
echo ""
echo "Add these to your .env file:"
echo "JWT_SECRET=\$(cat private.pem)"
echo "JWT_PUBLIC_KEY=\$(cat public.pem)"
echo ""
echo "⚠️  Keep private.pem secure and never commit it to version control!"

