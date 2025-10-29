# Ultra

**A modern claims management and medical service administration platform for insurance and corporate wellness programs.**

Ultra streamlines healthcare claims processing, member management, and medical catalog administration through a unified, enterprise-ready system. Built with Django REST Framework and React, it provides robust APIs and an intuitive interface for managing the complete lifecycle of corporate health insurance programs.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Development](#development)
  - [Running the Development Servers](#running-the-development-servers)
  - [Running Tests](#running-tests)
  - [Code Quality](#code-quality)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Overview

Ultra is designed to handle the complex workflows inherent in corporate health insurance and wellness program administration. The platform enables organizations to:

- **Manage Companies & Members**: Track corporate clients and their enrolled employees with comprehensive member profiles
- **Administer Insurance Schemes**: Configure and manage insurance plans, benefits, coverage, and assignments
- **Process Claims**: Handle medical claims submission, validation, payment processing, and audit trails
- **Maintain Medical Catalogs**: Manage hospitals, doctors, services, medicines, lab tests, and pricing information
- **Provide Analytics**: Generate insights on claims, utilization, costs, and program effectiveness

The system follows domain-driven design principles with a clean separation between models (domain logic), selectors (read operations), and services (write operations), ensuring maintainability and scalability.

---

## Architecture

Ultra follows a modern full-stack architecture pattern:

```text
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Pages  │  │Components│  │  Router  │  │  Store   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST API
┌─────────────────────────────┴───────────────────────────────┐
│                   Backend (Django REST)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   API    │  │ Services │  │Selectors │  │  Models  │   │
│  │  Views   │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   Database & Infrastructure                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │SQLite/   │  │  Redis   │  │IPFS      │  │Blockchain│   │
│  │PostgreSQL│  │  Cache   │  │Storage   │  │Audit Logs│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Backend**: Django REST Framework with a layered architecture
  - **Models**: Domain entities with business rules and validation
  - **Selectors**: Read-only query composition using QuerySets
  - **Services**: Transactional write operations and workflows
  - **API Layer**: Serializers and ViewSets for HTTP interface

- **Frontend**: React with TypeScript, using functional components and hooks
  - Component-based UI with Tailwind CSS
  - Client-side routing with React Router
  - State management with Zustand (planned)
  - RESTful API integration

- **Database**: SQLite for development, PostgreSQL-ready for production
- **Caching**: Redis support for production (local memory cache in development)
- **Future**: IPFS storage and blockchain audit logs (see [Future Roadmap](#future-roadmap))

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Core language |
| Django | 5.2.7 | Web framework |
| Django REST Framework | 3.16.1 | REST API framework |
| drf-spectacular | 0.28.0 | OpenAPI/Swagger documentation |
| django-filter | 25.2 | Advanced filtering |
| django-cors-headers | 4.3.1 | CORS handling |
| django-redis | 6.0.0 | Redis caching |
| cuid2 | 2.0.1 | Collision-resistant IDs |
| SQLite | - | Development database |
| PostgreSQL | - | Production database (configurable) |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| TypeScript | ~5.9.3 | Type safety |
| React | ^18.3.1 | UI framework |
| Vite | ^7.1.14 | Build tool (rolldown-vite) |
| Tailwind CSS | ^4.1.14 | Styling |
| React Router | ^6.28.0 | Client-side routing |
| Axios | ^1.12.2 | HTTP client |
| Lucide React | ^0.546.0 | Icon library |

### Development Tools

- **Black**: Python code formatter
- **Ruff**: Fast Python linter
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript**: Static type checking

---

## Getting Started

### Prerequisites

- **Python 3.11 or higher**
- **Node.js 18 or higher** and npm
- **Git**
- **Redis** (optional, for production caching)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd ultra
   ```

2. **Set up the backend:**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Set up the frontend:**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Run database migrations:**

   ```bash
   cd ../backend
   python manage.py migrate
   ```

5. **(Optional) Create a superuser:**

   ```bash
   python manage.py createsuperuser
   ```

### Environment Configuration

While Ultra includes sensible defaults for development, you should configure environment variables for production. Create a `.env` file in the `backend/` directory:

<details>
<summary><b>Example .env file</b></summary>

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database (PostgreSQL example)
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=ultra_db
DATABASE_USER=ultra_user
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Redis Cache
REDIS_URL=redis://127.0.0.1:6379/1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Email (if needed)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
```

</details>

**Note**: Currently, settings use hardcoded values for development. Consider using `django-environ` or `python-decouple` to load environment variables in production.

---

## Development

### Running the Development Servers

#### Option 1: Run both servers concurrently (recommended)

From the project root:

```bash
npm run dev
```

This starts both the Django backend (port 8000) and Vite frontend (port 5173) simultaneously.

#### Option 2: Run servers separately

Backend:

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm run dev
```

**Access the application:**

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8000>
- **Django Admin**: <http://localhost:8000/admin>
- **API Documentation (Swagger)**: <http://localhost:8000/api/docs>
- **API Documentation (ReDoc)**: <http://localhost:8000/api/redoc>

### Running Tests

**Backend tests:**

```bash
cd backend
python manage.py test
```

To run tests for a specific app:

```bash
python manage.py test apps.companies
```

**Frontend tests:**

(Currently not configured, but you can add Jest/Vitest as needed)

### Code Quality

**Backend:**

Format code:

```bash
black backend/
```

Lint code:

```bash
ruff check backend/
```

Auto-fix issues:

```bash
ruff check --fix backend/
```

**Frontend:**

Lint code:

```bash
cd frontend
npm run lint
```

---

## API Documentation

Ultra provides comprehensive API documentation using OpenAPI 3.0:

- **Swagger UI**: <http://localhost:8000/api/docs>
- **ReDoc**: <http://localhost:8000/api/redoc>
- **OpenAPI Schema (JSON)**: <http://localhost:8000/api/schema/>

The API follows RESTful conventions and includes:

- **Pagination**: All list endpoints support `?page=N` and default to 20 items per page
- **Filtering**: Advanced filtering via `django-filter` (e.g., `?status=ACTIVE&company_id=xxx`)
- **Search**: Full-text search on relevant fields (e.g., `?search=keyword`)
- **Ordering**: Sort results with `?ordering=field_name` or `?ordering=-field_name`

### API Endpoints Overview

| Resource | Endpoint | Description |
|----------|----------|-------------|
| Companies | `/api/companies/` | Manage corporate clients |
| Schemes | `/api/schemes/` | Manage insurance schemes and plans |
| Members | `/api/members/` | Manage enrolled members |
| Providers | `/api/providers/` | Manage hospitals and doctors |
| Medical Catalog | `/api/medical-catalog/` | Manage services, medicines, lab tests, prices |
| Claims | `/api/claims/` | Process and manage medical claims |
| Authentication | `/api/login/`, `/api/logout/` | Session-based authentication |

---

## Project Structure

```text
ultra/
├── backend/
│   ├── apps/
│   │   ├── core/           # Shared models, utilities, exceptions
│   │   ├── companies/      # Company and industry management
│   │   ├── schemes/        # Insurance schemes and benefits
│   │   ├── members/           # Member/person management
│   │   ├── providers/      # Hospitals and doctors
│   │   ├── medical_catalog/ # Medical services catalog
│   │   └── claims/         # Claims processing
│   ├── ultra/              # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── router/         # Routing configuration
│   │   ├── services/       # API client services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── vite.config.ts
│
├── DESIGN_RULES.md         # Frontend design guidelines
└── README.md
```

### Backend App Structure

Each Django app follows a consistent structure:

```text
app_name/
├── models/           # Domain models (split by entity)
├── selectors/        # Read-only query composition
├── services/         # Write operations and workflows
├── api/
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── tests/            # Unit and integration tests
```

**Key Principles:**

- **Models**: Domain logic, validation in `clean()`, database constraints
- **Selectors**: Pure query composition, no side effects, optimized queries
- **Services**: Transactional operations, orchestrates multi-model workflows
- **API Layer**: Thin I/O layer, delegates to selectors/services

---

## Security

### Current Security Measures

- **CORS**: Configured for development (restrict in production)
- **CSRF Protection**: Enabled via Django middleware
- **Soft Deletes**: Prevents accidental data loss with audit trails
- **Input Validation**: Model-level validation and serializer checks
- **Session Authentication**: Django's built-in session management

### Production Security Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in production settings
- [ ] Use a secure `SECRET_KEY` and store it in environment variables
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to your frontend domain(s)
- [ ] Enable HTTPS/TLS
- [ ] Configure database connection pooling
- [ ] Set up rate limiting (commented in `settings.py`)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure Redis for caching and session storage
- [ ] Set up proper logging and monitoring
- [ ] Review and enable authentication/authorization rules
- [ ] Implement API authentication (JWT, OAuth2, etc.)

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Follow the architecture patterns**:
   - Business logic in models/services
   - Read operations in selectors
   - Thin API layer
3. **Write tests** for new features or bug fixes
4. **Run code quality checks** (Black, Ruff, ESLint)
5. **Update documentation** as needed
6. **Submit a pull request** with a clear description

### Code Style

**Backend:**
- Follow PEP 8 conventions
- Use Black for formatting (88 character line length)
- Follow Django best practices
- Write docstrings for classes and functions

**Frontend:**
- Use TypeScript strictly (avoid `any`)
- Follow React functional component patterns
- Adhere to the design rules in `DESIGN_RULES.md`
- Use Tailwind CSS utility classes

### Commit Messages

Use clear, descriptive commit messages:

```text
feat: Add claim payment tracking
fix: Resolve soft delete validation issue
docs: Update API documentation
refactor: Simplify selector query logic
```

---

## Future Roadmap

Ultra is designed with extensibility in mind, particularly for decentralized and blockchain-based features. Planned enhancements include:

### Phase 1: Core Enhancements

- [ ] Enhanced authentication/authorization (JWT, OAuth2, RBAC)
- [ ] Advanced analytics and reporting dashboard
- [ ] Bulk import/export capabilities
- [ ] Email notifications and alerts
- [ ] Multi-tenancy support

### Phase 2: Decentralization Foundation

- [ ] **IPFS Integration**: Store claim documents and medical records on IPFS
  - Off-chain document storage with content addressing
  - Immutable audit trail for claims and payments
  - Reduced database storage costs

- [ ] **Blockchain Audit Logs**: Immutable transaction logging
  - Write claim submissions and approvals to on-chain logs
  - Transparent and tamper-proof audit trail
  - Support for multiple blockchain networks (Ethereum, Polygon, etc.)

### Phase 3: Smart Contract Features

- [ ] **On-Chain Payments**: Smart contract-based payment execution
  - Automated claim payment processing
  - Multi-signature wallet support for approvals
  - Transparent payment history on-chain

- [ ] **Decentralized Identity (DID)**: Member identity management
  - Self-sovereign identity for members
  - Privacy-preserving claims submission
  - Interoperability with other healthcare systems

### Phase 4: Advanced Features

- [ ] Integration with external payment gateways
- [ ] Real-time notifications (WebSockets)
- [ ] Mobile application (React Native)
- [ ] AI-powered fraud detection
- [ ] Advanced reporting and BI integration

These features will be implemented incrementally, with careful consideration of regulatory compliance and privacy requirements.

---

## License

This project is currently **proprietary** and not licensed for public use. All rights reserved.

---

## Credits

Built with Django, React, and modern web technologies. Designed for enterprise healthcare administration and claims management.

---

**Questions or issues?** Please open an issue in the repository or contact the maintainers.
