# YeumEasy - Equipment Borrowing Management System

Full-stack Node.js project with separated backend API and frontend UI.

## Application Overview

`YeumEasy` is an equipment borrow-return management system for classrooms or faculties.
The system records borrower data, equipment records, and borrow-return status to support convenient and structured historical tracking.

## Core Database Tables (4)

1. `User`
- `id` (PK)
- `full_name`
- `student_id`
- `phone`

2. `Equipment`
- `id` (PK)
- `equipment_name`
- `category`
- `quantity`
- `status`

3. `Borrow`
- `id` (PK)
- `user_id` (FK)
- `borrow_date`
- `due_date`
- `borrow_status`

4. `BorrowDetail`
- `id` (PK)
- `borrow_id` (FK)
- `equipment_id` (FK)
- `amount`
- `returned_amount`

## Relationships

- `User` 1:N `Borrow` (one user can create many borrow transactions)
- `Borrow` 1:N `BorrowDetail` (one borrow transaction can contain many equipment lines)
- `Equipment` 1:N `BorrowDetail` (one equipment item can appear in many borrow transactions)

`BorrowDetail` is the junction table between `Borrow` and `Equipment`, implementing a many-to-many relationship.

## Planned Reports

1. `Borrow by Period`
- Shows borrow transaction counts grouped by day or month.
- Backend endpoint: `GET /api/reports/borrow-by-date?groupBy=day|month&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

2. `Most Borrowed Equipment`
- Shows equipment list with both borrow frequency (`borrow_count`) and total borrowed quantity (`total_borrowed_amount`).
- Backend endpoint: `GET /api/reports/top-equipment?limit=5`

## Tech Stack

- Backend: Node.js, Express.js, Sequelize, SQLite, dotenv, cors
- Frontend: Node.js, Express.js, EJS, pure CSS, fetch API

## Project Structure

```text
yeumeasy/
  backend/
    app.js
    package.json
    .env
    config/
      database.js
    database/
      seed.js
      yeumeasy.sqlite (generated)
    models/
      index.js
      User.js
      Equipment.js
      Borrow.js
      BorrowDetail.js
    controllers/
      userController.js
      equipmentController.js
      borrowController.js
      borrowDetailController.js
      reportController.js
      helpers/
        borrowStatus.js
    routes/
      userRoutes.js
      equipmentRoutes.js
      borrowRoutes.js
      borrowDetailRoutes.js
      reportRoutes.js
    middleware/

  frontend/
    app.js
    package.json
    .env
    routes/
      web.js
    views/
      layouts/
        main.ejs
      partials/
        header.ejs
        footer.ejs
        navbar.ejs
      users/
      equipment/
      borrows/
      borrow-details/
      reports/
        dashboard.ejs
    public/
      css/
        style.css
```

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend URL: `http://localhost:5000`

### Seed Data

```bash
npm run seed
```

Creates:
- 10 users
- 10 equipment records
- 20 borrow transactions + borrow details

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`

## API Endpoints

- `GET/POST /api/users`
- `GET/PUT/DELETE /api/users/:id`
- `GET/POST /api/equipment`
- `GET/PUT/DELETE /api/equipment/:id`
- `GET/POST /api/borrows`
- `GET/PUT/DELETE /api/borrows/:id`
- `GET/POST /api/borrow-details`
- `GET/PUT/DELETE /api/borrow-details/:id`
- `GET /api/reports/borrow-by-date`
- `GET /api/reports/top-equipment`
- `GET /api/reports/dashboard`

## Business Logic

When creating/updating/deleting `BorrowDetail`, backend recalculates related `Borrow.borrow_status`:
- all `returned_amount >= amount` -> `returned`
- otherwise -> `borrowed`

## Notes

- Backend returns JSON for all API routes.
- Frontend does not connect to database directly.
- Equipment index supports search + pagination with query params:
  - `/equipment?search=laptop&page=1`

รันจากโฟลเดอร์หลักของโปรเจกต์ (root)
npm install --prefix backend && npm install --prefix frontend 

Test 1