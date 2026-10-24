# StockGuard Frontend



StockGuard is an inventory management dashboard built with React and Vite. It provides a user interface for managing products, tracking stock, placing orders, and cancelling orders through the StockGuard backend API.



\## Features



\- Admin login using JWT authentication.

\- Inventory dashboard with product details and stock levels.

\- Product management.

\- Order placement and cancellation.

\- Order totals and order status display.

\- Integration with the Spring Boot backend REST API.



\## Tech Stack



\- React

\- Vite

\- JavaScript

\- CSS

\- Fetch API for backend communication



\## Run Locally



\### Prerequisites



\- Node.js and npm

\- StockGuard backend running locally



\### 1. Clone the repository



```bash

git clone YOUR\_FRONTEND\_REPOSITORY\_URL

cd stockguard-frontend

```



Replace the repository URL with your actual GitHub URL after publishing.



\### 2. Install dependencies



```bash

npm install

```



\### 3. Configure the backend URL



The frontend currently communicates with the backend at `http://localhost:8080`. If the application uses a configurable API URL, set the appropriate Vite environment variable in a local `.env` file.



For example:



```env

VITE\_API\_URL=http://localhost:8080

```



Use the variable name expected by the frontend code. Never place database passwords or JWT signing secrets in frontend environment variables.



\### 4. Start the development server



```bash

npm run dev

```



Open the local URL printed by Vite, usually `http://localhost:5173`.



\## Backend



The frontend requires the StockGuard Spring Boot backend and PostgreSQL database to be configured and running.



See the backend repository README for setup and API details.



\## Future Improvements



\- Responsive design improvements.

\- Better loading and error states.

\- Automated frontend tests.




