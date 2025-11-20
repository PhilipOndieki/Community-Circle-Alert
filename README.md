# Community Circle Alert

A MERN stack safety application that enables users to create safety circles, share location, perform check-ins, and send panic alerts to their community members in real-time.

## Features

### Core MVP Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Safety Circles**: Create and manage circles with family, friends, or community members
- **Check-Ins**: Schedule and manage safety check-ins with expected return times
- **Panic Button**: Immediately alert all circle members in case of emergency
- **Real-time Notifications**: Socket.io powered instant alerts and updates
- **Location Sharing**: Share your location with circle members (with privacy controls)
- **Emergency Contacts**: Manage emergency contact information

## Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Helmet** & **CORS** - Security

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client
- **CSS Modules** - Styling

## Project Structure

```
Community-Circle-Alert/
├── server/                # Backend application
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions (Socket.io)
│   ├── app.js            # Express app configuration
│   ├── server.js         # Server entry point
│   └── package.json
│
├── client/               # Frontend application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   ├── common/   # Common UI components
│   │   │   └── layout/   # Layout components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── styles/       # Global styles
│   │   ├── App.jsx       # Main App component
│   │   └── index.js      # Entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in server directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/community-circle
JWT_SECRET=your_super_secret_key_here_minimum_32_characters_long
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_here_minimum_32_characters_long
JWT_REFRESH_EXPIRE=7d
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

4. Start MongoDB (if not running):
```bash
mongod
```

5. Start the server:
```bash
npm run dev
```

Server will run on http://localhost:5000

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in client directory:
```env
VITE_APP_API_URL=http://localhost:5000/api
VITE_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

Client will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `PUT /api/auth/updatepassword` - Update password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/privacy` - Update privacy settings
- `PUT /api/users/location` - Update location
- `PUT /api/users/location/sharing` - Toggle location sharing
- `POST /api/users/emergency-contacts` - Add emergency contact

### Circles
- `GET /api/circles` - Get all user's circles
- `POST /api/circles` - Create new circle
- `GET /api/circles/:id` - Get circle by ID
- `PUT /api/circles/:id` - Update circle
- `DELETE /api/circles/:id` - Delete circle
- `POST /api/circles/:id/invite` - Invite member
- `POST /api/circles/join/:inviteCode` - Join by invite code
- `POST /api/circles/:id/leave` - Leave circle

### Check-Ins
- `GET /api/checkins` - Get user's check-ins
- `GET /api/checkins/active` - Get active check-ins
- `POST /api/checkins` - Create check-in
- `PUT /api/checkins/:id/complete` - Complete check-in
- `PUT /api/checkins/:id/cancel` - Cancel check-in
- `PUT /api/checkins/:id/location` - Update location

### Alerts
- `GET /api/alerts` - Get user's alerts
- `POST /api/alerts` - Create panic alert
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `PUT /api/alerts/:id/cancel` - Cancel alert

## Socket.io Events

### Client Emits
- `join:circle` - Join circle room
- `alert:trigger` - Trigger panic alert
- `alert:acknowledge` - Acknowledge alert
- `checkin:create` - Create check-in
- `location:update` - Update location

### Server Emits
- `alert:new` - New alert created
- `alert:acknowledged` - Alert acknowledged
- `alert:resolved` - Alert resolved
- `checkin:new` - New check-in created
- `checkin:completed` - Check-in completed
- `location:updated` - Location updated

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcryptjs
- Account lockout after failed login attempts
- Request rate limiting
- MongoDB injection prevention
- CORS configuration
- Helmet security headers
- Input validation and sanitization

## Development

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Build for Production

Backend:
```bash
cd server
npm start
```

Frontend:
```bash
cd client
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or open an issue in the repository.
