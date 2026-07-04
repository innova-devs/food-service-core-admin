#!/usr/bin/env bash
set -euo pipefail

# Carga las variables del .env (con expansión de ${DOMAIN})
set -a
source .env
set +a

echo "→ Build: ${DOCKER_IMAGE}"
echo "   NEXT_PUBLIC_API=${NEXT_PUBLIC_API}"
echo "   NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}"

docker build \
  --build-arg NEXT_PUBLIC_API="${NEXT_PUBLIC_API}" \
  --build-arg NEXT_PUBLIC_SOCKET_URL="${NEXT_PUBLIC_SOCKET_URL}" \
  -t "${DOCKER_IMAGE}" \
  .

docker push "${DOCKER_IMAGE}"

echo "✓ Imagen pusheada: ${DOCKER_IMAGE}"
