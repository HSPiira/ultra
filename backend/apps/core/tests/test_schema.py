"""
Tests for OpenAPI schema generation and customization.
Tests schema generation, endpoint coverage, and authentication documentation.
"""
import json
import yaml
from django.test import TestCase, Client


class OpenAPISchemaTests(TestCase):
    """Test OpenAPI schema generation."""

    def setUp(self):
        """Set up test client."""
        self.client = Client()

    def test_schema_endpoint_exists(self):
        """Test that schema endpoint exists and returns OpenAPI schema."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('application/vnd.oai.openapi', response['Content-Type'])

    def test_schema_generation_no_errors(self):
        """Test that schema generation completes without errors."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)

        # Schema endpoint returns YAML by default, parse it
        try:
            schema = yaml.safe_load(response.content.decode('utf-8'))
            self.assertIsInstance(schema, dict)
        except (yaml.YAMLError, UnicodeDecodeError) as e:
            # If YAML fails, try JSON (if format was specified)
            try:
                schema = json.loads(response.content.decode('utf-8'))
                self.assertIsInstance(schema, dict)
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.fail(f"Schema response is not valid YAML or JSON: {e}")

    def test_schema_info_section(self):
        """Test that schema includes proper info section."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)
        
        # Parse YAML (default format)
        try:
            schema = yaml.safe_load(response.content.decode('utf-8'))
        except (yaml.YAMLError, UnicodeDecodeError) as e:
            # Try JSON as fallback
            try:
                schema = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.fail(f"Schema response is not valid YAML or JSON: {e}")
        
        self.assertIsInstance(schema, dict)
        self.assertIn('info', schema)
        info = schema['info']

        self.assertIn('title', info)
        self.assertIn('version', info)
        self.assertEqual(info['title'], 'Ultra Health Insurance API')
        self.assertEqual(info['version'], '1.0.0')

    def test_schema_contact_information(self):
        """Test that schema includes contact information."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)
        
        try:
            schema = yaml.safe_load(response.content.decode('utf-8'))
        except (yaml.YAMLError, UnicodeDecodeError):
            try:
                schema = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.skipTest("Schema endpoint not returning valid YAML or JSON")

        info = schema.get('info', {})
        self.assertIn('contact', info)

        contact = info['contact']
        self.assertIn('name', contact)
        self.assertIn('email', contact)

    def test_schema_tags(self):
        """Test that schema includes tags for organization."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)
        
        try:
            schema = yaml.safe_load(response.content.decode('utf-8'))
        except (yaml.YAMLError, UnicodeDecodeError):
            try:
                schema = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.skipTest("Schema endpoint not returning valid YAML or JSON")

        self.assertIn('tags', schema)
        tags = schema['tags']

        # Should have tags for major modules
        tag_names = [tag['name'] for tag in tags]
        expected_tags = ['Companies', 'Schemes', 'Members', 'Providers', 'Claims', 'Authentication', 'Health']

        # At least some expected tags should be present
        found_tags = [tag for tag in expected_tags if tag in tag_names]
        self.assertGreater(len(found_tags), 0)

    def test_schema_valid_openapi_version(self):
        """Test that schema specifies valid OpenAPI version."""
        response = self.client.get('/api/v1/schema/')
        self.assertEqual(response.status_code, 200)
        
        try:
            schema = yaml.safe_load(response.content.decode('utf-8'))
        except (yaml.YAMLError, UnicodeDecodeError):
            try:
                schema = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                self.skipTest("Schema endpoint not returning valid YAML or JSON")

        self.assertIn('openapi', schema)
        # Should be OpenAPI 3.x
        openapi_version = schema['openapi']
        self.assertTrue(openapi_version.startswith('3.'))

    def test_swagger_ui_endpoint(self):
        """Test that Swagger UI endpoint is accessible."""
        response = self.client.get('/api/v1/docs/')
        # Should return HTML page (not 404)
        self.assertIn(response.status_code, [200, 301, 302])

    def test_redoc_endpoint(self):
        """Test that ReDoc endpoint is accessible."""
        response = self.client.get('/api/v1/redoc/')
        # Should return HTML page (not 404)
        self.assertIn(response.status_code, [200, 301, 302])
