# SDP Attendance Management System - Final Version

## 🚀 Quick Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
node server.js
```
The server will start on port 3000.

### 3. Start the Mobile App
```bash
npx expo start --clear
```

### 4. Access the App
- **Expo Go**: Scan the QR code with your phone
- **Web**: Press 'w' in the terminal to open in web browser
- **Android Emulator**: Press 'a' in the terminal
- **iOS Simulator**: Press 'i' in the terminal (Mac only)

## 📱 Features

### 👨‍🎓 Student Features
- **Dashboard**: View profile and overall attendance statistics
- **Courses**: View enrolled courses with attendance marks
- **Attendance Reports**: Download individual attendance reports
- **Course Details**: View specific course attendance data

### 👨‍🏫 Teacher Features
- **Dashboard**: View teaching statistics (courses, enrollments, students)
- **Course Management**: Create and manage courses
- **Take Attendance**: Record student attendance for specific dates/sections
- **Attendance Reports**: Generate and download attendance reports
- **Student Management**: View enrolled students and their details

### 👨‍💼 Super Admin Features
- **Dashboard**: View system-wide statistics
- **User Management**: Create teachers and manage all users
- **Course Management**: View all courses across the system
- **Attendance Reports**: Access all attendance data and reports

## 🔧 Technical Details

### Backend
- **Node.js** with Express.js
- **MongoDB** database
- **JWT** authentication
- **RESTful API** endpoints

### Frontend
- **React Native** with Expo
- **React Navigation** for routing
- **Context API** for state management
- **Expo SecureStore** for token storage

### Key Components
- **Authentication System**: Login/Register with role-based access
- **Attendance System**: Record and track student attendance
- **Report Generation**: PDF downloads for attendance reports
- **Real-time Updates**: Live data synchronization

## 📊 Database Collections
- **users**: Student, teacher, and admin accounts
- **courses**: Course information and details
- **enrollments**: Student-course enrollment records
- **attendance**: Daily attendance records

## 🔐 Default Accounts
- **Super Admin**: admin@gmail.com / password123
- **Teachers**: Created by super admin
- **Students**: Self-registration available

## 📁 Project Structure
```
sdp-app/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── database/           # Database models and config
├── navigation/         # Navigation setup
├── screens/           # App screens
├── services/          # API and business logic
├── assets/            # Images and icons
├── server.js          # Backend server
├── App.js             # Main app component
└── package.json       # Dependencies
```

## 🛠️ Development
- **Port**: 3000 (backend), 19006 (Expo)
- **Database**: MongoDB (local or cloud)
- **Platform**: Cross-platform (iOS, Android, Web)

## 📞 Support
For issues or questions, check the console logs and ensure all dependencies are properly installed.

---
**Version**: Final Release
**Last Updated**: October 2025