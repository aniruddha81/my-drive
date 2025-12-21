# My Drive

A full-stack file storage application with cloud upload capabilities, featuring a web interface and mobile app.

## 🚀 Project Structure

This monorepo contains three main components:

### Backend

- **Tech Stack**: Node.js, Express, Prisma
- **Features**: File upload handling, Cloudinary integration, RESTful API
- **Location**: `backend/`
- **Key Dependencies**: Multer for file handling, Cloudinary for storage

### Frontend

- **Tech Stack**: Next.js 15, TypeScript, React
- **Styling**: Tailwind CSS, shadcn/ui components
- **Location**: `frontend/`
- **Features**: Modern web interface for file management

### Mobile App

- **Tech Stack**: React Native, Expo
- **Styling**: NativeWind (Tailwind for React Native)
- **Location**: `my-drive-app/`
- **Features**: Cross-platform mobile file access

## 📦 Getting Started

### Backend Setup

```bash
cd backend
bun install
bun start
```

### Frontend Setup

```bash
cd frontend
bun install
bun run dev
```

### Mobile App Setup

```bash
cd my-drive-app
bun install
bun start
```

## 🔧 Configuration

- Backend requires Cloudinary credentials for file storage
- Configure environment variables in respective directories
- Prisma schema located at `backend/prisma/schema.prisma`

## 📱 Platforms

- **Web**: Next.js web application
- **Mobile**: iOS & Android via Expo
- **API**: RESTful backend service
