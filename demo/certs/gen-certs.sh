#!/bin/bash

# Exit on error
set -e

# Directory for certificates
CERT_DIR="$(dirname "$0")"
cd "$CERT_DIR"

echo "Generating mTLS certificates in $CERT_DIR..."

# 1. Generate CA Key and Certificate
echo "1. Generating CA..."
# Provide default values to avoid interactive prompts
openssl req -new -x509 -days 3650 -nodes \
  -keyout ca.key -out ca.crt \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=Demo/OU=Platform/CN=DemoRootCA"

# 2. Generate Server Key and CSR (Source Service)
echo "2. Generating Source Service (Server) Certs..."
openssl req -new -nodes \
  -keyout server.key -out server.csr \
  -subj "/C=VN/ST=Hanoi/O=Demo/CN=localhost"

# 3. Sign Server Certificate with CA
echo "3. Signing Server Certificate..."
openssl x509 -req -in server.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365

# 4. Generate Client Key and CSR (Consumer Service)
echo "4. Generating Consumer Service (Client) Certs..."
openssl req -new -nodes \
  -keyout client.key -out client.csr \
  -subj "/C=VN/ST=Hanoi/O=Demo/CN=localhost"

# 5. Sign Client Certificate with CA
echo "5. Signing Client Certificate..."
openssl x509 -req -in client.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days 365

# Cleanup CSR files
rm *.csr

echo "----------------------------------------"
echo "Certificate generation complete!"
echo "Files created:"
echo "- CA:      ca.key, ca.crt"
echo "- Server:  server.key, server.crt"
echo "- Client:  client.key, client.crt"
echo "----------------------------------------"
