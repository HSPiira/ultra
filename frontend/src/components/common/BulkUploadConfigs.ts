// Bulk upload configurations for different entity types

export const MEMBER_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Members',
  description: 'Upload multiple members at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'members_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['name', 'card_number', 'gender', 'relationship', 'company', 'scheme'],
  fieldMappings: {
    'Full Name': 'name',
    'Name': 'name',
    'Card Number': 'card_number',
    'Card No': 'card_number',
    'Gender': 'gender',
    'Sex': 'gender',
    'Relationship': 'relationship',
    'Company': 'company',
    'Company ID': 'company',
    'Scheme': 'scheme',
    'Scheme ID': 'scheme',
    'National ID': 'national_id',
    'ID Number': 'national_id',
    'Date of Birth': 'date_of_birth',
    'DOB': 'date_of_birth',
    'Phone': 'phone_number',
    'Phone Number': 'phone_number',
    'Email': 'email',
    'Email Address': 'email',
    'Address': 'address',
    'Parent': 'parent',
    'Parent ID': 'parent'
  },
  previewColumns: ['name', 'card_number', 'gender', 'relationship', 'company', 'scheme', 'email']
};

export const DOCTOR_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Doctors',
  description: 'Upload multiple doctors at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'doctors_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['first_name', 'last_name', 'email', 'phone_number', 'license_number', 'specialization'],
  fieldMappings: {
    'First Name': 'first_name',
    'Last Name': 'last_name',
    'Email': 'email',
    'Phone': 'phone_number',
    'Phone Number': 'phone_number',
    'License Number': 'license_number',
    'License': 'license_number',
    'Specialization': 'specialization',
    'Speciality': 'specialization',
    'Qualification': 'qualification',
    'Qualifications': 'qualification',
    'Hospital': 'hospital',
    'Hospital ID': 'hospital'
  },
  previewColumns: ['first_name', 'last_name', 'email', 'phone_number', 'license_number', 'specialization']
};

export const HOSPITAL_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Hospitals',
  description: 'Upload multiple hospitals at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'hospitals_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['name', 'address', 'contact_person', 'phone_number', 'email'],
  fieldMappings: {
    'Hospital Name': 'name',
    'Name': 'name',
    'Address': 'address',
    'Contact Person': 'contact_person',
    'Contact': 'contact_person',
    'Phone': 'phone_number',
    'Phone Number': 'phone_number',
    'Email': 'email',
    'Website': 'website',
    'Branch Of': 'branch_of',
    'Parent Hospital': 'branch_of'
  },
  previewColumns: ['name', 'address', 'contact_person', 'phone_number', 'email', 'website']
};

export const COMPANY_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Companies',
  description: 'Upload multiple companies at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'companies_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['company_name', 'industry', 'contact_person', 'phone_number', 'email'],
  fieldMappings: {
    'Company Name': 'company_name',
    'Name': 'company_name',
    'Industry': 'industry',
    'Contact Person': 'contact_person',
    'Contact': 'contact_person',
    'Phone': 'phone_number',
    'Phone Number': 'phone_number',
    'Email': 'email',
    'Website': 'website',
    'Address': 'address'
  },
  previewColumns: ['company_name', 'industry', 'contact_person', 'phone_number', 'email', 'website']
};

export const SCHEME_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Schemes',
  description: 'Upload multiple insurance schemes at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'schemes_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['scheme_name', 'company', 'card_code', 'initial_start_date', 'initial_end_date', 'initial_limit_amount'],
  fieldMappings: {
    'Scheme Name': 'scheme_name',
    'Name': 'scheme_name',
    'Company': 'company',
    'Company ID': 'company',
    'Card Code': 'card_code',
    'Start Date': 'initial_start_date',
    'End Date': 'initial_end_date',
    'Coverage Amount': 'initial_limit_amount',
    'Coverage': 'initial_limit_amount',
    'Description': 'description',
    'Status': 'status'
  },
  previewColumns: ['scheme_name', 'company', 'card_code', 'initial_start_date', 'initial_end_date', 'initial_limit_amount', 'status']
};

export const MEDICINE_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Medicines',
  description: 'Upload multiple medicines at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'medicines_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['name', 'manufacturer', 'strength', 'route', 'duration'],
  fieldMappings: {
    'Medicine Name': 'name',
    'Name': 'name',
    'Manufacturer': 'manufacturer',
    'Strength': 'strength',
    'Route': 'route',
    'Duration': 'duration',
    'Price': 'price',
    'Description': 'description'
  },
  previewColumns: ['name', 'manufacturer', 'strength', 'route', 'duration', 'price']
};

export const LABTEST_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Lab Tests',
  description: 'Upload multiple lab tests at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'lab_tests_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['name', 'description', 'base_amount'],
  fieldMappings: {
    'Test Name': 'name',
    'Name': 'name',
    'Description': 'description',
    'Base Amount': 'base_amount',
    'Price': 'base_amount',
    'Category': 'category'
  },
  previewColumns: ['name', 'description', 'base_amount', 'category']
};

export const SERVICE_BULK_UPLOAD_CONFIG = {
  title: 'Bulk Upload Services',
  description: 'Upload multiple services at once using a CSV file. Download the sample file to see the required format.',
  sampleFileName: 'services_sample.csv',
  acceptedFileTypes: ['.csv', '.xlsx'],
  maxFileSize: 10,
  requiredFields: ['name', 'description', 'base_amount'],
  fieldMappings: {
    'Service Name': 'name',
    'Name': 'name',
    'Description': 'description',
    'Base Amount': 'base_amount',
    'Price': 'base_amount',
    'Category': 'category'
  },
  previewColumns: ['name', 'description', 'base_amount', 'category']
};
