# Civic Reporting System

A comprehensive civic issue reporting and management system that enables citizens to report local problems and allows municipal staff to efficiently track, assign, and resolve issues.

## Features

### For Citizens
- **Easy Issue Reporting**: Report issues with photos, location, and detailed descriptions
- **Real-time Tracking**: Track the status of your reported issues
- **Mobile-first Design**: Optimized for mobile devices with responsive design
- **Notifications**: Receive updates on issue status changes
- **Category-based Reporting**: Report different types of issues (potholes, streetlights, garbage, etc.)

### For Administrators
- **Comprehensive Dashboard**: Overview of all issues with key metrics
- **Issue Management**: Assign, update, and track issue status
- **Automated Routing**: Issues are automatically assigned based on category and location
- **Escalation System**: Automatic escalation for overdue issues
- **Analytics**: Detailed performance metrics and reporting
- **User Management**: Manage citizen and admin accounts
- **Work Proof**: Upload and track work completion evidence

### System Features
- **Role-based Access Control**: Different access levels for citizens, low admins, and high admins
- **Real-time Updates**: Live updates using WebSocket connections
- **File Upload**: Support for images and videos with cloud storage
- **Geolocation**: Automatic location capture for accurate issue placement
- **Status Workflow**: Comprehensive status tracking with verification system
- **Notification System**: Email and in-app notifications for all stakeholders

## Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time communication
- **Cloudinary** for file storage
- **Express Rate Limiting** for API protection

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **React Hook Form** for form handling
- **Leaflet** for maps (ready for integration)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd civicReportnig
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Configuration

#### Server Environment (.env)
Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/civic-reporting

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@civicreporting.com
```

#### Client Environment (.env)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup
1. Start MongoDB service
2. The application will automatically create the database and collections on first run

### 5. Cloudinary Setup (Optional)
1. Sign up for a free Cloudinary account
2. Get your cloud name, API key, and API secret
3. Add them to your server `.env` file

### 6. Run the Application

#### Development Mode
```bash
# From the root directory
npm run dev
```

This will start both the server (port 5000) and client (port 3000) concurrently.

#### Production Mode
```bash
# Build the client
npm run build

# Start the server
npm start
```

### 7. Access the Application
- **Client**: http://localhost:3000
- **Server API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Usage

### 1. User Registration
- Citizens can register with basic information
- Admin accounts need to be created by high administrators

### 2. Reporting Issues
- Login as a citizen
- Click "Report Issue" from the dashboard
- Fill in issue details, select category, and capture location
- Upload photos if available
- Submit the report

### 3. Admin Management
- Login as an admin
- View the admin dashboard for overview
- Assign issues to appropriate staff
- Update issue status and add work proof
- Monitor performance through analytics

### 4. Issue Workflow
1. **Pending**: New issue reported
2. **In Progress**: Assigned to admin/technician
3. **Pending Verification**: Marked as resolved, awaiting verification
4. **Verified Solved**: Confirmed as resolved
5. **Escalated**: Overdue or requires attention
6. **Reopened**: Issue needs more work

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Issues
- `GET /api/issues` - Get issues (with filtering)
- `POST /api/issues` - Create new issue
- `GET /api/issues/:id` - Get single issue
- `PUT /api/issues/:id/assign` - Assign issue
- `PUT /api/issues/:id/status` - Update issue status
- `POST /api/issues/:id/comments` - Add comment
- `POST /api/issues/:id/work-proof` - Upload work proof

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/escalate-issue` - Escalate issue
- `POST /api/admin/reassign-issue` - Reassign issue

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Database Schema

### Users Collection
- Basic user information
- Role-based access (citizen, low_admin, high_admin)
- Assigned zones and departments for admins

### Issues Collection
- Issue details and metadata
- Location information with geospatial indexing
- Status history and comments
- Work proof and media attachments

### Notifications Collection
- User notifications
- Real-time updates
- Priority and read status

## Security Features

- JWT-based authentication
- Role-based authorization
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## Performance Features

- Database indexing for fast queries
- Image optimization with Cloudinary
- Lazy loading and pagination
- Real-time updates with WebSockets
- Responsive design for all devices

## Deployment

### Using Docker (Recommended)
1. Create Dockerfile for both server and client
2. Use docker-compose for orchestration
3. Configure environment variables
4. Deploy to your preferred cloud platform

### Manual Deployment
1. Build the client application
2. Set up MongoDB database
3. Configure environment variables
4. Deploy server to your hosting platform
5. Serve client files through a CDN or web server

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced mapping features
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with external systems
- [ ] Automated issue detection
- [ ] Citizen feedback system
- [ ] Performance monitoring
