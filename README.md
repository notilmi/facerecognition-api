# Serverless Face Recognition API

This is an AWS Lambda based API that could register and recognize faces using Serverless Framework
This Services Requires AWS Lambda, DynamoDB, API Gateway, S3, & Rekognition to support the services

### Usage

1. Make Sure You Configured Your Environment In Serverless.yml first
2. After You Configured It Run
```
$ serverless deploy
```
3.

### Deployment

```
$ serverless deploy
```

After deploying, you should see output similar to:

```bash
✔ Service deployed to stack facerecognition-dev

endpoints:
  POST - https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/face/register
  POST - https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/face/recognize
functions:
  register-face: facerecognition-dev-register-face (20 MB)
  recognize-face: facerecognition-dev-recognize-face (20 MB)
  index-face: facerecognition-dev-index-face (20 MB)
```

### Invocation

After successful deployment, you can call the created application via HTTP:

```bash
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

### Registering Face

Input this request json to the https://xxxxxxx.execute-api.us-east-1.amazonaws.com/face/register

```json
{
  "person_name": "Person Name",
  "body": "base64 Format Image"
}
```

### Recognizing Face

Input this request json to the https://xxxxxxx.execute-api.us-east-1.amazonaws.com/face/recognize

```json
{
  "body": "base64 Format Image"
}
```

### More

Made With Love By Ilmi ❤️