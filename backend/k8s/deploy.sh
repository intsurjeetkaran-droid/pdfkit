#!/bin/bash
# =============================================================================
# PDFKit Kubernetes Deployment Script
#
# Usage:
#   ./deploy.sh              — Deploy everything (first time or full redeploy)
#   ./deploy.sh --infra      — Deploy only infrastructure (MySQL, Redis, MinIO)
#   ./deploy.sh --services   — Deploy only application services
#   ./deploy.sh --delete     — Delete all PDFKit resources from the cluster
#
# Prerequisites:
#   - kubectl configured and pointing to your cluster
#   - Docker images built and pushed to your registry
#   - Metrics Server installed (for HPA):
#     kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
#   - Nginx Ingress Controller installed:
#     helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
#
# Before running:
#   1. Update secrets.yaml with real base64-encoded credentials
#   2. Update configmap.yaml STORAGE_BASE_URL with your domain
#   3. Update ingress.yaml host with your domain
#   4. Update all deployment.yaml image: fields with your registry path
# =============================================================================

set -e  # Exit on any error

NAMESPACE="pdfkit"
K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "============================================"
echo "  PDFKit Kubernetes Deployment"
echo "  Namespace: $NAMESPACE"
echo "============================================"

deploy_infrastructure() {
  echo ""
  echo "→ Deploying infrastructure..."
  kubectl apply -f "$K8S_DIR/namespace.yaml"
  kubectl apply -f "$K8S_DIR/secrets.yaml"
  kubectl apply -f "$K8S_DIR/configmap.yaml"
  kubectl apply -f "$K8S_DIR/infrastructure/mysql-pvc.yaml"
  kubectl apply -f "$K8S_DIR/infrastructure/mysql-statefulset.yaml"
  kubectl apply -f "$K8S_DIR/infrastructure/redis-statefulset.yaml"
  kubectl apply -f "$K8S_DIR/infrastructure/minio-deployment.yaml"

  echo "  Waiting for MySQL to be ready..."
  kubectl wait --for=condition=ready pod -l app=mysql -n $NAMESPACE --timeout=120s

  echo "  Waiting for Redis to be ready..."
  kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=60s

  echo "  Waiting for MinIO to be ready..."
  kubectl wait --for=condition=ready pod -l app=minio -n $NAMESPACE --timeout=60s

  echo "✔ Infrastructure ready"
}

deploy_services() {
  echo ""
  echo "→ Deploying application services..."
  kubectl apply -f "$K8S_DIR/api-gateway/deployment.yaml"
  kubectl apply -f "$K8S_DIR/api-gateway/service.yaml"
  kubectl apply -f "$K8S_DIR/api-gateway/hpa.yaml"

  kubectl apply -f "$K8S_DIR/pdf-service/deployment.yaml"
  kubectl apply -f "$K8S_DIR/pdf-service/hpa.yaml"

  kubectl apply -f "$K8S_DIR/conversion-service/deployment.yaml"
  kubectl apply -f "$K8S_DIR/conversion-service/hpa.yaml"

  kubectl apply -f "$K8S_DIR/storage-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/queue-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/organization-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/security-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/metadata-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/html-service/deployment.yaml"

  kubectl apply -f "$K8S_DIR/ingress.yaml"

  echo ""
  echo "  Waiting for all deployments to be ready..."
  kubectl rollout status deployment/api-gateway -n $NAMESPACE
  kubectl rollout status deployment/pdf-service -n $NAMESPACE
  kubectl rollout status deployment/conversion-service -n $NAMESPACE
  kubectl rollout status deployment/storage-service -n $NAMESPACE
  kubectl rollout status deployment/queue-service -n $NAMESPACE
  kubectl rollout status deployment/organization-service -n $NAMESPACE
  kubectl rollout status deployment/security-service -n $NAMESPACE
  kubectl rollout status deployment/metadata-service -n $NAMESPACE
  kubectl rollout status deployment/html-service -n $NAMESPACE

  echo "✔ All services deployed"
}

delete_all() {
  echo ""
  echo "⚠️  Deleting all PDFKit resources..."
  kubectl delete namespace $NAMESPACE --ignore-not-found=true
  echo "✔ All resources deleted"
}

show_status() {
  echo ""
  echo "============================================"
  echo "  Deployment Status"
  echo "============================================"
  kubectl get pods -n $NAMESPACE
  echo ""
  kubectl get services -n $NAMESPACE
  echo ""
  kubectl get hpa -n $NAMESPACE
  echo ""
  kubectl get ingress -n $NAMESPACE
}

# Parse arguments
case "${1:-}" in
  --infra)
    deploy_infrastructure
    ;;
  --services)
    deploy_services
    ;;
  --delete)
    delete_all
    ;;
  *)
    deploy_infrastructure
    deploy_services
    show_status
    ;;
esac

echo ""
echo "============================================"
echo "  Done!"
echo "  API Gateway: http://pdfkit.local"
echo "  MinIO Console: http://<node-ip>:30901"
echo "  Bull Board: http://pdfkit.local/admin/queues"
echo "============================================"
