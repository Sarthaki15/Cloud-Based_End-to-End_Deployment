# End-to-End CI/CD Deployment Guide

This README contains only the setup, configuration, deployment, verification, monitoring, and rollback steps for the project.

> **Important:** Terraform is provisioned separately. It is not executed by the Jenkins application deployment pipeline. Jenkins deploys the application to the EKS cluster that was already created by Terraform.

---

## 1. Project Structure

```text
project/
│
├── app/
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── application files
│   │
│   └── backend/
│       ├── Dockerfile
│       ├── .env.example
│       └── application files
│
├── deployment/
│   └── kubernetes/
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       └── ingress.yaml
│
├── terraform/
│   ├── modules/
│   │   ├── vpc/
│   │   ├── ec2/
│   │   ├── security-group/
│   │   ├── iam/
│   │   └── eks/
│   └── main.tf
│
├── monitoring/
│   └── datadog/
│       └── values.yaml
│
├── Jenkinsfile
├── sonar-project.properties
└── README.md
```

---

## 2. Prerequisites

Use an Ubuntu machine for Jenkins and administration.

Check the required tools:

```bash
java -version
git --version
node -v
npm -v
docker --version
aws --version
kubectl version --client
helm version
terraform version
sonar-scanner --version
```

Check Jenkins:

```bash
sudo systemctl status jenkins
```

Check Docker:

```bash
docker ps
```

Make sure the Jenkins user has permission to run Docker.

---

## 3. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Enter the repository:

```bash
cd YOUR_REPOSITORY_NAME
```

---

## 4. Configure Environment Files

The repository contains `.env.example` files.

Create the actual `.env` files before local testing or application builds.

### 4.1 Frontend

```bash
cd app/frontend
cp .env.example .env
```

Edit:

```text
app/frontend/.env
```

Configure:

```env
VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
VITE_API_BASE_URL=YOUR_BACKEND_API_URL/api
```

For local backend testing:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 4.2 Backend

```bash
cd ../backend
cp .env.example .env
```

Edit:

```text
app/backend/.env
```

Configure:

```env
PORT=4000
NODE_ENV=production
CLIENT_ORIGIN=YOUR_FRONTEND_URL

AWS_REGION=ap-south-1

COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

DYNAMO_MENU_TABLE=CafeMenuItems
DYNAMO_ORDERS_TABLE=CafeOrders
```

For local frontend testing:

```env
CLIENT_ORIGIN=http://localhost:8080
```

### Important

Do not push real `.env` files to GitHub.

Use `.env.example` only for placeholders and documentation.

---

## Cognito Setup :

1. **AWS Console → Cognito → User Pools → Create user pool**

2. **Application type:** Select **Single-page application (SPA)**.

3. **Sign-in option:** Select **Email**.

4. **Required attribute:** Select **email**.

5. **MFA:** Select **No MFA** for this project.

6. **Self sign-up:** Enable it if users should register themselves.

7. **Create the User Pool.**

8. Copy the **User Pool ID**:

```text
ap-south-1_xxxxxxxxx
```

9. Go to **Applications → App clients → Create app client** and create a **public SPA client** without a client secret.

10. Copy the **Client ID**.

11. Configure callback/sign-out URLs if using Cognito Hosted UI/OAuth:

```text
http://localhost:5173/
https://YOUR_FRONTEND_DOMAIN/
```

12. Configure OAuth when required:

```text
Authorization code grant
Scopes: openid, email
```

13. Put the values in the frontend `.env`:

```env
VITE_COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
VITE_API_BASE_URL=http://localhost:4000/api
```

14. Put the corresponding backend values in `app/backend/.env`:

```env
AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=YOUR_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_CLIENT_ID
```

15. Test **signup/login** locally before moving to Docker, Kubernetes, and Jenkins.

16. Keep the real `.env` files **out of GitHub**; commit only `.env.example`.

Do not put a private client secret in frontend code.

### 5.3 Update Frontend `.env`

```env
VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
```

### 5.4 Update Backend `.env`

```env
AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
```

### 5.5 Configure Callback and Sign-out URLs

If the application uses Cognito Hosted UI or OAuth, configure the deployed frontend URL in the Cognito app client settings.

Use the exact URL required by the application's authentication flow.

---

## 6. Configure DynamoDB

Create the required DynamoDB tables in the same AWS region used by the backend.

Example:

```text
CafeMenuItems
CafeOrders
```

Configure:

```env
AWS_REGION=ap-south-1
DYNAMO_MENU_TABLE=CafeMenuItems
DYNAMO_ORDERS_TABLE=CafeOrders
```

The application should access AWS services using IAM permissions rather than long-lived AWS access keys inside the application container.

---

## 7. Test the Application Locally

### 7.1 Backend

```bash
cd app/backend
npm install
npm start
```

Backend:

```text
http://localhost:4000
```

Health endpoint:

```text
http://localhost:4000/api/health
```

### 7.2 Frontend

Open another terminal:

```bash
cd app/frontend
npm install
npm run dev
```

Open the URL shown by Vite.

Verify:

```text
Login
Cognito authentication
Frontend-to-backend API calls
Application data
Menu operations
Order operations
```

---

## 8. Configure AWS CLI

Configure AWS on the machine used to provision the infrastructure:

```bash
aws configure
```

Verify:

```bash
aws sts get-caller-identity
```

Use an IAM identity with only the permissions required for this project.

---

## 9. Provision AWS Infrastructure with Terraform

Terraform must be run separately from the Jenkins application deployment pipeline.

### 9.1 Enter Terraform Directory

```bash
cd terraform
```

### 9.2 Initialize Terraform

```bash
terraform init
```

### 9.3 Format

```bash
terraform fmt -recursive
```

### 9.4 Validate

```bash
terraform validate
```

Expected:

```text
Success! The configuration is valid.
```

### 9.5 Review Plan

```bash
terraform plan
```

Review the resources carefully.

### 9.6 Provision Infrastructure

```bash
terraform apply
```

Confirm when prompted.

### 9.7 Get Outputs

```bash
terraform output
```

Note:

```text
EKS cluster name
AWS region
```

### 9.8 Configure kubectl

```bash
aws eks update-kubeconfig \
  --region YOUR_AWS_REGION \
  --name YOUR_EKS_CLUSTER_NAME
```

Verify:

```bash
kubectl get nodes
```

The EKS cluster must be ready before Jenkins performs the application deployment.

> **Do not run `terraform apply` from the Jenkins application deployment pipeline.**

---

## 10. Build Docker Images

### 10.1 Frontend

From the repository root:

```bash
docker build \
  -t YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest \
  ./app/frontend
```

### 10.2 Backend

```bash
docker build \
  -t YOUR_DOCKERHUB_USERNAME/cafe-backend:latest \
  ./app/backend
```

### 10.3 Check Images

```bash
docker images
```

---

## 11. Configure Docker Hub

Create two Docker Hub repositories:

```text
YOUR_DOCKERHUB_USERNAME/cafe-frontend
YOUR_DOCKERHUB_USERNAME/cafe-backend
```

Create a Docker Hub Access Token.

Use the access token in Jenkins instead of the Docker Hub account password.

---

## 12. Test Docker Containers

### 12.1 Backend

```bash
docker run --rm -p 4000:4000 \
  YOUR_DOCKERHUB_USERNAME/cafe-backend:latest
```

Test:

```text
http://localhost:4000/api/health
```

### 12.2 Frontend

```bash
docker run --rm -p 8080:80 \
  YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest
```

Open:

```text
http://localhost:8080
```

---

## 13. Configure Kubernetes

Kubernetes files are stored in:

```text
deployment/kubernetes/
```

Required files:

```text
frontend-deployment.yaml
frontend-service.yaml
backend-deployment.yaml
backend-service.yaml
configmap.yaml
secret.yaml
ingress.yaml
```

### 13.1 Update Frontend Image

In the frontend Deployment:

```yaml
image: YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest
```

### 13.2 Update Backend Image

In the backend Deployment:

```yaml
image: YOUR_DOCKERHUB_USERNAME/cafe-backend:latest
```

The backend listens on:

```text
4000
```

### 13.3 Configure Environment Values

Use:

```text
ConfigMap
```

for normal application configuration.

Use:

```text
Secret
```

for sensitive application values.

Do not commit real secret values.

---

## 14. Test Kubernetes Deployment Manually

Check EKS:

```bash
kubectl get nodes
```

Apply the Kubernetes manifests:

```bash
kubectl apply -f deployment/kubernetes/
```

Check resources:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress
```

Check backend Pods:

```bash
kubectl get pods -l app=backend
```

Check frontend Pods:

```bash
kubectl get pods -l app=frontend
```

View logs:

```bash
kubectl logs POD_NAME
```

Verify the backend health endpoint.

---

## 15. Configure Ingress

Make sure the required Ingress Controller is installed in the EKS cluster.

Check:

```bash
kubectl get ingress
```

Get the load balancer / Ingress address:

```bash
kubectl get ingress
```

Use the resulting address to access the application.

---

## 16. Jenkins Setup

Start Jenkins:

```bash
sudo systemctl start jenkins
```

Check:

```bash
sudo systemctl status jenkins
```

Open Jenkins in the browser.

Create a Pipeline job:

```text
New Item
→ Pipeline
```

---

## 17. Install Jenkins Plugins

Go to:

```text
Manage Jenkins
→ Plugins
```

Install the plugins required by the Jenkinsfile.

Common plugins:

```text
Pipeline
Git
GitHub integration / GitHub Branch Source
Credentials Binding
Docker Pipeline
AWS Credentials
SonarQube Scanner
```

---

## 18. Configure Jenkins Credentials

Go to:

```text
Manage Jenkins
→ Credentials
→ System
→ Global credentials
```

### 18.1 Docker Hub

Create:

```text
Kind: Username with password
Username: YOUR_DOCKERHUB_USERNAME
Password: YOUR_DOCKERHUB_ACCESS_TOKEN
ID: dockerhub-credentials
```

### 18.2 AWS

Create:

```text
Kind: AWS Credentials
ID: aws-jenkins-credentials
Access Key ID: YOUR_AWS_ACCESS_KEY
Secret Access Key: YOUR_AWS_SECRET_KEY
```

### 18.3 SonarQube

Create/configure the SonarQube token in Jenkins Credentials.

Do not place tokens directly inside the Jenkinsfile.

---

## 19. Configure SonarQube

Create a SonarQube project.

Example:

```text
Project Key: cafe-webapp
```

The repository contains:

```text
sonar-project.properties
```

Example:

```properties
sonar.projectKey=cafe-webapp
sonar.projectName=Cafe Web App
sonar.projectVersion=1.0

sonar.sources=app/frontend,app/backend
sonar.sourceEncoding=UTF-8

sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
```

### 19.1 Configure SonarQube in Jenkins

Go to:

```text
Manage Jenkins
→ System
→ SonarQube servers
```

Set:

```text
Name: SonarQube
```

The Jenkinsfile should reference:

```text
withSonarQubeEnv('SonarQube')
```

### 19.2 Configure SonarQube Webhook

Configure the SonarQube webhook:

```text
https://YOUR_JENKINS_URL/sonarqube-webhook/
```

---

## 20. Configure Jenkins Pipeline from SCM

In Jenkins:

```text
New Item
→ Pipeline
```

Set:

```text
Definition: Pipeline script from SCM
SCM: Git
Repository URL: YOUR_GITHUB_REPOSITORY_URL
Branch: */main
Script Path: Jenkinsfile
```

---

## 21. Configure GitHub Webhook

In GitHub:

```text
Repository
→ Settings
→ Webhooks
→ Add webhook
```

Set:

```text
Payload URL:
https://YOUR_JENKINS_URL/github-webhook/
```

Content type:

```text
application/json
```

Select:

```text
Just the push event
```

Save the webhook.

Test:

```bash
git add .
git commit -m "Update application"
git push origin main
```

---

## 22. Jenkins CI/CD Pipeline

The application deployment pipeline runs in this order:

```text
Checkout
↓
Frontend Build
↓
Backend Install
↓
SonarQube Analysis
↓
Quality Gate
↓
Docker Build
↓
Push to Docker Hub
↓
Deploy to EKS
↓
Rollout Verification
```

### 22.1 Checkout

Jenkins checks out the latest code from GitHub.

### 22.2 Frontend Build

```bash
cd app/frontend
npm ci
npm run build
```

### 22.3 Backend Install

```bash
cd app/backend
npm ci
```

### 22.4 SonarQube Analysis

Jenkins runs the scanner using:

```text
sonar-project.properties
```

### 22.5 Quality Gate

```text
PASS → continue
FAIL → stop
```

The Jenkinsfile should use:

```text
waitForQualityGate abortPipeline: true
```

### 22.6 Docker Build

Jenkins builds:

```text
YOUR_DOCKERHUB_USERNAME/cafe-frontend:BUILD_NUMBER
YOUR_DOCKERHUB_USERNAME/cafe-backend:BUILD_NUMBER
```

### 22.7 Push to Docker Hub

Jenkins uses:

```text
dockerhub-credentials
```

to log in and push both images.

### 22.8 Deploy to EKS

Jenkins connects to the existing EKS cluster:

```bash
aws eks update-kubeconfig \
  --region YOUR_AWS_REGION \
  --name YOUR_EKS_CLUSTER_NAME
```

Update the frontend:

```bash
kubectl set image deployment/frontend \
  frontend=YOUR_DOCKERHUB_USERNAME/cafe-frontend:$BUILD_NUMBER
```

Update the backend:

```bash
kubectl set image deployment/backend \
  backend=YOUR_DOCKERHUB_USERNAME/cafe-backend:$BUILD_NUMBER
```

### 22.9 Rollout Verification

```bash
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
```

---

## 23. Configure Datadog

### 23.1 Add Helm Repository

```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update
```

### 23.2 Create Namespace

```bash
kubectl create namespace datadog
```

### 23.3 Create Datadog Secret

Set the API key only in the shell:

```bash
export DD_API_KEY="YOUR_DATADOG_API_KEY"
```

Create the Kubernetes Secret:

```bash
kubectl create secret generic datadog-secret \
  --namespace datadog \
  --from-literal=api-key="$DD_API_KEY"
```

Do not commit the API key to GitHub.

### 23.4 Configure Datadog Values

Create:

```text
monitoring/datadog/values.yaml
```

Example:

```yaml
datadog:
  apiKeyExistingSecret: datadog-secret
  clusterName: YOUR_EKS_CLUSTER_NAME
  site: datadoghq.com

logs:
  enabled: true
  containerCollectAll: true

processAgent:
  enabled: true
```

The API key must not be stored in `values.yaml`.

### 23.5 Install Datadog Agent

```bash
helm install datadog-agent \
  -f monitoring/datadog/values.yaml \
  datadog/datadog \
  --namespace datadog
```

### 23.6 Verify Datadog

```bash
kubectl get pods -n datadog
kubectl get daemonset -n datadog
helm list -n datadog
```

### 23.7 Verify Kubernetes Monitoring

In Datadog:

```text
Infrastructure
→ Kubernetes
```

Verify:

```text
EKS nodes
Pods
Containers
CPU usage
Memory usage
Network usage
Pod restarts
Node health
```

### 23.8 Verify Logs

In Datadog:

```text
Logs
→ Explorer
```

Verify that application and container logs are being received.

### 23.9 Create Dashboard

Add:

```text
EKS CPU
EKS memory
Pod CPU
Pod memory
Pod restarts
Network traffic
Application logs
```

### 23.10 Create Alerts

Configure alerts for:

```text
High CPU
High memory
High disk usage
Pod unavailable
Pod restart / crash-loop
Node unavailable
High application error rate
```

---

## 24. First End-to-End Deployment

### Step 1: Make a Code Change

Make a small application change.

### Step 2: Commit

```bash
git add .
git commit -m "Update application"
```

### Step 3: Push

```bash
git push origin main
```

### Step 4: Verify GitHub Webhook

Verify that GitHub sends the push event to Jenkins.

### Step 5: Verify Jenkins

Verify that Jenkins:

```text
Checks out the latest code
Builds the application
Runs SonarQube analysis
Checks the Quality Gate
Builds Docker images
Pushes images to Docker Hub
Deploys to EKS
Verifies the rollout
```

### Step 6: Verify Kubernetes

```bash
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get ingress
```

### Step 7: Verify Application

Open the frontend using the Ingress/load-balancer address.

Test:

```text
Login
Cognito authentication
Frontend-to-backend API calls
DynamoDB operations
Application functionality
```

### Step 8: Verify Datadog

Check:

```text
EKS cluster
Nodes
Pods
Metrics
Logs
Alerts
```

---

## 25. Rollback

Check deployment history:

```bash
kubectl rollout history deployment/frontend
kubectl rollout history deployment/backend
```

Rollback frontend:

```bash
kubectl rollout undo deployment/frontend
```

Rollback backend:

```bash
kubectl rollout undo deployment/backend
```

Verify:

```bash
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
```

---

## 26. Security Checklist

Never commit:

```text
Real .env files
AWS access keys
AWS secret keys
Docker Hub passwords
Docker Hub access tokens
SonarQube tokens
Datadog API keys
SSH private keys
Terraform state files
```

Use:

```text
.env.example
Jenkins Credentials
Kubernetes Secrets
IAM roles
Restricted Security Groups
Least-privilege IAM permissions
```

---
