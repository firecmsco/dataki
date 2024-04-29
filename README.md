# datatalk-hackathon


# Steps to run the project

1. Clone the project
2. Run `npm install`
3. Create a service account to run locally.

To run, create a service account for the *App Engine default service account* and download the JSON file. Then, set the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON file.

Example: `export GOOGLE_APPLICATION_CREDENTIALS=/Users/developer/Code/firecms/datatalk-hackathon/sample-service-account.json`

4. Go to .firebaserc and change the default project to your project id
5. Go to functions/ and copy .env.template to .env and set up the GEMINI API KEY


# Steps to configure the Google Cloud Project

1. You need a firebase project
2. Enable and configure firebase auth
3. Enable and configure firestore
4. Enable and configure IAM Service Account Credentials API, https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=PROJECT_ID
5. Enable Vertex AI Studio and Vertex AI API, https://console.cloud.google.com/vertex-ai/generative?referrer=search&project=PROJECT_ID and https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=PROJECT_ID
6. Add Vertex AI permissions to default service account, https://console.cloud.google.com/iam-admin/iam?project=PROJECT_ID