# DATAKI

Dataki is an app that allows you to generate analytics reports for your data. It is a tool that allows you to connect
to your data sources, and generate reports with the help of AI.

You can find the live demo at [https://app.dataki.ai](https://app.dataki.ai).


## Running it locally

To run the project locally you need to run at least the frontend (and connect to the deployed backend).

Or you can also run the frontend and the backend locally.

We want to make it as easy as possible for you to run the project, so we have included the instructions to run
both the frontend and the backend in this README.

This repository should have all the config files correctly set up, so you should be able to run the project
without any additional configuration. However we include the steps to configure the project with a different Google Cloud
project, in case you want to use your own project.


### Frontend

This is the frontend for the Dataki project. It is a React application that
uses some of the components from the [FireCMS](https://firecms.co) project.

IMPORTANT: By default the project will use the Firebase project `datatalk-443fb`, and connect to it's deployed
Cloud functions and Firestore. If you run the project locally, or use a different project you can change the API endpoint in the `.env` file.
If you want to use a different project, make sure to change the Firebase config in `src/firebase_config.ts`.

It is connecting by default to the backend of this demo project, which is hosted
at `https://datakiapi-4mgflsd2ha-ey.a.run.app`.

### Running the project

Change directory to the `app` folder:

```bash
cd app
```

Install the dependencies (you need to force the install because of the 19-rc `react` version):

```bash
npm i --force
```

And run the project locally:

```bash
npm run dev
```
(alternatively you can use `yarn` and `yarn dev`)

### Building the project

Make sure you update your `package.json` `build` script with the correct
project name. Then run:

```bash
npm run build
```

### Changing the API endpoint
You can change the API endpoint in the `.env` file. By default it is set to the deployed backend of this project.


### Backend

#### Steps to run the backend

Note: these are instructions to setup a completely new project. 
You can use our demo project too, for which you will need a SA key. Feel free to reach us at francesco@firecms.co if you 
need it!

You need a Google Cloud project with the following services enabled:
- Firebase
- Firestore
- Cloud Functions
- Vertex AI
- Oauth2 API

1. Change directory to the `functions` folder:
    ```bash
    cd functions
    ```
2. Run
   ```bash
   npm install
   ```
3. Create a service account to run locally.

   To run, create a service account for the *App Engine default service account* and download the JSON file. Then, set
   the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the path of the JSON file.

   Example: `export GOOGLE_APPLICATION_CREDENTIALS=/Users/developer/dataki-hackathon/sample-service-account.json`

4. Go to .firebaserc and change the default project to your project id
5. Go to functions/ and copy .env.template to .env and set up the GEMINI API KEY

#### Steps to configure the Google Cloud Project

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

#### Running the backend

Run the backend locally with
```bash
npm run serve
```

#### Deploying the backend

Deploy the backend with
```bash
npm run deploy
```
