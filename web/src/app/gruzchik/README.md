# Грузчик Panel

This is a mobile-first panel for грузчик (Loader/Porter) role users.

## Features

- **Mobile-First Design**: Optimized for mobile phones with responsive layouts
- **Role-Based Access**: Only users with GRUZCHIK role can access this panel
- **Two Main Pages**:
  - **Закупка (Purchase)**: Orders assigned for purchasing goods
  - **Наличие (Availability)**: Orders for managing product availability

## Pages

### 1. Закупка (`/gruzchik/purchase`)

- Shows orders assigned to the грузчик for purchasing
- Mobile-optimized table with order details
- Actions: "Закупить" (Purchase) and "Подробнее" (Details)

### 2. Наличие (`/gruzchik/availability`)

- Shows orders for managing product availability
- Mobile-optimized table with order details
- Actions: "Обновить наличие" (Update Availability) and "Подробнее" (Details)

## Mobile Optimizations

- Responsive table design with smaller text on mobile
- Touch-friendly buttons and interactions
- Optimized image sizes (6x6 on mobile, 8x8 on larger screens)
- Compact layout for small screens
- Mobile-first sidebar navigation

## Authentication

Users must have `GRUZCHIK` role to access this panel. The layout automatically redirects unauthorized users.

## API Endpoints

- `GET /api/gruzchik/orders` - Fetch orders assigned to the current грузчик
  - Query params: `page`, `limit`, `status`
  - Returns: Orders with items and customer information

## Components

- `GruzchikSidebarLayout` - Main layout wrapper
- `GruzchikSidebar` - Navigation sidebar
- `GruzchikPurchaseTable` - Purchase orders table
- `GruzchikAvailabilityTable` - Availability orders table
- `MobileDataTable` - Mobile-optimized data table
- `useGruzchikOrders` - Hook for fetching грузчик orders
