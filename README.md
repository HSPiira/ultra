# Ultra

This is a Django project for managing claims, companies, members, and medical catalogs.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ultra
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    ```

## Running the project

1.  **Apply the migrations:**
    ```bash
    python manage.py migrate
    ```

2.  **Run the development server:**
    ```bash
    python manage.py runserver
    ```

## Running tests

```bash
python manage.py test
```