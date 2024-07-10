# datatalk-hackathon

You can find the live demo at [https://datatalk-443fb.web.app](https://datatalk-443fb.web.app).

## Backend

### Steps to run the backend

Change directory to the `functions` folder:

1. Clone the project
2. Change directory to the `functions` folder:
    ```bash
    cd functions
    ```
3. Run 
   ```bash
   npm install
   ```
4. Create a service account to run locally.

   To run, create a service account for the *App Engine default service account* and download the JSON file. Then, set
   the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON file.

   Example: `export GOOGLE_APPLICATION_CREDENTIALS=/Users/developer/datatalk-hackathon/sample-service-account.json`

5. Go to .firebaserc and change the default project to your project id
6. Go to functions/ and copy .env.template to .env and set up the GEMINI API KEY

### Steps to configure the Google Cloud Project

1. You need a firebase project
2. Enable and configure firebase auth
3. Enable and configure firestore
4. Enable and configure IAM Service Account Credentials
   API, https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=PROJECT_ID
5. Enable Vertex AI Studio and Vertex AI
   API, https://console.cloud.google.com/vertex-ai/generative?referrer=search&project=PROJECT_ID
   and https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=PROJECT_ID
6. Add Vertex AI permissions to default service
   account, https://console.cloud.google.com/iam-admin/iam?project=PROJECT_ID

### Running the backend

Run the backend locally with
```bash
npm run serve
```

### Deploying the backend

Deploy the backend with 
```bash
npm run deploy
```

## Frontend

This is the frontend for the DataTalk project. It is a React application that
uses some of the components from the [FireCMS](https://firecms.co) project.

This project is configured with the project `datatalk-443fb` but can be used with any Firebase project.
If you want to use a different project, make sure to change the Firebase config in `src/firebase_config.ts`.

It is also connecting by default to the backend of this demo project, which is hosted
at `https://datatalk-443fb.web.app`.

### Running the project

Change directory to the `app` folder:

```bash
cd app
```

Install the dependencies:

```bash
npm i
```

And run the project locally:

```bash
npm run dev
```

### Building the project

Make sure you update your `package.json` `build` script with the correct
project name. Then run:

```bash
npm run build
```

