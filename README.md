# SecondSons - Multi-Service Platform

SecondSons is a comprehensive multi-service platform designed to connect customers with a wide range of services and products. From booking professionals and cabs to ordering food, medicines, and groceries, SecondSons provides a unified experience for all your daily needs.

## Features

### 👥 User Roles
The platform supports multiple user roles, each with a dedicated dashboard:
- **Customer**: Browse and book services, order products, consult doctors, and manage subscriptions.
- **Professional (Worker)**: Accept service requests (plumbing, cleaning, etc.) and manage jobs.
- **Shop Owner**: Manage inventory and fulfill quick commerce orders.
- **Restaurant Owner**: Manage menu items and fulfill food delivery orders.
- **Pharmacy Owner**: Manage medicine inventory, verify prescriptions, and fulfill orders.
- **Doctor**: Provide consultations, review prescriptions, and chat with patients.
- **Delivery Partner**: Deliver orders from shops, restaurants, and pharmacies.
- **Driver**: Accept cab rides and transport passengers.
- **Support Agent**: Handle customer queries and resolve issues via chat.

### 🛠️ Services & Bookings
- **Professional Services**: Book skilled workers like plumbers, electricians, cleaners, and more.
- **Cab Booking**: Request rides with real-time driver matching and OTP verification.
- **Labour Market**: Find and hire daily wage laborers.

### 🛒 E-Commerce & Delivery
- **Quick Commerce**: Order groceries and essentials from local shops.
- **Food Delivery**: Order food from restaurants with special requests and veg/non-veg filters.
- **Medicine Delivery**: Order medicines from pharmacies. Supports prescription uploads and doctor verification.
- **Product Details**: Comprehensive product pages with images, descriptions, ratings, and reviews.
- **Subscriptions**: Subscribe to products for recurring delivery (daily, weekly, monthly) with automatic discounts.

### ⚕️ Medical Services
- **Doctor Consultations**: Book appointments and chat with doctors.
- **Prescription Management**: Upload prescriptions for medicine orders or get them reviewed by doctors.

### 💬 Support & Communication
- **Live Chat**: Real-time chat between customers and support agents.
- **In-Order Chat**: Chat with delivery partners or professionals during active orders.

## 💻 Tech Stack

- **Frontend**: React.js
- **Backend / Database**: Firebase (Firestore, Authentication)
- **Storage**: Cloudinary (for images and prescriptions)
- **Styling**: CSS Modules / Inline Styles
- **Routing**: React Router DOM

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Yarn or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/secondsons.git
   cd secondsons
   ```

2. Install dependencies:
   ```bash
   yarn install
   # or
   npm install
   ```

3. Configure Environment Variables:
   - Ensure you have a valid Firebase configuration in `src/firebase.js`.
   - Ensure Cloudinary configuration is set up in `src/utils/cloudinaryUtils.js`.

### Running the App

Runs the app in the development mode.
```bash
yarn start
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

Builds the app for production to the `build` folder.
```bash
yarn build
```

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Page components for different roles
│   ├── auth/         # Login and Signup pages
│   ├── commerce/     # Shop and Product pages
│   ├── food/         # Restaurant pages
│   ├── pharmacy/     # Pharmacy pages
│   ├── medical/      # Doctor and Medical pages
│   ├── orders/       # Order management pages
│   ├── support/      # Customer support pages
│   └── ...
├── utils/            # Utility functions (Cloudinary, etc.)
├── App.js            # Main application component and routing
├── AuthContext.js    # Authentication context provider
└── firebase.js       # Firebase configuration
```

