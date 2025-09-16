# Overview

SGA (Sistema de Gerenciamento de Armazém) is a Warehouse Management System designed to optimize warehouse operations from product receipt to dispatch. The system consists of a FastAPI backend with SQLAlchemy ORM and an Express.js frontend serving static HTML/CSS/JavaScript files. The application manages products, inventory movements, user authentication, and provides analytics through charts and reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
The backend is built with FastAPI and follows a modular structure:

**API Framework**: FastAPI with async/await patterns for high-performance database operations
- **Database ORM**: SQLAlchemy with async support using asyncpg for PostgreSQL connectivity
- **Authentication**: JWT tokens with bcrypt password hashing for secure user sessions
- **Data Models**: Dimensional modeling approach with fact and dimension tables (DimProduto, FactRecebimento, FactSaida, etc.)
- **Router Organization**: Modular routers for different domains (auth, products, inventory, charts)

**Key Design Decisions**:
- Async database operations for better scalability
- Separation of concerns with dedicated schemas for request/response validation
- Base64 encoding for image storage and transmission
- CORS middleware enabled for frontend integration

## Frontend Architecture
The frontend uses a traditional multi-page application approach:

**Server Framework**: Express.js serving static files with session management
- **Template Engine**: EJS for server-side rendering with Express sessions
- **UI Components**: Vanilla JavaScript with modular CSS files
- **Charts**: ApexCharts for data visualization
- **File Upload**: Multer middleware for handling product images

**Key Design Decisions**:
- Multi-step product registration wizard (cadastro1-5.html)
- Role-based UI differences (student vs professor views)
- Client-side filtering and search functionality
- Responsive design with CSS Grid/Flexbox

## Data Storage Architecture
**Primary Database**: PostgreSQL with dimensional modeling
- **User Management**: Separate tables for students (DimUsuario) and professors (DimProfessor)
- **Product Management**: Central DimProduto table with associated category relationships
- **Inventory Tracking**: Fact tables for receipts (FactRecebimento) and issues (FactSaida)
- **Warehouse Layout**: Physical location tracking (rua, coluna, andar) within product records

**Key Design Decisions**:
- Star schema design for analytical queries
- Separate authentication models for different user types
- BLOB storage for product images within the database
- Audit trail through "inserido_por" fields

## Authentication & Authorization
**Dual Authentication System**:
- Student authentication via email/password with JWT tokens
- Professor authentication with enhanced privileges (@professor.com email domain)
- Session-based frontend authentication with Express sessions
- Role-based access control for administrative functions

# External Dependencies

## Backend Dependencies
**Core Framework**: FastAPI 0.116.1 with Uvicorn ASGI server
**Database**: 
- SQLAlchemy 2.0.41 for ORM with asyncpg 0.30.0 for PostgreSQL async connectivity
- PostgreSQL database (configured via DATABASE_URL environment variable)

**Authentication & Security**:
- python-jose for JWT token handling
- bcrypt 4.3.0 for password hashing
- passlib 1.7.4 for password context management

**Utilities**:
- Pydantic 2.11.7 for data validation and serialization
- python-dotenv for environment variable management
- email-validator for email format validation

## Frontend Dependencies
**Server Framework**: Express.js 4.21.1 with related middleware
**Database Integration**: mssql 11.0.1 for SQL Server connectivity (legacy/alternative database)
**File Processing**: multer 1.4.5 for file upload handling
**UI Enhancement**: 
- ApexCharts 4.0.0 for interactive charts
- SweetAlert2 11.14.5 for user notifications

**Template & Session Management**:
- EJS 3.1.10 for server-side templating
- express-session 1.18.1 for session management
- CORS 2.8.5 for cross-origin resource sharing

## Development Tools
**Python Environment**: Python with asyncio support for FastAPI
**Node.js Environment**: Node.js runtime for Express.js server
**Database Clients**: Support for both PostgreSQL (primary) and SQL Server (alternative)

**Key Integration Points**:
- Backend API serves data via HTTP/JSON to frontend
- Frontend communicates with backend on localhost:8000
- Database connections managed through environment configuration
- Image upload and processing handled through multipart form data