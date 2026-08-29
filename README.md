End-to-End CI/CD Deployment Guide

This README contains only the setup, configuration, deployment,
verification, monitoring, and rollback steps for the project.

Important: Terraform is provisioned separately. It is not executed by
the Jenkins application deployment pipeline. Jenkins deploys the
application to the EKS cluster that was already created by Terraform.

1.  Project Structure

project/ │ ├── app/ │ ├── frontend/ │ │ ├── Dockerfile │ │ ├──
.env.example │ │ └── application files │ │ │ └── backend/ │ ├──
Dockerfile │ ├── .env.example │ └── application files │ ├── deployment/
│ └── kubernetes/ │ ├── frontend-deployment.yaml │ ├──
frontend-service.yaml │ ├── backend-deployment.yaml │ ├──
backend-service.yaml │ ├── configmap.yaml │ ├── secret.yaml │ └──
ingress.yaml │ ├── terraform/ │ ├── modules/ │ │ ├── vpc/ │ │ ├── ec2/ │
│ ├── security-group/ │ │ ├── iam/ │ │ └── eks/ │ └── main.tf │ ├──
deployment/ │ └── monitoring/ │ └── datadog/ │ └── values.yaml │ ├──
Jenkinsfile ├── sonar-project.properties └── README.md

2.  Prerequisites

Use an Ubuntu machine for Jenkins and administration.

Check the required tools:

java -version git --version node -v npm -v docker --version aws
--version kubectl version --client helm version terraform version
sonar-scanner --version

Check Jenkins:

sudo systemctl status jenkins

Check Docker:

docker ps

Make sure the Jenkins user has permission to run Docker.

3.  Clone the Repository

Clone the repository:

git clone YOUR_GITHUB_REPOSITORY_URL

Enter the repository:

cd YOUR_REPOSITORY_NAME

4.  Configure Environment Files

The repository contains .env.example files.

Create the real .env files before local testing or application builds.

4.1 Frontend

cd app/frontend cp .env.example .env

Edit:

app/frontend/.env

Set:

VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID
VITE_API_BASE_URL=YOUR_BACKEND_API_URL/api

For local backend testing:

VITE_API_BASE_URL=http://localhost:4000/api

4.2 Backend

cd ../backend cp .env.example .env

Edit:

app/backend/.env

Set:

PORT=4000 NODE_ENV=production CLIENT_ORIGIN=YOUR_FRONTEND_URL

AWS_REGION=ap-south-1

COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

DYNAMO_MENU_TABLE=CafeMenuItems DYNAMO_ORDERS_TABLE=CafeOrders

For local frontend testing:

CLIENT_ORIGIN=http://localhost:8080

Important

Do not push real .env files to GitHub.

Use .env.example only for placeholders and documentation.

5.  Configure Amazon Cognito

5.1 Create User Pool

In AWS Console:

Amazon Cognito → User Pools → Create user pool

Save the:

User Pool ID

Example:

ap-south-1_xxxxxxxxx

5.2 Create App Client

Inside the User Pool:

Applications → App clients → Create app client

Save the:

Client ID

Do not put a private client secret in frontend code.

5.3 Update Frontend .env

VITE_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

5.4 Update Backend .env

AWS_REGION=ap-south-1 COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
COGNITO_CLIENT_ID=YOUR_COGNITO_CLIENT_ID

5.5 Configure Callback / Sign-out URLs

If the application uses Cognito Hosted UI or OAuth, configure the
deployed frontend URL in the Cognito app client settings.

Use the exact URL required by the application's authentication flow.

6.  Configure DynamoDB

Create the required DynamoDB tables in the same AWS region used by the
backend.

Example:

CafeMenuItems CafeOrders

Configure the backend:

AWS_REGION=ap-south-1 DYNAMO_MENU_TABLE=CafeMenuItems
DYNAMO_ORDERS_TABLE=CafeOrders

The application should access AWS services using IAM permissions rather
than long-lived AWS access keys inside the application container.

7.  Test the Application Locally

Before deploying, verify that the application works.

7.1 Backend

cd app/backend npm install npm start

Backend:

http://localhost:4000

Health endpoint:

http://localhost:4000/api/health

7.2 Frontend

Open another terminal:

cd app/frontend npm install npm run dev

Open the URL shown by Vite.

Verify:

Login

Cognito authentication

Frontend-to-backend API calls

Application data

Menu operations

Order operations

Stop the local servers after testing.

8.  Configure AWS CLI

Configure AWS on the machine used to provision the infrastructure:

aws configure

Verify:

aws sts get-caller-identity

Use an IAM identity with only the permissions required for this project.

9.  Provision AWS Infrastructure with Terraform

Terraform must be run separately from the Jenkins application deployment
pipeline.

9.1 Enter Terraform Directory

From the repository root:

cd terraform

9.2 Initialize

terraform init

9.3 Format

terraform fmt -recursive

9.4 Validate

terraform validate

Expected:

Success! The configuration is valid.

9.5 Review Plan

terraform plan

Review the resources carefully.

9.6 Provision Infrastructure

terraform apply

Confirm when prompted.

9.7 Get Outputs

terraform output

Note:

EKS cluster name AWS region

9.8 Configure kubectl

aws eks update-kubeconfig\
--region YOUR_AWS_REGION\
--name YOUR_EKS_CLUSTER_NAME

Verify:

kubectl get nodes

The EKS cluster must be ready before Jenkins performs the application
deployment.

Do not run terraform apply from the Jenkins application deployment
pipeline.

10. Build Docker Images

The application has separate Dockerfiles:

app/ ├── frontend/ │ └── Dockerfile └── backend/ └── Dockerfile

Run these commands from the repository root.

10.1 Frontend

docker build\
-t YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest\
./app/frontend

10.2 Backend

docker build\
-t YOUR_DOCKERHUB_USERNAME/cafe-backend:latest\
./app/backend

10.3 Check Images

docker images

11. Configure Docker Hub

Create two Docker Hub repositories:

YOUR_DOCKERHUB_USERNAME/cafe-frontend
YOUR_DOCKERHUB_USERNAME/cafe-backend

Create a Docker Hub Access Token.

Use the access token in Jenkins instead of the Docker Hub account
password.

12. Test Docker Containers

12.1 Backend

docker run --rm -p 4000:4000\
YOUR_DOCKERHUB_USERNAME/cafe-backend:latest

Test:

http://localhost:4000/api/health

12.2 Frontend

docker run --rm -p 8080:80\
YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest

Open:

http://localhost:8080

13. Configure Kubernetes

Kubernetes files are stored in:

deployment/kubernetes/

Required files:

frontend-deployment.yaml frontend-service.yaml backend-deployment.yaml
backend-service.yaml configmap.yaml secret.yaml ingress.yaml

13.1 Update Frontend Image

In the frontend Deployment, use:

image: YOUR_DOCKERHUB_USERNAME/cafe-frontend:latest

13.2 Update Backend Image

In the backend Deployment, use:

image: YOUR_DOCKERHUB_USERNAME/cafe-backend:latest

The backend listens on:

4000

13.3 Configure Services

Frontend service:

frontend-service

Backend service:

backend-service

13.4 Configure Health Checks

Use the backend health endpoint:

/api/health

Configure:

Liveness Probe Readiness Probe

13.5 Configure Environment Values

Use:

ConfigMap

for normal application configuration.

Use:

Secret

for sensitive application values.

Do not commit real secret values.

14. Test Kubernetes Deployment Manually

Before Jenkins performs the deployment, test the Kubernetes
configuration once.

Check EKS:

kubectl get nodes

Apply the Kubernetes manifests:

kubectl apply -f deployment/kubernetes/

Check resources:

kubectl get deployments kubectl get pods kubectl get services kubectl
get ingress

Check backend Pods:

kubectl get pods -l app=backend

Check frontend Pods:

kubectl get pods -l app=frontend

View logs:

kubectl logs POD_NAME

Verify the backend health endpoint.

Once the manual Kubernetes deployment works, Jenkins can automate the
same deployment.

15. Configure Ingress

Make sure the required Ingress Controller is installed in the EKS
cluster.

Check:

kubectl get ingress

Get the load balancer / Ingress address:

kubectl get ingress

Use the resulting address to access the application.

16. Jenkins Setup

Start Jenkins:

sudo systemctl start jenkins

Check:

sudo systemctl status jenkins

Open Jenkins in the browser.

Create a Pipeline job:

New Item → Pipeline

17. Install Jenkins Plugins

Go to:

Manage Jenkins → Plugins

Install the plugins required by the Jenkins setup.

Common plugins used by this project:

Pipeline Git GitHub integration / GitHub Branch Source Credentials
Binding Docker Pipeline AWS Credentials SonarQube Scanner

Use plugin versions compatible with the installed Jenkins version.

18. Configure Jenkins Credentials

Go to:

Manage Jenkins → Credentials → System → Global credentials

18.1 Docker Hub

Create:

Kind: Username with password Username: YOUR_DOCKERHUB_USERNAME Password:
YOUR_DOCKERHUB_ACCESS_TOKEN ID: dockerhub-credentials

The Jenkinsfile uses:

dockerhub-credentials

18.2 AWS

Create:

Kind: AWS Credentials ID: aws-jenkins-credentials Access Key ID:
YOUR_AWS_ACCESS_KEY Secret Access Key: YOUR_AWS_SECRET_KEY

These credentials allow Jenkins to run AWS CLI commands and connect to
the existing EKS cluster.

18.3 SonarQube

Create/configure the SonarQube token in Jenkins Credentials.

Do not place the token directly inside the Jenkinsfile.

19. Configure SonarQube

Create a SonarQube project.

Example:

Project Key: cafe-webapp

The repository contains:

sonar-project.properties

Example configuration:

sonar.projectKey=cafe-webapp sonar.projectName=Cafe Web App
sonar.projectVersion=1.0

sonar.sources=app/frontend,app/backend sonar.sourceEncoding=UTF-8

sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**

19.1 Configure SonarQube in Jenkins

Go to:

Manage Jenkins → System → SonarQube servers

Set:

Name: SonarQube

The Jenkinsfile references:

withSonarQubeEnv('SonarQube')

19.2 Configure SonarQube Webhook

Configure the SonarQube webhook to:

https://YOUR_JENKINS_URL/sonarqube-webhook/

The webhook allows Jenkins to receive the Quality Gate result.

20. Configure Jenkins Pipeline from SCM

In Jenkins:

New Item → Pipeline

Set:

Definition: Pipeline script from SCM SCM: Git Repository URL:
YOUR_GITHUB_REPOSITORY_URL Branch: \*/main Script Path: Jenkinsfile

21. Configure GitHub Webhook

The pipeline should start automatically after a Git push.

In GitHub:

Repository → Settings → Webhooks → Add webhook

Set:

Payload URL: https://YOUR_JENKINS_URL/github-webhook/

Content type:

application/json

Select:

Just the push event

Save the webhook.

The Jenkinsfile contains:

triggers { githubPush() }

Test the trigger:

git add . git commit -m "Update application" git push origin main

22. Jenkins CI/CD Pipeline

The application deployment pipeline runs in this order:

Checkout ↓ Frontend Build ↓ Backend Install ↓ SonarQube Analysis ↓
Quality Gate ↓ Docker Build ↓ Push to Docker Hub ↓ Deploy to EKS ↓
Rollout Verification

22.1 Checkout

Jenkins checks out the latest code from GitHub.

22.2 Frontend Build

cd app/frontend npm ci npm run build

22.3 Backend Install

cd app/backend npm ci

22.4 SonarQube Analysis

Jenkins runs the scanner using:

sonar-project.properties

22.5 Quality Gate

Jenkins waits for the SonarQube result.

PASS → continue FAIL → stop

The Jenkinsfile uses:

waitForQualityGate abortPipeline: true

If the Quality Gate fails, Jenkins stops before Docker push and EKS
deployment.

22.6 Docker Build

Jenkins builds:

YOUR_DOCKERHUB_USERNAME/cafe-frontend:BUILD_NUMBER
YOUR_DOCKERHUB_USERNAME/cafe-backend:BUILD_NUMBER

22.7 Push to Docker Hub

Jenkins uses:

dockerhub-credentials

to log in and push both images.

22.8 Deploy to EKS

Jenkins uses:

aws-jenkins-credentials

Configure access:

aws eks update-kubeconfig\
--region YOUR_AWS_REGION\
--name YOUR_EKS_CLUSTER_NAME

Update the frontend Deployment:

kubectl set image deployment/frontend\
frontend=YOUR_DOCKERHUB_USERNAME/cafe-frontend:\$BUILD_NUMBER

Update the backend Deployment:

kubectl set image deployment/backend\
backend=YOUR_DOCKERHUB_USERNAME/cafe-backend:\$BUILD_NUMBER

22.9 Rollout Verification

kubectl rollout status deployment/frontend kubectl rollout status
deployment/backend

23. Configure Datadog

The project uses the Datadog Helm chart.

23.1 Add Helm Repository

helm repo add datadog https://helm.datadoghq.com helm repo update

23.2 Create Namespace

kubectl create namespace datadog

23.3 Create Datadog Secret

Set the API key only in the shell:

export DD_API_KEY="YOUR_DATADOG_API_KEY"

Create the Kubernetes Secret:

kubectl create secret generic datadog-secret\
--namespace datadog\
--from-literal=api-key="\$DD_API_KEY"

Do not commit the API key to GitHub.

23.4 Configure Datadog Values

Create:

deployment/monitoring/datadog/values.yaml

Use:

datadog: apiKeyExistingSecret: datadog-secret clusterName:
YOUR_EKS_CLUSTER_NAME site: datadoghq.com

logs: enabled: true containerCollectAll: true

processAgent: enabled: true

The API key must not be stored in values.yaml.

23.5 Install Datadog Agent

helm install datadog-agent\
-f deployment/monitoring/datadog/values.yaml\
datadog/datadog\
--namespace datadog

23.6 Verify Datadog

kubectl get pods -n datadog kubectl get daemonset -n datadog helm list
-n datadog

23.7 Verify Kubernetes Monitoring

In Datadog:

Infrastructure → Kubernetes

Verify:

EKS nodes Pods Containers CPU usage Memory usage Network usage Pod
restarts Node health

23.8 Verify Logs

With container log collection enabled, open:

Logs → Explorer

Use application/service filters as required.

23.9 Create Dashboard

Recommended dashboard metrics:

EKS CPU EKS memory Pod CPU Pod memory Pod restarts Network traffic
Application logs

23.10 Create Alerts

Recommended monitors:

High CPU High memory High disk usage Pod unavailable Pod restart /
crash-loop Node unavailable High application error rate

24. First End-to-End Deployment

After infrastructure and service configuration is complete, test the
complete CI/CD flow.

Step 1: Make a Code Change

Make a small application change.

Step 2: Commit

git add . git commit -m "Update application"

Step 3: Push

git push origin main

Step 4: Verify GitHub Webhook

GitHub sends the push event to Jenkins.

Step 5: Verify Jenkins Checkout

Jenkins checks out the latest commit.

Step 6: Verify Build

Jenkins installs dependencies and builds the frontend.

Step 7: Verify SonarQube

Jenkins sends the source code for analysis.

Step 8: Verify Quality Gate

PASS → continue FAIL → pipeline stops

Step 9: Verify Docker Build

Jenkins builds the frontend and backend images.

Step 10: Verify Docker Hub

Jenkins pushes the images using the Docker Hub credential.

Step 11: Verify EKS Connection

Jenkins connects to the already-created EKS cluster.

Step 12: Verify Kubernetes Deployment

Jenkins updates the frontend and backend Deployments.

Step 13: Verify Rollout

kubectl rollout status deployment/frontend kubectl rollout status
deployment/backend

Step 14: Verify Application

kubectl get pods kubectl get deployments kubectl get services kubectl
get ingress

Open the frontend using the Ingress/load-balancer address.

Test:

Login Cognito authentication Frontend-to-backend API calls DynamoDB
operations Application functionality

Step 15: Verify Datadog

Check:

EKS cluster Nodes Pods Metrics Logs Alerts

25. Rollback

Check deployment history:

kubectl rollout history deployment/frontend kubectl rollout history
deployment/backend

Rollback frontend:

kubectl rollout undo deployment/frontend

Rollback backend:

kubectl rollout undo deployment/backend

Verify:

kubectl rollout status deployment/frontend kubectl rollout status
deployment/backend

26. Security Checklist

Never commit:

Real .env files AWS access keys AWS secret keys Docker Hub passwords
Docker Hub access tokens SonarQube tokens Datadog API keys SSH private
keys Terraform state files

Use:

.env.example Jenkins Credentials Kubernetes Secrets IAM roles / workload
identity Restricted Security Groups Least-privilege IAM permissions
