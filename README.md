<img src="frontend/public/chronologue.png" style="width: 50%" />

# Chronologue
A locally-hosted constructed language creation platform, geared towards diachronic conlanging.

# Getting Started

## Prerequisites

* Node.js
* Postgres
* Git

## Setup

Install:
1. Clone the Git repository.
2. Run `npm i` to install dependencies.
3. In both `backend` and `frontend`, copy `.env.example` to `.env.development` and fill out the variables. Also copy the files to `.env.production` if you will be running Chronologue in preview mode.

Setup Postgres:
1. Create a user and database for Chronologue.
2. Run `backend/create-schema.sql` in the new database.

# Running

* To build the `shared` folder: `npm run shared`
* To run the frontend and backend in development mode: `npm run dev`
  * Just the frontend: `npm run frontend-dev`
  * Just the backend: `npm run backend-dev`
* To build the frontend and backend: `npm run build`
  * Just the frontend: `npm run frontend-build`
  * Just the backend: `npm run backend-build`
* To preview the frontend and backend: `npm run preview`
  * Just the frontend: `npm run frontend-preview`
  * Just the backend: `npm run backend-preview`
* To run ESLint: `npm run lint`

By default, the frontend runs on port 5173 in development mode and on port 4173 in preview mode; this can be changed in `frontend/vite.config.ts`.
