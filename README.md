# Prisma Studio Running on Cloud Run with Cloud SQL Private IP

This repository contains configurations to deploy Prisma Studio on Google Cloud Run, connecting to a Cloud SQL PostgreSQL instance using private IP. It leverages Cloud Build and Docker for containerization and deployment.

**Note:** This setup is solely for running Prisma Studio and does not include a separate application.

## Prerequisites

Before deploying, ensure you have the following:

1.  **Google Cloud Project:** A Google Cloud project with billing enabled.
2.  **Cloud SQL PostgreSQL Instance:** A Cloud SQL PostgreSQL instance configured with private IP.
3.  **VPC Network:** A VPC network with private services access configured for Cloud SQL.
4.  **Cloud Build API Enabled:** Enable the Cloud Build API for your project.
5.  **Docker Installed:** Docker installed locally (if building images locally).
6.  **gcloud CLI Installed:** Google Cloud SDK (gcloud CLI) installed and configured.
7.  **Prisma CLI Installed:** Install Prisma CLI globally using `npm install -g prisma`.

## Setup

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/Rohit1024/prisma-studio.git
    cd prisma-studio
    ```
    
2.  **Configure Prisma Schema:**

    * Run `prisma init` to create a `prisma` directory with `schema.prisma`.
    * Modify `schema.prisma` to define your database models.

    Example `schema.prisma`:

    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    generator client {
      provider = "prisma-client-js"
    }

    model User {
      id    Int     @id @default(autoincrement())
      email String  @unique
      name  String?
    }
    ```
4. **Creating a Cloud Build private pool and Cloud SQL postgres Instance with private Ip enabled: **
   Follow [Creating a new private pool](https://cloud.google.com/build/docs/private-pools/create-manage-private-pools#creating_a_new_private_pool) and [Create a PostgreSQL instance](https://cloud.google.com/sql/docs/postgres/create-instance#create-2nd-gen)

5.  **Build and Deploy with Cloud Build:**

    Use the provided `cloudbuild.yaml` to build and deploy the Prisma Studio container to Cloud Run. Make sure you use your configured values to fill the Substituting variable values

    ```bash
    gcloud builds submit --config cloudbuild.yaml --substitutions _REGION=us-central1,_WORKER_POOL=just-pool,_DB_PROVIDER=postgresql,_DB_USER=postgres,_DB_NAME=prisma-studio,_DB_PORT=5432,_CLOUD_SQL_PRIVATE_IP=10.24.34.3,_NETWORK=default,_SUBNET=default,_VPC_EGRESS=private-ranges-only
    ```

    This command will:

    * Build the Docker image using the `Dockerfile`.
    * Push the image to Google Container Registry (GCR).
    * Deploy the container to Cloud Run, configuring it to connect to your Cloud SQL instance using the provided connection name.

## Cloud Run Configuration

The Cloud Run service is configured to:

* Use the container image built by Cloud Build.
* Connect to the Cloud SQL instance using the `DATABASE_URL` environment variable which will be generated from build step itself
* Listen on port 8080 (custom Prisma Studio port set in startup script to meet Cloud Run).
* Allow unauthenticated invocations (for simplicity; adjust security as needed).
* Use the correct VPC connector or Direct VPC Egress for the private IP connection to Cloud SQL.

## Caching Strategy

Cloud Build implicitly caches Docker layers, which significantly speeds up subsequent builds. Additionally, the `prisma generate` step is cached within the Docker image build process.

* **Docker Layer Caching:** Cloud Build caches Docker layers, so unchanged layers are reused, reducing build times.
* **Prisma Client Caching:** The generated Prisma Client is included in the Docker image. If the Prisma schema doesn't change, the client generation step is skipped in subsequent builds.
* **Database connection:** The database connection is made through private IP, reducing latency and improving security.

## Accessing Prisma Studio

After deployment, you can access Prisma Studio by visiting the Cloud Run service URL in your browser.

## Security Considerations

* **Authentication:** For production environments, consider adding authentication to your Cloud Run service.
* **Network Security:** Ensure your request to Cloud SQL DB is stays within VPC network and secured.
* **Database Credentials:** Usinf Google Cloud Secret Manager to store DB password


## Cleanup

To delete the Cloud Run service and the container image:

```bash
gcloud run services delete <service_name>
gcloud container images delete <gcr_image_url>
