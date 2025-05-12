<img src="frontend/public/chronologue.png" style="width: 50%" />

# Chronologue
A locally-hosted web app for the creation of <a href="https://en.wikipedia.org/wiki/Constructed_language">constructed languages</a>. It allows you to manage your languages' dictionaries, grammar, phonologies, orthographies, and more.

The user interface and general flow are largely based on those of <a href="https://conworkshop.com/">ConWorkShop</a>, so Chronologue should be familiar to users of that site; however, no experience with it is needed.

Chronologue is intended to make it easier and more convenient to derive large families from a proto-language, but also works well for creating individual languages.

# Getting Started

## Prerequisites

To build Chronologue, you must have the following installed:
* Node.js
* Postgres
* Git

## Setup

Install and configure the repository:
1. Clone the Git repository.
2. Run `npm i` to install dependencies.
3. In both `backend` and `frontend`, copy `.env.example` to `.env.production` and fill out the variables. Also copy the files to `.env.development` if you will be running Chronologue in development mode.

Setup Postgres:
1. Create a user and database for Chronologue.
2. Run `backend/create-schema.sql` in the new database.

# Running

* To build the `shared` folder: `npm run shared`
* To build the frontend and backend: `npm run build`
* To run Chronologue in preview mode: `npm run preview`
* To run Chronologue in development mode: `npm run dev`
* To run ESLint: `npm run lint`

By default, the frontend runs on port 5173 in development mode and on port 4173 in preview mode; this can be changed in `frontend/vite.config.ts`.
