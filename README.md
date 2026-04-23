# Smart Campus Operations Hub

This repository contains the solution for the IT3030 - Programming Applications and Frameworks Assignment (Semester 1).
It is a complete web platform developed to manage facility and asset bookings, maintenance/incident handling, and notifications.

## Architecture

- **Backend:** Java Spring Boot REST API with Layered Architecture (Controllers, Services, Repositories).
- **Database:** MySQL.
- **Frontend:** React with Vite and TailwindCSS.
- **Security:** Spring Security with JWT and OAuth2 integration (Google Login).
- **Workflow Automation:** GitHub Actions CI/CD for build validation.

## Modules Implemented

- **Module A – Facilities & Assets Catalogue:** Bookable resources with search/filters.
- **Module B – Booking Management:** Workflow (PENDING → APPROVED/REJECTED/CANCELLED) with overlap/conflict checks.
- **Module C – Maintenance & Incident Ticketing:** Ticket lifecycle with multi-file attachment and comments.
- **Module D – Notifications:** System notifications for approvals and status changes.
- **Module E – Authentication & Authorization:** OAuth2 login with session-less JWT, role-based access.

## Setup Instructions

### Prerequisites
- JDK 21
- Node.js 18+
- MySQL Server

### 1. Database Setup
Create the MySQL database (or let Spring Boot create it based on the url in `application.properties`):
```sql
CREATE DATABASE smartCampusDB;
```

### 2. Backend (Spring Boot)
Update the `application.properties` file located at `smart_campus/src/main/resources/application.properties` to set your actual Google OAuth2 Client ID/Secret and adjust MySQL credentials if not `root`/`5631#$%Ap`.

```bash
cd smart_campus
mvn clean install
mvn spring-boot:run
```
The REST API will run on `http://localhost:8080`.

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
The React SPA will launch on `http://localhost:5173`.

### Roles Available
* `USER` - Default after OAuth2 login.
* `ADMIN` - Requires manual database role bump for now.
* `TECHNICIAN` - Assigned to handle incident tickets.
