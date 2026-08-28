End-to-End CI/CD Pipeline for a Containerized Web App

This project implements an end-to-end CI/CD pipeline for a React/Vite frontend and a Node.js/Express backend.

The application is containerized with Docker, images are stored in Docker Hub, AWS infrastructure is provisioned separately with Terraform, and the application is deployed to Amazon EKS using Kubernetes. SonarQube is used for code quality analysis, Amazon Cognito for authentication, DynamoDB for application data, and Datadog for monitoring.

Important: Terraform is provisioned separately. It is not executed by the Jenkins application deployment pipeline. Jenkins deploys the application to the EKS cluster that was already created by Terraform.

1. Architecture

Developer
    |
    | git push
    v
GitHub
    |
    | Webhook
    v
Jenkins
    |
    +--> Frontend Build
    |
    +--> Backend Install
    |
    +--> SonarQube Analysis
    |
    +--> Quality Gate
    |
    +--> Docker Build
    |
    +--> Push to Docker Hub
    |
    +--> Deploy to EKS
                 |
                 v
          Kubernetes / EKS
             |          |
             v          v
         Frontend     Backend
                           |
                    +------+------+
                    |             |
                    v             v
               Cognito        DynamoDB
                           |
                           v
                       Datadog
                  Metrics + Logs + Alerts

2. Application

The application is separated into:

app/
├── frontend/
└── backend/

Frontend

React

Vite

Production build: npm run build

Docker container served by Nginx

Container port: 80

Backend

Node.js

Express

Starts with npm start

Container port: 4000

Health endpoint: /api/health

3. Repository Structure

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
│   │
│   └── main.tf
│
├── deployment/
│   └── monitoring/
│       └── datadog/
│           └── values.yaml
│
├── Jenkinsfile
├── sonar-project.properties
└── README.md

4. Prerequisites

Use an Ubuntu machine for Jenkins and administration.

Check/install the required tools:

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

Check Jenkins:

sudo systemctl status jenkins

Check Docker:

docker ps

The Jenkins user must have permission to run Docker.

5. Clone the Repository

Clone the repository before configuring the application:

git clone YOUR_GITHUB_REPOSITORY_URL

Enter the repository:

cd YOUR_REPOSITORY_NAME

6. Configure .env Files

The repository contains .env.example files.

Create the real .env files from the examples.

Do this before testing/building the application.

6.1 Frontend

Go to:

cd app/frontend

Create .env:

cp .env.example .env

Edit:

app/frontend/.env

Set:

VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
VITE_API_BASE_URL=YOUR_BACKEND_API_URL/api

For local backend testing:

VITE_API_BASE_URL=http://localhost:4000/api

6.2 Backend

Go to:

cd ../backend

Create .env:

cp .env.example .env

Edit:

app/backend/.env

Set:

PORT=4000
NODE_ENV=production
CLIENT_ORIGIN=YOUR_FRONTEND_URL

AWS_REGION=ap-south-1

COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

DYNAMO_MENU_TABLE=CafeMenuItems
DYNAMO_ORDERS_TABLE=CafeOrders

For local frontend testing:

CLIENT_ORIGIN=http://localhost:8080

Important

Do not push real .env files to GitHub.

Use .env.example only for placeholders and documentation.

7. Configure Amazon Cognito

Amazon Cognito provides authentication.

7.1 Create User Pool

In AWS Console:

Amazon Cognito
→ User Pools
→ Create user pool

Save the:

User Pool ID

Example:

ap-south-1_xxxxxxxxx

7.2 Create App Client

Inside the User Pool:

Applications
→ App clients
→ Create app client

Save the:

Client ID

Do not put a private client secret in frontend code.

7.3 Update Frontend .env

VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

7.4 Update Backend .env

AWS_REGION=ap-south-1
COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

7.5 Configure Callback / Sign-out URLs

If the application uses Cognito Hosted UI or OAuth, configure the deployed frontend URL in the Cognito app client settings.

Use the exact URL required by the application's authentication flow.

8. Configure DynamoDB

Create the required DynamoDB tables in the same AWS region used by the backend.

Example:

CafeMenuItems
CafeOrders

Configure:

AWS_REGION=ap-south-1
DYNAMO_MENU_TABLE=CafeMenuItems
DYNAMO_ORDERS_TABLE=CafeOrders

The application should access AWS services using IAM permissions rather than long-lived AWS access keys inside the application container.

9. Test the Application Locally

Before setting up the CI/CD pipeline, verify that the application works.

9.1 Backend

cd app/backend
npm install
npm start

The backend should run on:

http://localhost:4000

Health endpoint:

http://localhost:4000/api/health

9.2 Frontend

Open another terminal:

cd app/frontend
npm install
npm run dev

Open the URL shown by Vite.

Test:

Login

Cognito authentication

Frontend-to-backend API calls

Application data

Menu operations

Order operations

Stop the local servers after testing.

10. Configure AWS CLI

Configure AWS on the machine that will provision the infrastructure:

aws configure

Verify:

aws sts get-caller-identity

Use an IAM identity with only the permissions required for this project.

11. Terraform Infrastructure

Terraform is used to provision the AWS infrastructure required by the application and EKS.

The Terraform configuration contains reusable modules for the existing infrastructure and an EKS module for the Kubernetes cluster.

11.1 Terraform Structure

terraform/
├── modules/
│   ├── vpc/
│   ├── ec2/
│   ├── security-group/
│   ├── iam/
│   └── eks/
│
└── main.tf

11.2 Initialize Terraform

cd terraform
terraform init

11.3 Format

terraform fmt -recursive

11.4 Validate

terraform validate

Expected:

Success! The configuration is valid.

11.5 Review the Plan

terraform plan

Review the resources carefully.

11.6 Provision the Infrastructure

terraform apply

Confirm when prompted.

Terraform creates the infrastructure required by the application, including the EKS cluster and worker nodes.

11.7 Get Outputs

terraform output

Note the EKS cluster name and AWS region.

11.8 Configure kubectl

aws eks update-kubeconfig \
  --region YOUR_AWS_REGION \
  --name YOUR_EKS_CLUSTER_NAME

Verify:

kubectl get nodes

At this point, the EKS cluster is ready for the application deployment.

Terraform ends here for the normal application deployment flow. Jenkins does not run terraform apply.

12. Docker Images

The application has separate Dockerfiles:

app/
├── frontend/
│   └── Dockerfile
└── backend/
    └── Dockerfile

12.1 Build Frontend Image

From the repository root:

docker build \
  -t YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest \
  ./app/frontend

12.2 Build Backend Image

docker build \
  -t YOUR_DOCKERHUB_USERNAME/cafe-backend:latest \
  ./app/backend

12.3 Check Images

docker images

13. Docker Hub Setup

Create two repositories in Docker Hub:

YOUR_DOCKERHUB_USERNAME/cafe-frontend
YOUR_DOCKERHUB_USERNAME/cafe-backend

Create a Docker Hub Access Token.

Use the access token in Jenkins instead of the Docker Hub account password.

14. Test Docker Containers

14.1 Backend

docker run --rm -p 4000:4000 \
  YOUR_DOCKERHUB_USERNAME/cafe-backend:latest

Test:

http://localhost:4000/api/health

14.2 Frontend

docker run --rm -p 8080:80 \
  YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest

Open:

http://localhost:8080

15. Kubernetes Configuration

Kubernetes files are stored in:

deployment/kubernetes/

Expected files:

frontend-deployment.yaml
frontend-service.yaml
backend-deployment.yaml
backend-service.yaml
configmap.yaml
secret.yaml
ingress.yaml

15.1 Frontend Deployment

The frontend Deployment runs multiple replicas.

Example image:

image: YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest

15.2 Backend Deployment

The backend Deployment runs multiple replicas.

Example image:

image: YOUR_DOCKERHUB_USERNAME/cafe-backend:latest

The backend listens on port:

4000

15.3 Services

Frontend:

frontend-service

Backend:

backend-service

Services provide stable communication between Pods.

15.4 Health Checks

The backend health endpoint is:

/api/health

Use:

Liveness Probe
Readiness Probe

Liveness checks whether the application is running.

Readiness checks whether the Pod is ready to receive traffic.

15.5 Environment Configuration

Use:

ConfigMap

for normal application configuration.

Use:

Secret

for sensitive application values.

Do not commit real secret values.

16. Test Kubernetes Manually

Before Jenkins performs the deployment, test the Kubernetes configuration once.

Make sure EKS is accessible:

kubectl get nodes

Apply the application resources:

kubectl apply -f deployment/kubernetes/

Check:

kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress

Check backend Pods:

kubectl get pods -l app=backend

Check frontend Pods:

kubectl get pods -l app=frontend

View logs:

kubectl logs POD_NAME

Verify the backend health endpoint.

Once the manual Kubernetes deployment works, Jenkins can automate the same deployment.

17. Ingress

The Ingress provides external access to the frontend.

Traffic flow:

Internet
   ↓
Ingress
   ↓
Frontend Service
   ↓
Frontend Pods
   ↓
Backend Service
   ↓
Backend Pods
   ↓
Cognito / DynamoDB

Make sure the required Ingress Controller is installed in the EKS cluster.

Check:

kubectl get ingress

Use the load balancer/Ingress address to access the application.

18. Jenkins Setup

Start Jenkins:

sudo systemctl start jenkins

Check:

sudo systemctl status jenkins

Open Jenkins in the browser.

Create a Pipeline job:

New Item
→ Pipeline

19. Jenkins Plugins

From:

Manage Jenkins
→ Plugins

Install the plugins required for the selected Jenkins setup.

Common plugins for this project include:

Pipeline

Git

GitHub integration / GitHub Branch Source

Credentials Binding

Docker Pipeline

AWS Credentials

SonarQube Scanner

Use the plugin versions compatible with your Jenkins installation.

20. Jenkins Credentials

Go to:

Manage Jenkins
→ Credentials
→ System
→ Global credentials

20.1 Docker Hub

Create:

Kind: Username with password

Username:
YOUR_DOCKERHUB_USERNAME

Password:
YOUR_DOCKERHUB_ACCESS_TOKEN

ID:
dockerhub-credentials

The Jenkinsfile uses:

dockerhub-credentials

20.2 AWS

Create:

Kind: AWS Credentials

ID:
aws-jenkins-credentials

Access Key ID:
YOUR_AWS_ACCESS_KEY

Secret Access Key:
YOUR_AWS_SECRET_KEY

These credentials are used by Jenkins to run AWS CLI commands and connect to the existing EKS cluster.

20.3 SonarQube

Create/configure the SonarQube token in Jenkins Credentials.

Do not place the token directly inside the Jenkinsfile.

21. SonarQube Setup

Create a SonarQube project.

Example:

Project Key:
cafe-webapp

The repository contains:

sonar-project.properties

Example:

sonar.projectKey=cafe-webapp
sonar.projectName=Cafe Web App
sonar.projectVersion=1.0

sonar.sources=app/frontend,app/backend
sonar.sourceEncoding=UTF-8

sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**

Configure SonarQube in Jenkins:

Manage Jenkins
→ System
→ SonarQube servers

Use:

Name:
SonarQube

The Jenkinsfile references:

withSonarQubeEnv('SonarQube')

SonarQube Webhook

Configure a SonarQube webhook to:

https://YOUR_JENKINS_URL/sonarqube-webhook/

The webhook allows Jenkins to receive the Quality Gate result.

22. Quality Gate

The Quality Gate controls whether the pipeline can continue.

SonarQube Analysis
        ↓
    Quality Gate
       /      \
    PASS      FAIL
     ↓          ↓
Continue       Stop

The Jenkinsfile uses:

waitForQualityGate abortPipeline: true

If the Quality Gate fails, Jenkins stops before Docker push and EKS deployment.

23. Configure Jenkins Pipeline from SCM

In Jenkins:

New Item
→ Pipeline

Choose:

Definition:
Pipeline script from SCM

Select:

Git

Set:

Repository URL:
YOUR_GITHUB_REPOSITORY_URL

Branch:
*/main

Script Path:
Jenkinsfile

24. GitHub Webhook

The pipeline should start automatically after a Git push.

In GitHub:

Repository
→ Settings
→ Webhooks
→ Add webhook

Set:

Payload URL:
https://YOUR_JENKINS_URL/github-webhook/

Set:

Content type:
application/json

Select:

Just the push event

Save the webhook.

The Jenkinsfile contains:

triggers {
    githubPush()
}

Pipeline trigger flow:

git push
   ↓
GitHub
   ↓
Webhook
   ↓
Jenkins
   ↓
Pipeline starts automatically

25. Jenkins CI/CD Pipeline

The current pipeline is:

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

The current application does not have dedicated npm lint and test scripts, so those stages are not included unless they are actually added to the application.

25.1 Checkout

Jenkins checks out the latest code from GitHub.

25.2 Frontend Build

cd app/frontend
npm ci
npm run build

25.3 Backend Install

cd app/backend
npm ci

25.4 SonarQube Analysis

Jenkins runs the scanner using:

sonar-project.properties

25.5 Quality Gate

Jenkins waits for the SonarQube result.

PASS → continue
FAIL → stop

25.6 Docker Build

Jenkins builds:

YOUR_DOCKERHUB_USERNAME/cafe-frontend:BUILD_NUMBER
YOUR_DOCKERHUB_USERNAME/cafe-backend:BUILD_NUMBER

25.7 Push to Docker Hub

Jenkins uses:

dockerhub-credentials

to log in and push both images.

25.8 Deploy to EKS

Jenkins uses:

aws-jenkins-credentials

to configure access:

aws eks update-kubeconfig \
  --region YOUR_AWS_REGION \
  --name YOUR_EKS_CLUSTER_NAME

Then update the Deployments:

kubectl set image deployment/frontend \
  frontend=YOUR_DOCKERHUB_USERNAME/cafe-frontend:$BUILD_NUMBER

kubectl set image deployment/backend \
  backend=YOUR_DOCKERHUB_USERNAME/cafe-backend:$BUILD_NUMBER

25.9 Rollout Verification

kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend

26. Datadog Integration

Datadog monitors the EKS cluster, Kubernetes nodes, Pods, containers, and application logs.

The project uses the Datadog Helm chart.

26.1 Add Helm Repository

helm repo add datadog https://helm.datadoghq.com
helm repo update

26.2 Create Namespace

kubectl create namespace datadog

26.3 Create Datadog Secret

Set the API key only in the shell:

export DD_API_KEY="YOUR_DATADOG_API_KEY"

Create the Kubernetes Secret:

kubectl create secret generic datadog-secret \
  --namespace datadog \
  --from-literal=api-key="$DD_API_KEY"

Do not commit the API key to GitHub.

26.4 Configure Datadog

Create:

deployment/monitoring/datadog/values.yaml

Use:

datadog:
  apiKeyExistingSecret: datadog-secret
  clusterName: YOUR_EKS_CLUSTER_NAME
  site: datadoghq.com

  logs:
    enabled: true
    containerCollectAll: true

  processAgent:
    enabled: true

The API key is not stored in the values file.

26.5 Install Datadog Agent

helm install datadog-agent \
  -f deployment/monitoring/datadog/values.yaml \
  datadog/datadog \
  --namespace datadog

26.6 Verify

kubectl get pods -n datadog

kubectl get daemonset -n datadog

helm list -n datadog

26.7 Monitor Kubernetes

In Datadog:

Infrastructure
→ Kubernetes

Monitor:

EKS nodes

Pods

Containers

CPU usage

Memory usage

Network usage

Pod restarts

Node health

26.8 Monitor Logs

With container log collection enabled, the Datadog Agent collects Kubernetes container logs.

Open:

Logs
→ Explorer

Use application/service filters as needed.

26.9 Dashboards

Create a dashboard with:

EKS CPU
EKS memory
Pod CPU
Pod memory
Pod restarts
Network traffic
Application logs

26.10 Alerts

Recommended monitors:

High CPU
High memory
High disk usage
Pod unavailable
Pod restart / crash-loop
Node unavailable
High application error rate

27. First End-to-End Deployment

After all infrastructure and service configuration is complete, test the complete CI/CD flow.

Step 1: Make a Code Change

Make a small change to the application.

Step 2: Commit

git add .
git commit -m "Update application"

Step 3: Push

git push origin main

Step 4: GitHub Webhook

GitHub sends the push event to Jenkins.

Step 5: Jenkins Checkout

Jenkins checks out the latest commit.

Step 6: Build

Jenkins installs dependencies and builds the frontend.

Step 7: SonarQube

Jenkins sends the source code for analysis.

Step 8: Quality Gate

PASS → continue
FAIL → pipeline stops

Step 9: Docker

Jenkins builds the frontend and backend images.

Step 10: Docker Hub

Jenkins pushes the images using the Docker Hub credential.

Step 11: EKS

Jenkins connects to the already-created EKS cluster.

Step 12: Kubernetes

Jenkins updates the frontend and backend Deployments.

Step 13: Rollout

Jenkins waits for:

kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend

Step 14: Verify the Application

kubectl get pods
kubectl get deployments
kubectl get services
kubectl get ingress

Open the frontend using the Ingress/load-balancer address.

Test:

Login

Cognito authentication

Frontend-to-backend API calls

DynamoDB operations

Application functionality

Step 15: Check Datadog

Verify:

EKS cluster
Nodes
Pods
Metrics
Logs
Alerts

28. Rollback

Check deployment history:

kubectl rollout history deployment/frontend
kubectl rollout history deployment/backend

Rollback frontend:

kubectl rollout undo deployment/frontend

Rollback backend:

kubectl rollout undo deployment/backend

Verify:

kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend

29. Useful Commands

Git

git status
git add .
git commit -m "message"
git push origin main

Terraform

terraform init
terraform fmt -recursive
terraform validate
terraform plan
terraform apply
terraform output
terraform destroy

AWS

aws sts get-caller-identity

aws eks update-kubeconfig \
  --region YOUR_AWS_REGION \
  --name YOUR_EKS_CLUSTER_NAME

Kubernetes

kubectl get nodes
kubectl get pods
kubectl get deployments
kubectl get services
kubectl get ingress
kubectl logs POD_NAME
kubectl describe pod POD_NAME
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
kubectl top nodes
kubectl top pods

Helm

helm repo update
helm list -n datadog

30. Security Checklist

Never commit:

Real .env files

AWS access keys

AWS secret keys

Docker Hub passwords

Docker Hub access tokens

SonarQube tokens

Datadog API keys

SSH private keys

Terraform state files

Use:

.env.example for configuration templates

Jenkins Credentials for CI/CD credentials

Kubernetes Secrets for sensitive application values

IAM roles/workload identity for AWS access from EKS workloads

Restricted Security Groups

Least-privilege IAM permissions

31. Final Workflow

Clone Repository
      ↓
Create .env from .env.example
      ↓
Configure Cognito / DynamoDB values
      ↓
Test Application Locally
      ↓
Install Required Tools
      ↓
Configure AWS CLI
      ↓
Terraform Init
      ↓
Terraform Plan
      ↓
Terraform Apply
      ↓
EKS Cluster Ready
      ↓
Configure kubectl
      ↓
Test Kubernetes Deployment
      ↓
Configure Jenkins
      ↓
Install Jenkins Plugins
      ↓
Add Jenkins Credentials
      ↓
Configure SonarQube
      ↓
Configure Docker Hub
      ↓
Configure Datadog
      ↓
Configure GitHub Webhook
      ↓
git push
      ↓
Jenkins Triggered
      ↓
Build
      ↓
SonarQube Analysis
      ↓
Quality Gate
      ↓
Docker Build
      ↓
Docker Hub Push
      ↓
EKS Deployment
      ↓
Rollout Verification
      ↓
Application Running
      ↓
Datadog Monitoring

Project Result

This project demonstrates:

GitHub-triggered CI/CD

Jenkins automation

SonarQube code analysis

Quality Gate protection

Frontend and backend containerization

Docker Hub image management

Terraform-based AWS/EKS infrastructure

Kubernetes deployment

Liveness and readiness probes

Amazon Cognito authentication

DynamoDB integration

Datadog metrics and log monitoring

Kubernetes rollout and rollback