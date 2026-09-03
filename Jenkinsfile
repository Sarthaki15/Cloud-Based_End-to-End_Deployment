pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        // AWS / EKS
        AWS_REGION = 'YOUR_EKS_REGION'
        EKS_CLUSTER = 'YOUR_EKS_CLUSTER_NAME'

        // Docker Hub
        DOCKERHUB_FRONTEND = 'YOUR_DOCKERHUB_USERNAME/cafe-frontend'
        DOCKERHUB_BACKEND  = 'YOUR_DOCKERHUB_USERNAME/cafe-backend'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Build') {
            steps {
                dir('app/frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Install') {
            steps {
                dir('app/backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                        -t $DOCKERHUB_FRONTEND:$BUILD_NUMBER \
                        ./app/frontend

                    docker build \
                        -t $DOCKERHUB_BACKEND:$BUILD_NUMBER \
                        ./app/backend
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin

                        docker push $DOCKERHUB_FRONTEND:$BUILD_NUMBER
                        docker push $DOCKERHUB_BACKEND:$BUILD_NUMBER
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-jenkins-credentials']
                ]) {
                    sh '''
                        aws eks update-kubeconfig \
                            --region $AWS_REGION \
                            --name $EKS_CLUSTER

                        kubectl set image deployment/frontend \
                            frontend=$DOCKERHUB_FRONTEND:$BUILD_NUMBER

                        kubectl set image deployment/backend \
                            backend=$DOCKERHUB_BACKEND:$BUILD_NUMBER

                        kubectl rollout status deployment/frontend
                        kubectl rollout status deployment/backend
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'CI/CD pipeline failed.'
        }
    }
}