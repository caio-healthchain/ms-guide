#!/bin/bash

# Script de build e deploy do ms-guide para Azure Kubernetes Service (AKS)

set -e

# Variáveis
ACR_NAME="lazarusacr"
IMAGE_NAME="ms-guide"
TAG="${1:-latest}"
RESOURCE_GROUP="lazarus-rg"
AKS_CLUSTER="lazarus-aks"

echo "🚀 Starting build and deploy process for ms-guide..."

# 1. Build da imagem Docker
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:${TAG} .

# 2. Tag da imagem para o Azure Container Registry
echo "🏷️  Tagging image for ACR..."
docker tag ${IMAGE_NAME}:${TAG} ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG}

# 3. Login no Azure Container Registry
echo "🔐 Logging in to Azure Container Registry..."
az acr login --name ${ACR_NAME}

# 4. Push da imagem para o ACR
echo "⬆️  Pushing image to ACR..."
docker push ${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TAG}

# 5. Get AKS credentials
echo "🔑 Getting AKS credentials..."
az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${AKS_CLUSTER} --overwrite-existing

# 6. Apply Kubernetes configurations
echo "☸️  Applying Kubernetes configurations..."
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/services-clusterip-updated.yaml
kubectl apply -f k8s/ingress-nginx-updated.yaml

# 7. Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/ms-guide

# 8. Get service status
echo "✅ Deployment completed! Service status:"
kubectl get pods -l app=ms-guide
kubectl get svc guide-service

echo "🎉 Build and deploy completed successfully!"
echo "📝 To check logs, run: kubectl logs -l app=ms-guide -f"
echo "🔍 To check service health, run: kubectl exec -it <pod-name> -- curl http://localhost:3011/health"
