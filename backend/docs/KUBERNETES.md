# PDFKit — Kubernetes Deployment Guide

**Version:** 3.1.0  
**Last Updated:** May 22, 2026

---

## Overview

PDFKit is fully Kubernetes-ready. This guide covers deploying the entire platform to a Kubernetes cluster with:

- **Auto-scaling** via HorizontalPodAutoscaler (HPA) — handles 1000+ concurrent users
- **Shared object storage** via MinIO — enables stateless horizontal scaling
- **Zero-downtime deploys** via rolling updates
- **Pod spread** across nodes for high availability
- **Resource limits** to prevent any single service from crashing the cluster

---

## Why Kubernetes?

The core problem with Docker Compose at scale:

| Issue | Docker Compose | Kubernetes |
|-------|---------------|------------|
| Concurrent users | 1 container per service | 2–10 pods per service |
| CPU spike (LibreOffice) | Blocks all requests | HPA adds pods automatically |
| Node failure | Service down | Pods rescheduled on healthy nodes |
| Memory leak | Service crashes | Pod restarted automatically |
| Deploy | Downtime | Rolling update (zero downtime) |
| File sharing | Local volumes (single host) | MinIO (all pods, all nodes) |

---

## Prerequisites

### Required Tools

```bash
# kubectl — Kubernetes CLI
# Install: https://kubernetes.io/docs/tasks/tools/

# helm — Kubernetes package manager
# Install: https://helm.sh/docs/intro/install/

# Docker — for building images
# Install: https://docs.docker.com/get-docker/
```

### Required Cluster Components

```bash
# 1. Metrics Server (required for HPA to work)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. Nginx Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Verify ingress controller is running
kubectl get pods -n ingress-nginx
```

---

## Step 1: Build and Push Docker Images

Each service needs to be built and pushed to a container registry.

```bash
# Set your registry (Docker Hub, ECR, GCR, etc.)
REGISTRY=your-registry.io/pdfkit

# Build all images
cd backend

docker build -t $REGISTRY/api-gateway:latest ./api-gateway
docker build -t $REGISTRY/pdf-service:latest ./pdf-service
docker build -t $REGISTRY/conversion-service:latest ./conversion-service
docker build -t $REGISTRY/storage-service:latest ./storage-service
docker build -t $REGISTRY/queue-service:latest ./queue-service
docker build -t $REGISTRY/organization-service:latest ./organization-service
docker build -t $REGISTRY/security-service:latest ./security-service
docker build -t $REGISTRY/metadata-service:latest ./metadata-service
docker build -t $REGISTRY/html-service:latest ./html-service

# Push all images
docker push $REGISTRY/api-gateway:latest
docker push $REGISTRY/pdf-service:latest
docker push $REGISTRY/conversion-service:latest
docker push $REGISTRY/storage-service:latest
docker push $REGISTRY/queue-service:latest
docker push $REGISTRY/organization-service:latest
docker push $REGISTRY/security-service:latest
docker push $REGISTRY/metadata-service:latest
docker push $REGISTRY/html-service:latest
```

Then update the `image:` field in each `k8s/*/deployment.yaml` to point to your registry.

---

## Step 2: Configure Secrets

Edit `k8s/secrets.yaml` and replace the placeholder base64 values with your real credentials.

```bash
# Encode a value
echo -n "your-real-password" | base64

# Example: encode a strong MySQL password
echo -n "MyStr0ngP@ssw0rd!" | base64
# → TXlTdHIwbmdQQHNzdzByZCE=
```

**⚠️ Never commit real secrets to git.** For production, use:
- AWS Secrets Manager + External Secrets Operator
- HashiCorp Vault + Vault Agent
- Kubernetes Sealed Secrets
- SOPS (Secrets OPerationS)

---

## Step 3: Configure Domain

Edit `k8s/ingress.yaml` and replace `pdfkit.local` with your actual domain:

```yaml
rules:
  - host: api.yourdomain.com   # ← your domain
    http:
      paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: api-gateway
              port:
                number: 3000
```

Also update `STORAGE_BASE_URL` in `k8s/configmap.yaml`:

```yaml
STORAGE_BASE_URL: "https://api.yourdomain.com"
```

---

## Step 4: Deploy

```bash
cd backend/k8s

# Make deploy script executable
chmod +x deploy.sh

# Deploy everything (infrastructure + services)
./deploy.sh

# Or deploy in stages:
./deploy.sh --infra      # MySQL, Redis, MinIO only
./deploy.sh --services   # Application services only
```

---

## Step 5: Run Database Migration

After the first deploy, run the Prisma migration for the storage-service:

```bash
# Get the storage-service pod name
kubectl get pods -n pdfkit -l app=storage-service

# Run migration
kubectl exec -n pdfkit <storage-service-pod-name> -- \
  npx prisma migrate deploy --schema=./prisma/schema.prisma
```

---

## Step 6: Verify

```bash
# Check all pods are running
kubectl get pods -n pdfkit

# Check HPA status
kubectl get hpa -n pdfkit

# Check services
kubectl get services -n pdfkit

# Check ingress
kubectl get ingress -n pdfkit

# Test health endpoint
curl http://pdfkit.local/health

# Watch pods scale under load
kubectl get hpa -n pdfkit -w
```

---

## File Structure

```
k8s/
├── namespace.yaml              # pdfkit namespace
├── configmap.yaml              # Non-sensitive env vars (service URLs, ports)
├── secrets.yaml                # Sensitive credentials (DB password, MinIO keys)
├── ingress.yaml                # Nginx Ingress — external traffic routing
├── deploy.sh                   # One-command deployment script
├── infrastructure/
│   ├── mysql-pvc.yaml          # 10Gi PVC for MySQL data
│   ├── mysql-statefulset.yaml  # MySQL 8 StatefulSet + headless Service
│   ├── redis-statefulset.yaml  # Redis 7 StatefulSet + Service + PVC
│   └── minio-deployment.yaml   # MinIO Deployment + Services + PVC
├── api-gateway/
│   ├── deployment.yaml         # 2–10 pods, rolling update
│   ├── service.yaml            # ClusterIP service
│   └── hpa.yaml                # HPA: CPU > 70%
├── pdf-service/
│   ├── deployment.yaml         # 2–10 pods
│   └── hpa.yaml                # HPA: CPU > 70%
├── conversion-service/
│   ├── deployment.yaml         # 2–8 pods, higher resource limits
│   └── hpa.yaml                # HPA: CPU > 65%
├── storage-service/
│   └── deployment.yaml         # 2–8 pods + service + hpa (combined)
├── queue-service/
│   └── deployment.yaml         # 2–4 pods + service + hpa (combined)
├── organization-service/
│   └── deployment.yaml         # 2–8 pods + service + hpa (combined)
├── security-service/
│   └── deployment.yaml         # 2–8 pods + service + hpa (combined)
├── metadata-service/
│   └── deployment.yaml         # 2–8 pods + service + hpa (combined)
└── html-service/
    └── deployment.yaml         # 2–6 pods + service + hpa (combined)
```

---

## MinIO — Shared Object Storage

### Why MinIO is Required

In Kubernetes, pods can run on different nodes. Without shared storage:
- Pod A (node 1) receives upload → writes to `/app/uploads/file.pdf`
- Pod B (node 2) receives download request → `/app/uploads/file.pdf` doesn't exist → 404

MinIO provides a single storage endpoint all pods share:

```
All pods → MinIO API (minio:9000) → /data volume (PVC)
```

### Buckets

| Bucket | Purpose | TTL |
|--------|---------|-----|
| `pdfkit-uploads` | Temporary uploaded files | 1 hour |
| `pdfkit-outputs` | Processed output files | Deleted after download |

### MinIO Console

Access the MinIO web console for debugging:

```bash
# In Docker Compose
open http://localhost:9001

# In Kubernetes (NodePort)
open http://<node-ip>:30901
```

Login: `minioadmin` / `minioadmin` (change in production)

### Production MinIO

For production at scale, consider:
- **MinIO Operator** with distributed mode (4+ nodes, erasure coding)
- **AWS S3** — no self-hosting, infinite scale
- **GCP Cloud Storage** — same
- **Azure Blob Storage** — same

To switch to AWS S3, update the MinIO client config in `shared/utils/minioClient.ts`:

```typescript
const minioClient = new Minio.Client({
  endPoint:  's3.amazonaws.com',
  useSSL:    true,
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY,
});
```

---

## Resource Requirements

### Minimum Cluster Size

For 2 replicas of each service (minimum HA):

| Component | CPU Request | Memory Request |
|-----------|-------------|----------------|
| api-gateway (×2) | 200m | 256Mi |
| pdf-service (×2) | 400m | 512Mi |
| conversion-service (×2) | 1000m | 1Gi |
| html-service (×2) | 1000m | 2Gi |
| storage-service (×2) | 400m | 512Mi |
| queue-service (×2) | 400m | 512Mi |
| organization-service (×2) | 400m | 512Mi |
| security-service (×2) | 400m | 512Mi |
| metadata-service (×2) | 400m | 512Mi |
| MySQL | 250m | 512Mi |
| Redis | 100m | 128Mi |
| MinIO | 250m | 512Mi |
| **Total** | **~5 CPU** | **~8Gi RAM** |

**Recommended minimum**: 3 nodes × (2 CPU, 4Gi RAM) = 6 CPU, 12Gi RAM

### At 1000 Concurrent Users (HPA max)

| Component | Max Pods | Max CPU | Max Memory |
|-----------|----------|---------|------------|
| api-gateway | 10 | 5 CPU | 5Gi |
| pdf-service | 10 | 10 CPU | 10Gi |
| conversion-service | 8 | 16 CPU | 16Gi |
| html-service | 6 | 12 CPU | 18Gi |
| others | varies | ~20 CPU | ~20Gi |
| **Total** | | **~63 CPU** | **~69Gi** |

**Recommended for 1k users**: 10–15 nodes × (8 CPU, 16Gi RAM)

---

## Monitoring

### Watch HPA Scaling

```bash
# Watch all HPAs in real time
kubectl get hpa -n pdfkit -w

# Describe a specific HPA for scaling history
kubectl describe hpa conversion-service-hpa -n pdfkit
```

### View Logs

```bash
# All pods for a service
kubectl logs -l app=pdf-service -n pdfkit --tail=100

# Follow logs from a specific pod
kubectl logs -f pdf-service-abc123 -n pdfkit

# All services at once (requires stern)
stern -n pdfkit ".*"
```

### Pod Metrics

```bash
# CPU and memory per pod
kubectl top pods -n pdfkit

# Node resource usage
kubectl top nodes
```

---

## Troubleshooting

### HPA Not Scaling

```bash
# Check if Metrics Server is running
kubectl get pods -n kube-system | grep metrics-server

# Check HPA events
kubectl describe hpa api-gateway-hpa -n pdfkit

# Verify resource requests are set (required for HPA)
kubectl describe pod <pod-name> -n pdfkit | grep -A5 "Requests"
```

### Pods Crashing (OOMKilled)

```bash
# Check pod events
kubectl describe pod <pod-name> -n pdfkit

# Increase memory limits in deployment.yaml
# For conversion-service, try limits.memory: 4Gi
# For html-service, try limits.memory: 4Gi
```

### MinIO Connection Refused

```bash
# Check MinIO pod
kubectl get pods -n pdfkit -l app=minio

# Check MinIO logs
kubectl logs -l app=minio -n pdfkit

# Test connectivity from another pod
kubectl exec -it <any-pod> -n pdfkit -- wget -qO- http://minio:9000/minio/health/live
```

### File Not Found After Upload

This means a pod is writing to local disk instead of MinIO. Check that:
1. `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` are set in the pod
2. The service is using `minioClient.ts` for file I/O (not `fs.writeFile`)
3. MinIO buckets exist (`pdfkit-uploads`, `pdfkit-outputs`)

---

## Deleting the Deployment

```bash
# Delete all PDFKit resources (keeps PVCs — data is preserved)
kubectl delete namespace pdfkit

# Delete PVCs too (destroys all data — irreversible)
kubectl delete pvc --all -n pdfkit
kubectl delete namespace pdfkit
```

---

## TLS / HTTPS

```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF

# Then uncomment the tls section in k8s/ingress.yaml
```
