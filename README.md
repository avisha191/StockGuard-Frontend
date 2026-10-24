# StockGuard — Inventory Management Dashboard

A responsive inventory management dashboard built with React and Vite for the StockGuard backend. It provides an interface for browsing products, monitoring stock levels, and managing inventory and orders.

## Features

- **Dashboard overview:** View product counts, total units, inventory value, and stock alerts.
- **Product catalogue:** Browse and search inventory by product name or ID.
- **Stock monitoring:** Identify products with low or zero stock.
- **Test ordering:** Place test orders from the public dashboard without logging in.
- **Order management:** Authenticated administrators can view order history and cancel orders.
- **Product management:** Administrators can add, edit, and delete products.
- **JWT authentication:** Stores the login token in browser local storage and sends it with protected API requests.
- **Responsive interface:** Sidebar navigation, dashboard cards, tables, and forms.
- **API integration:** Connects to the Spring Boot REST API.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | UI components and state management |
| Vite | Development server and build tooling |
| JavaScript | Frontend logic |
| CSS | Styling and responsive layout |
| Lucide React | Icons |
| Fetch API | Backend communication |
| localStorage | Stores the authentication token |

## Project Architecture

```text
React + Vite Frontend
        |
        v
    Fetch API
        |
        v
Spring Boot REST API
        |
        v
   PostgreSQL
```

The frontend communicates with the backend through REST endpoints. Inventory calculations and order processing are handled by the backend.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- The StockGuard backend running locally, or a deployed backend URL

### 1. Clone the repository

```bash
git clone https://github.com/avisha191/StockGuard-Frontend.git
cd StockGuard-Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the backend URL

Create a `.env` file in the frontend project root:

```env
VITE_API_URL=http://localhost:8080
```

The frontend appends `/api` to this URL. Do not add `/api` to the value.

For a deployed backend, use its base URL instead:

```env
VITE_API_URL=https://YOUR-BACKEND-HOST
```

Replace the example with the actual backend URL. Do not commit `.env` files containing private configuration.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown by Vite, typically:

`http://localhost:5173`

### 5. Create a production build

```bash
npm run build
```

Vite generates the production build in the `dist` directory.

To preview the build locally:

```bash
npm run preview
```

## User Access

### Public visitors

- View the dashboard and product catalogue.
- Search inventory.
- Place test orders.
- See updated stock after successful orders.

### Administrators

- Log in using the existing admin account.
- Add, update, and delete products.
- View the complete order history.
- Cancel eligible orders.

Backend authorization remains responsible for protecting administrative operations. Hiding controls in the frontend is not a substitute for server-side security.

## Deployment

The frontend can be deployed to Vercel.

1. Import the `StockGuard-Frontend` GitHub repository.
2. Select Vite as the framework preset if it is not detected automatically.
3. Set the environment variable `VITE_API_URL` to the deployed Spring Boot backend's base URL.
4. Deploy the application.
5. Ensure the backend's CORS configuration permits the deployed frontend origin.

The deployed frontend and backend must use reachable public URLs; localhost URLs work only on the machine running the application.

## Related Repository

**Backend:** [StockGuard-Backend](https://github.com/avisha191/StockGuard-Backend)

## Author

**Avisha Sahu**

GitHub: [@avisha191](https://github.com/avisha191)