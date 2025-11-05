# Ultra Project - CLAUDE.md

Comprehensive guidance for Claude Code when working with this claims management and medical service administration platform.

---

## Project Overview

**Ultra** is a modern, enterprise-ready claims management and medical service administration platform for insurance and corporate wellness programs. Built with Django REST Framework (backend) and React with TypeScript (frontend), it provides robust APIs and an intuitive dark-themed interface for managing corporate health insurance programs.

**Tech Stack**:
- Backend: Django 5.2.7, DRF 3.16, drf-spectacular (OpenAPI), django-filter, django-cors-headers
- Frontend: React 18.3, TypeScript 5.9, Vite (rolldown), Tailwind CSS 4.1, React Router 6.28
- Database: SQLite (development), PostgreSQL-ready (production)
- Cache: Local memory cache (dev), Redis (production)
- IDs: CUID2 (collision-resistant, sortable identifiers)

**Key Features**:
- Company and member management
- Insurance scheme administration
- Provider (hospital/doctor) management
- Medical catalog (services, medicines, tests)
- Claims processing and auditing
- Soft delete with audit trails
- OpenAPI/Swagger documentation

---

## Development Commands

### Root Level (Both Backend & Frontend)
```bash
# Install all dependencies
cd backend && pip install -r requirements.txt && pip install -r requirements-dev.txt
cd ../frontend && npm install

# Run both servers concurrently (from project root)
npm run dev

# Or run separately:
npm run backend  # Backend only (http://localhost:8000)
npm run frontend # Frontend only (http://localhost:5173)
```

### Backend Commands

#### Setup & Database
```bash
cd backend

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Check migration status
python manage.py showmigrations
```

#### Running & Development
```bash
# Start development server (http://localhost:8000)
python manage.py runserver 0.0.0.0:8000

# Access points:
# - API: http://localhost:8000/api/
# - Swagger docs: http://localhost:8000/api/docs/
# - ReDoc: http://localhost:8000/api/redoc/
# - OpenAPI schema: http://localhost:8000/api/schema/
# - Admin: http://localhost:8000/admin/
```

#### Testing
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.companies
python manage.py test apps.schemes
python manage.py test apps.members
python manage.py test apps.providers
python manage.py test apps.medical_catalog
python manage.py test apps.claims

# Run specific test file
python manage.py test apps.companies.tests.test_api

# Run specific test case
python manage.py test apps.companies.tests.test_api.CompaniesAPITests.test_company_crud

# Run with verbose output
python manage.py test --verbosity=2
```

#### Code Quality
```bash
# Format code (Black)
black backend/

# Lint code (Ruff)
ruff check backend/

# Auto-fix Ruff issues
ruff check --fix backend/

# Check all
black backend/ && ruff check backend/
```

### Frontend Commands

#### Setup & Development
```bash
cd frontend

# Install dependencies
npm install

# Run dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Architecture

### Backend Architecture

#### Project Structure
```
backend/
├── ultra/                           # Django project configuration
│   ├── settings.py                 # Main Django settings
│   ├── urls.py                     # Root URL configuration (aggregates all apps)
│   ├── wsgi.py / asgi.py          # Application entry points
│   └── __init__.py
├── apps/                           # Django applications
│   ├── core/                       # Shared base models, utilities, exceptions
│   │   ├── models/
│   │   │   ├── base.py            # BaseModel with soft delete, CUID, timestamps
│   │   │   └── finance.py         # Financial models
│   │   ├── enums/
│   │   │   └── choices.py         # Enum choices (BusinessStatus, etc.)
│   │   ├── utils/
│   │   │   ├── generators.py      # CUID generation
│   │   │   └── validators.py      # Custom validators
│   │   ├── exceptions.py          # Custom exception handler
│   │   └── tests.py
│   ├── companies/                 # Company & industry management
│   │   ├── models/
│   │   │   ├── company.py
│   │   │   └── industry.py
│   │   ├── selectors/
│   │   │   └── company_selector.py
│   │   ├── services/
│   │   │   └── company_service.py
│   │   ├── api/
│   │   │   ├── serializers.py
│   │   │   ├── views/
│   │   │   │   ├── core_views.py    # Company/Industry CRUD
│   │   │   │   ├── company_analytics.py
│   │   │   │   └── industry_analytics.py
│   │   │   └── urls.py
│   │   ├── tests/
│   │   ├── admin.py
│   │   └── apps.py
│   ├── schemes/                   # Insurance schemes, plans, benefits
│   │   ├── models/
│   │   │   ├── scheme.py
│   │   │   ├── plan.py
│   │   │   ├── benefit.py
│   │   │   └── scheme_item.py
│   │   ├── selectors/
│   │   ├── services/
│   │   ├── api/
│   │   ├── tests/
│   │   └── migrations/
│   ├── members/                   # Member/person management
│   ├── providers/                 # Healthcare provider management
│   ├── medical_catalog/           # Medical services, medicines, tests catalog
│   ├── claims/                    # Claims processing
│   └── __init__.py
├── manage.py
├── requirements.txt               # Production dependencies
├── requirements-dev.txt           # Development tools (Black, Ruff)
├── pyproject.toml                # Black/Ruff configuration
└── db.sqlite3                    # SQLite database (development)
```

#### App Architecture Pattern (HackSoft Style)

Each app follows a consistent, layered architecture:

```
app_name/
├── models/                        # Domain models layer
│   ├── __init__.py              # Export all models
│   ├── model1.py                # Individual model file per entity
│   └── model2.py
├── selectors/                     # Read-only query layer
│   ├── __init__.py              # Export all selector functions
│   └── model_selector.py        # Pure query functions
├── services/                      # Write operations & business logic
│   ├── __init__.py
│   └── model_service.py         # Service class with business logic
├── api/                           # HTTP API layer
│   ├── serializers.py           # DRF serializers
│   ├── views.py                 # ViewSets and views
│   ├── views/                   # (Optional) Organized view files
│   │   ├── __init__.py
│   │   └── core_views.py        # CRUD views
│   └── urls.py                  # URL routing with DefaultRouter
├── tests/                         # Test suite
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_api.py
│   └── test_services.py
├── migrations/                    # Django migrations
├── admin.py                       # Django admin configuration
└── apps.py                        # App configuration

```

### Key Backend Architectural Components

#### BaseModel (`apps.core.models.base`)
All domain models inherit from `BaseModel` providing:

**Fields**:
- `id`: CUID2-based primary key (collision-resistant, sortable, 25 chars max)
- `created_at`: Auto-set creation timestamp
- `updated_at`: Auto-updated modification timestamp
- `status`: Business status (ACTIVE, INACTIVE, SUSPENDED, ARCHIVED) from `BusinessStatusChoices`
- `is_deleted`, `deleted_at`, `deleted_by`: Soft delete tracking

**Managers**:
- `objects`: Default manager, excludes soft-deleted records, orders by `-created_at`
- `all_objects`: All records including soft-deleted

**Methods**:
- `soft_delete(user=None)`: Mark record as deleted without removing it
- `restore()`: Restore a soft-deleted record
- `delete()`: Overridden to use soft_delete

#### Selector Pattern (`selectors/`)
Pure query composition functions with no side effects:

```python
# Pattern: {model}_{operation}(filters, *args)
def scheme_list(company_id=None, status=None, **filters):
    """Returns QuerySet of schemes, optionally filtered"""
    queryset = Scheme.objects.all()
    if company_id:
        queryset = queryset.filter(company_id=company_id)
    if status:
        queryset = queryset.filter(status=status)
    return queryset.select_related('company')

def scheme_get(scheme_id):
    """Returns single scheme or raises Scheme.DoesNotExist"""
    return Scheme.objects.get(id=scheme_id)

def scheme_statistics_get(scheme_id):
    """Returns aggregated statistics for a scheme"""
    return {...}
```

**Characteristics**:
- Pure functions, no state changes
- Named: `{entity}_{verb}()`
- Return QuerySets or model instances
- Use `select_related()` and `prefetch_related()` for optimization
- Handle filtering, ordering, search

#### Service Pattern (`services/`)
Business logic and write operations:

```python
class SchemeService:
    @staticmethod
    @transaction.atomic
    def scheme_create(*, scheme_data: dict, user=None):
        """Create new scheme with validation"""
        # Validation
        if not scheme_data.get('company_id'):
            raise ValidationError("company_id is required")
        
        company = Company.objects.get(id=scheme_data['company_id'])
        if company.status != 'ACTIVE':
            raise ValidationError("Company must be ACTIVE")
        
        # Create and return
        return Scheme.objects.create(**scheme_data)
    
    @staticmethod
    @transaction.atomic
    def scheme_update(scheme_id: str, *, scheme_data: dict):
        """Update scheme with business rule validation"""
        scheme = Scheme.objects.get(id=scheme_id)
        # ... validation and update logic
        scheme.save()
        return scheme
    
    @staticmethod
    @transaction.atomic
    def scheme_activate(scheme_id: str):
        """Reactivate an inactive scheme"""
        scheme = Scheme.objects.get(id=scheme_id)
        scheme.status = 'ACTIVE'
        scheme.restore()  # Restore if soft-deleted
        scheme.save()
        return scheme
```

**Characteristics**:
- Static methods with keyword-only arguments (use `*` to force it)
- Decorated with `@transaction.atomic` for consistency
- Raise `ValidationError` for business rule violations
- Handle complex operations: validation, status transitions, bulk operations
- Coordinated with related models (Company, Plan, Benefit, etc.)

#### Custom Exception Handler (`apps.core.exceptions`)
Centralized error handling returns consistent JSON format:

```python
# Input:
# ValidationError("Email must be unique")

# Output:
{
    "success": false,
    "error": {
        "type": "ValidationError",
        "message": "Email must be unique",
        "details": {...}
    }
}
```

#### URL Configuration
- **Root**: `backend/ultra/urls.py` aggregates all app routers
- **Each App**: `api/urls.py` contains `DefaultRouter()` with registered ViewSets
- **Pattern**: `router.registry.extend(app_router.registry)` in root urls.py
- **Schema**: Available at `/api/schema/` (JSON), `/api/docs/` (Swagger), `/api/redoc/` (ReDoc)

### Frontend Architecture

#### Project Structure
```
frontend/
├── src/
│   ├── pages/                     # Page-level components
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── claims/
│   │   ├── companies/             # Company management pages
│   │   ├── dashboard/
│   │   ├── medical-catalog/
│   │   ├── members/
│   │   ├── providers/
│   │   ├── reports/
│   │   ├── schemes/               # Insurance scheme pages
│   │   ├── settings/
│   │   └── index.ts              # Page exports
│   ├── components/                # Reusable UI components
│   │   ├── common/               # Common components (Button, Input, Modal, etc.)
│   │   ├── features/             # Feature-specific components
│   │   ├── layout/               # Layout components (Header, Sidebar, etc.)
│   │   └── tables/               # Table components
│   ├── router/
│   │   ├── index.tsx             # Router setup with context providers
│   │   └── routes.ts             # Route definitions
│   ├── services/                  # API client services
│   │   ├── api.ts                # Base API client (fetch-based)
│   │   ├── companies.ts          # Company API calls
│   │   ├── schemes.ts            # Scheme API calls
│   │   ├── members.ts            # Member API calls
│   │   ├── providers.ts          # Provider API calls
│   │   ├── medical-catalog.ts
│   │   ├── benefits.ts
│   │   ├── plans.ts
│   │   ├── scheme-items.ts
│   │   └── index.ts              # Export all services
│   ├── store/                     # State management (Zustand planned)
│   ├── types/                     # TypeScript type definitions
│   │   └── *.ts                  # Domain-specific types
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom React hooks
│   ├── utils/                     # Utility functions
│   ├── constants/                 # Constants
│   ├── assets/                    # Static assets
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── index.html                     # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.app.json             # TypeScript config (app)
├── tsconfig.node.json            # TypeScript config (build tools)
├── package.json
├── eslint.config.js              # ESLint configuration
└── tailwind.config.js            # Tailwind CSS configuration
```

#### Key Frontend Features

**Routing** (`src/router/`):
- React Router 6.28 for client-side navigation
- Protected routes for authenticated pages
- Dynamic route matching for resources (companies, schemes, etc.)

**API Integration** (`src/services/`):
```typescript
// Pattern: service-based API calls with proper typing
export const getCompanies = async (filters?: CompanyFilters) => {
  const response = await api.get('/api/companies/', { params: filters });
  return response.data as Company[];
};

export const createCompany = async (data: CreateCompanyDTO) => {
  const response = await api.post('/api/companies/', data);
  return response.data as Company;
};
```

**Component Structure**:
- Common components: Button, Input, Modal, Select, Table (Tailwind-styled)
- Feature components: Organized by domain (companies, schemes, members, etc.)
- Layout components: Header, Sidebar, Navigation
- Table components: Reusable data tables with sorting, filtering, pagination

**Styling**:
- Tailwind CSS 4.1 for all styling
- Dark theme enforced (see DESIGN_RULES.md)
- Gray-scale color palette with minimal accent colors
- Consistent spacing and rounded corners

#### Design Rules (`DESIGN_RULES.md`)

**Strict Color Palette** (Dark Theme):
- Background: `#1a1a1a` (main), `#2a2a2a` (secondary), `#3b3b3b` (content)
- Text: `#ffffff` (primary), `#d1d5db` (secondary), `#9ca3af` (muted)
- Borders: `#4a4a4a` or `#5a5a5a`
- Status: Success `#10b981`, Error `#ef4444`, Warning `#f59e0b`

**Forbidden**:
- NO BLUE colors
- NO COLORED ACCENTS (gray-scale only)
- NO BRIGHT COLORS

**Components**:
- Cards: `bg-gray-800` with `border-gray-700`
- Buttons: Gray backgrounds with white text
- Forms: Gray backgrounds with gray borders
- Headings: `text-white`
- Body text: `text-gray-300` or `text-gray-400`

---

## Testing Strategy

### Backend Testing

**Framework**: Django's `TestCase` with `APIClient`

**Test File Organization**:
```
app_name/tests/
├── test_models.py      # Model validation, methods
├── test_api.py         # API endpoints, serialization
└── test_services.py    # Service business logic
```

**Test Pattern**:
```python
class CompaniesAPITests(APITestCase):
    def setUp(self):
        # Create test data
        self.user = User.objects.create_user('test@example.com', 'password')
        self.industry = Industry.objects.create(
            industry_name="Technology",
            description="Tech companies"
        )
        self.company = Company.objects.create(
            company_name="Test Corp",
            industry=self.industry,
            status='ACTIVE'
        )
    
    def test_company_crud(self):
        # Authenticate
        self.client.force_login(self.user)
        
        # Test GET
        response = self.client.get('/api/companies/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test POST
        response = self.client.post('/api/companies/', {
            'company_name': 'New Corp',
            'industry_id': self.industry.id
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Company.objects.count(), 2)
```

**Testing Coverage**:
- CRUD operations (create, read, update, delete/soft-delete)
- Validation rules (required fields, constraints)
- Filtering, ordering, searching
- Permission checks (authenticated vs. unauthenticated)
- Edge cases and error scenarios
- Soft delete behavior

**Running Tests**:
```bash
# All tests
python manage.py test

# Specific app
python manage.py test apps.companies

# Specific test file
python manage.py test apps.companies.tests.test_api

# Specific test class
python manage.py test apps.companies.tests.test_api.CompaniesAPITests

# Specific test method
python manage.py test apps.companies.tests.test_api.CompaniesAPITests.test_company_crud

# Verbosity
python manage.py test --verbosity=2

# Keep database (don't flush between tests)
python manage.py test --keepdb
```

### Frontend Testing

**Currently**: Not configured, but can add Jest/Vitest as needed

---

## Configuration Files

### Backend Settings (`backend/ultra/settings.py`)

**Key Configurations**:
- `DEBUG = True` (change to False for production)
- `ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'testserver']`
- `SECRET_KEY`: Development key (change in production)
- **Database**: SQLite for development, PostgreSQL-ready
- **Cache**: Local memory cache (DEBUG), Redis (production)
- **CORS**: All origins allowed (restrict in production)
- **REST Framework**:
  - Pagination: 20 items per page
  - Filters: DjangoFilterBackend, SearchFilter, OrderingFilter
  - Auth: Session + Basic (temporarily AllowAny)
  - Custom exception handler
- **Logging**: Suppresses expected test errors

**Environment Variables** (for production):
```bash
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=ultra_db
DATABASE_USER=ultra_user
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432
REDIS_URL=redis://localhost:6379/1
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend Configuration

**Vite Config** (`frontend/vite.config.ts`):
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

**TypeScript Config** (`frontend/tsconfig.app.json`):
- Target: ES2022
- Strict mode enabled
- No unused locals/parameters
- Path aliases: `@/*` → `src/*`

**ESLint Config** (`frontend/eslint.config.js`):
- TypeScript support via typescript-eslint
- React hooks rules
- React refresh plugin

---

## Common Workflows

### Adding a New Model to Backend

1. **Create Model** (`models/` directory):
```python
# models/new_model.py
from ..core.models import BaseModel

class NewModel(BaseModel):
    name = models.CharField(max_length=255)
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE)
    # ... other fields
```

2. **Export** in `models/__init__.py`:
```python
from .new_model import NewModel
__all__ = ['NewModel']
```

3. **Create Selector** (`selectors/new_model_selector.py`):
```python
def new_model_list(company_id=None, **filters):
    queryset = NewModel.objects.all()
    if company_id:
        queryset = queryset.filter(company_id=company_id)
    return queryset

def new_model_get(model_id):
    return NewModel.objects.get(id=model_id)
```

4. **Create Service** (`services/new_model_service.py`):
```python
class NewModelService:
    @staticmethod
    @transaction.atomic
    def new_model_create(*, model_data: dict, user=None):
        return NewModel.objects.create(**model_data)
```

5. **Create Serializers** (`api/serializers.py`):
```python
class NewModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewModel
        fields = ['id', 'name', 'company', 'status', 'created_at']
```

6. **Create ViewSet** (`api/views.py`):
```python
class NewModelViewSet(ModelViewSet):
    queryset = NewModel.objects.all()
    serializer_class = NewModelSerializer
    filterset_fields = ['company_id', 'status']
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
```

7. **Register URL** (`api/urls.py`):
```python
router = DefaultRouter()
router.register(r'new-models', NewModelViewSet, basename='new_model')
```

8. **Create Migration**:
```bash
python manage.py makemigrations
python manage.py migrate
```

9. **Write Tests** (`tests/test_api.py`, `tests/test_models.py`):
```python
class NewModelAPITests(APITestCase):
    def test_new_model_crud(self):
        # Test creation, retrieval, update, deletion
        pass
```

### Adding a New Frontend Page

1. **Create Page Component** (`pages/feature/`):
```typescript
// pages/companies/CompaniesPage.tsx
export const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  
  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);
  
  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl">Companies</h1>
      {/* Page content */}
    </div>
  );
};
```

2. **Add Route** (`router/routes.ts`):
```typescript
export const routes: RouteObject[] = [
  {
    path: '/companies',
    element: <CompaniesPage />,
    label: 'Companies'
  },
];
```

3. **Create API Service** (`services/companies.ts`):
```typescript
export const getCompanies = async () => {
  return api.get('/api/companies/');
};
```

4. **Use Components**:
- Import common components from `components/common/`
- Use table component from `components/tables/`
- Follow dark theme rules from `DESIGN_RULES.md`

### Implementing Business Logic

**Backend**:
- **Read operations** → Add function to `selectors/`
- **Write operations** → Add static method to `Service` class
- Always use `@transaction.atomic` for writes
- Raise `ValidationError` for business rule violations
- Use keyword-only arguments

**Frontend**:
- **API calls** → Add function to `services/`
- **State management** → Use React hooks or Zustand (planned)
- **Component logic** → Keep in component or extract custom hooks

---

## Key Patterns & Conventions

### Backend Patterns

**Keyword-Only Arguments**:
```python
# Good: Forces explicit parameter naming
def create_scheme(*, scheme_data: dict, user=None):
    pass

# Bad: Can be called with positional args
def create_scheme(scheme_data, user=None):
    pass
```

**Transaction Safety**:
```python
# All write operations must be atomic
@transaction.atomic
def update_scheme(*, scheme_data: dict):
    scheme = Scheme.objects.select_for_update().get(id=scheme_data['id'])
    # ... update logic
```

**Status Transitions**:
```python
# Services handle status changes
def activate(model_id):
    instance = Model.objects.get(id=model_id)
    instance.status = 'ACTIVE'
    instance.restore()  # Restore if soft-deleted
    instance.save()
    return instance
```

**Soft Delete**:
```python
# Use managers correctly
Model.objects.all()          # Only active records
Model.all_objects.all()      # Including deleted

# Call soft_delete instead of delete
instance.soft_delete(user=user)
```

**Validation Flow**:
1. Required field validation
2. Data type conversion
3. Foreign key resolution
4. Business rule validation
5. Uniqueness checks
6. Related entity status validation

### Frontend Patterns

**API Service Pattern**:
```typescript
// services/companies.ts
export const getCompanies = async (params?: CompanyFilters) => {
  const response = await api.get('/api/companies/', { params });
  return response.data;
};

export const createCompany = async (data: CreateCompanyDTO) => {
  const response = await api.post('/api/companies/', data);
  return response.data;
};
```

**Component Pattern**:
```typescript
// React functional components with hooks
export const CompanyForm = ({ onSubmit }: Props) => {
  const [formData, setFormData] = useState<CreateCompanyDTO>({});
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const company = await createCompany(formData);
    onSubmit(company);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  );
};
```

**Dark Theme Pattern**:
```typescript
// Always use gray-scale Tailwind classes
<div className="bg-gray-900 text-white">
  <h1 className="text-2xl font-bold text-white">Title</h1>
  <p className="text-gray-300">Description</p>
  <button className="bg-gray-700 hover:bg-gray-600 text-white">
    Click Me
  </button>
</div>
```

---

## Important Notes

### Security Checklist for Production

Before deploying to production:
- [ ] Set `DEBUG=False`
- [ ] Use secure, random `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Restrict `CORS_ALLOWED_ORIGINS`
- [ ] Enable HTTPS/TLS
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure Redis for caching
- [ ] Set up proper logging and monitoring
- [ ] Implement authentication (JWT, OAuth2)
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review and test all permission rules

### Code Style

**Backend**:
- Black: 88 character line length, Python 3.11+
- Ruff: PEP 8, import sorting, naming conventions
- Docstrings for all classes and complex functions
- Type hints where possible

**Frontend**:
- TypeScript strict mode enabled
- ESLint with typescript-eslint
- No `any` types unless absolutely necessary
- Functional components with hooks
- Follow DESIGN_RULES.md for styling

### Git Workflow

**Commit Messages**:
```
feat: Add claim payment tracking
fix: Resolve soft delete validation issue
docs: Update API documentation
refactor: Simplify selector query logic
test: Add comprehensive scheme tests
```

**Branch Naming**:
- Feature: `feature/feature-name`
- Fix: `fix/issue-name`
- Refactor: `refactor/refactor-name`

---

## Useful Resources

**API Documentation**:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

**External References**:
- Django: https://docs.djangoproject.com/
- DRF: https://www.django-rest-framework.org/
- React: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- Vite: https://vite.dev/
- React Router: https://reactrouter.com/

---

**Last Updated**: 2024
**Status**: Active Development
