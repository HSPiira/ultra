import React, { useEffect, useState } from 'react';
import { Shield, X } from 'lucide-react';

import { schemesApi } from '../../services/schemes';
import { companiesApi } from '../../services/companies';
import type {
  Scheme,
  SchemeCreateData,
  SchemePeriodSummary,
  SchemeUpdateData,
} from '../../types/schemes';
import type { Company } from '../../types/companies';

interface SchemeFormProps {
  scheme?: Scheme;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const SchemeForm: React.FC<SchemeFormProps> = ({
  scheme,
  isOpen,
  onClose,
  onSave,
}) => {
  const [schemeInfo, setSchemeInfo] = useState<Omit<SchemeCreateData, 'initial_period'>>({
    scheme_name: '',
    company: '',
    description: '',
    card_code: '',
    is_renewable: true,
    family_applicable: false,
    remark: '',
  });
  const [initialPeriod, setInitialPeriod] = useState({
    start_date: '',
    end_date: '',
    limit_amount: 0,
    remark: '',
  });
  const [currentPeriod, setCurrentPeriod] = useState<SchemePeriodSummary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const initialize = async () => {
      await loadCompanies();

      if (scheme) {
        setSchemeInfo({
          scheme_name: scheme.scheme_name,
          company: scheme.company,
          description: scheme.description || '',
          card_code: scheme.card_code,
          is_renewable: scheme.is_renewable,
          family_applicable: scheme.family_applicable,
          remark: scheme.remark || '',
        });

        const period = scheme.current_period || null;
        setCurrentPeriod(period);
        setInitialPeriod({
          start_date: period?.start_date || '',
          end_date: period?.end_date || '',
          limit_amount: period ? Number(period.limit_amount) : 0,
          remark: '',
        });
      } else {
        setSchemeInfo({
          scheme_name: '',
          company: '',
          description: '',
          card_code: '',
          is_renewable: true,
          family_applicable: false,
          remark: '',
        });
        setInitialPeriod({
          start_date: '',
          end_date: '',
          limit_amount: 0,
          remark: '',
        });
        setCurrentPeriod(null);
      }

      setErrors({});
    };

    void initialize();
  }, [isOpen, scheme]);

  const loadCompanies = async () => {
    try {
      const data = await companiesApi.getCompanies({ status: 'ACTIVE' });
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleSchemeInfoChange = (
    field: keyof typeof schemeInfo,
    value: string | boolean,
  ) => {
    setSchemeInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleInitialPeriodChange = (
    field: keyof typeof initialPeriod,
    value: string | number,
  ) => {
    if (scheme) {
      return; // existing schemes manage periods via renewal workflow
    }

    setInitialPeriod((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === 'start_date' && value) {
        const startDate = new Date(value as string);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        updated.end_date = endDate.toISOString().split('T')[0];
      }

      if (field === 'end_date' && value && !prev.start_date) {
        const endDate = new Date(value as string);
        const startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        updated.start_date = startDate.toISOString().split('T')[0];
      }

      return updated;
    });

    const errorKey = field === 'limit_amount' ? 'initial_limit_amount' : `initial_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    if (!schemeInfo.scheme_name.trim()) {
      validationErrors.scheme_name = 'Scheme name is required';
    } else if (schemeInfo.scheme_name.trim().length < 2) {
      validationErrors.scheme_name = 'Scheme name must be at least 2 characters';
    }

    if (!schemeInfo.company) {
      validationErrors.company = 'Company is required';
    }

    if (!schemeInfo.card_code.trim()) {
      validationErrors.card_code = 'Card code is required';
    } else if (schemeInfo.card_code.trim().length !== 3) {
      validationErrors.card_code = 'Card code must be exactly 3 characters';
    }

    if (!scheme) {
      if (!initialPeriod.start_date) {
        validationErrors.initial_start_date = 'Start date is required';
      }

      if (!initialPeriod.end_date) {
        validationErrors.initial_end_date = 'End date is required';
      }

      if (
        initialPeriod.start_date &&
        initialPeriod.end_date &&
        initialPeriod.start_date >= initialPeriod.end_date
      ) {
        validationErrors.initial_end_date = 'End date must be after start date';
      }

      if (!initialPeriod.limit_amount || initialPeriod.limit_amount <= 0) {
        validationErrors.initial_limit_amount =
          'Coverage amount must be greater than 0';
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      if (scheme) {
        const payload: SchemeUpdateData = {
          id: scheme.id,
          scheme_name: schemeInfo.scheme_name.trim(),
          company: schemeInfo.company,
          description: schemeInfo.description?.trim() || undefined,
          card_code: schemeInfo.card_code.trim(),
          is_renewable: schemeInfo.is_renewable,
          family_applicable: schemeInfo.family_applicable,
          remark: schemeInfo.remark?.trim() || undefined,
        };

        await schemesApi.updateScheme(payload);
      } else {
        const payload: SchemeCreateData = {
          scheme_name: schemeInfo.scheme_name.trim(),
          company: schemeInfo.company,
          description: schemeInfo.description?.trim() || undefined,
          card_code: schemeInfo.card_code.trim(),
          is_renewable: schemeInfo.is_renewable,
          family_applicable: schemeInfo.family_applicable,
          remark: schemeInfo.remark?.trim() || undefined,
          initial_period: {
            start_date: initialPeriod.start_date,
            end_date: initialPeriod.end_date,
            limit_amount: initialPeriod.limit_amount,
            remark: initialPeriod.remark?.trim() || undefined,
          },
        };

        await schemesApi.createScheme(payload);
      }

      onSave();
    } catch (error) {
      console.error('Error saving scheme:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const renderCurrentPeriodSummary = () => {
    if (!currentPeriod) {
      return (
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: '#4a4a4a', backgroundColor: '#1f2937' }}
        >
          <p className="text-sm" style={{ color: '#d1d5db' }}>
            No period found for this scheme yet. Use the renew action to add one.
          </p>
        </div>
      );
    }

    return (
      <div
        className="p-4 rounded-lg border space-y-2"
        style={{ borderColor: '#4a4a4a', backgroundColor: '#1f2937' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#ffffff' }}>
              Current Period
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#374151', color: '#d1d5db' }}>
              Period {currentPeriod.period_number}
            </span>
          </div>
          <span className="text-xs" style={{ color: '#9ca3af' }}>
            Use “Renew Scheme” to create the next period
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div style={{ color: '#d1d5db' }}>
            <dt className="text-gray-400">Start Date</dt>
            <dd className="font-medium">{formatDate(currentPeriod.start_date)}</dd>
          </div>
          <div style={{ color: '#d1d5db' }}>
            <dt className="text-gray-400">End Date</dt>
            <dd className="font-medium">{formatDate(currentPeriod.end_date)}</dd>
          </div>
          <div style={{ color: '#d1d5db' }}>
            <dt className="text-gray-400">Coverage Amount</dt>
            <dd className="font-medium">{Number(currentPeriod.limit_amount).toLocaleString()}</dd>
          </div>
          <div style={{ color: '#d1d5db' }}>
            <dt className="text-gray-400">Termination Date</dt>
            <dd className="font-medium">{formatDate(currentPeriod.termination_date)}</dd>
          </div>
        </dl>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: '#4a4a4a' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#3b3b3b' }}
            >
              <Shield className="w-5 h-5" style={{ color: '#d1d5db' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                {scheme ? 'Edit Scheme' : 'Add New Scheme'}
              </h2>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {scheme
                  ? 'Update scheme information. Renewals are handled from the details page.'
                  : 'Create a new scheme and define its initial coverage period.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#3b3b3b';
              event.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
              event.currentTarget.style.color = '#9ca3af';
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                Scheme Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Scheme Name *
                  </label>
                  <input
                    type="text"
                    value={schemeInfo.scheme_name}
                    onChange={(event) =>
                      handleSchemeInfoChange('scheme_name', event.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#3b3b3b',
                      color: '#ffffff',
                      borderColor: errors.scheme_name ? '#ef4444' : '#4a4a4a',
                    }}
                    placeholder="Enter scheme name"
                  />
                  {errors.scheme_name && (
                    <p className="mt-1 text-sm text-red-400">{errors.scheme_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                    Card Code *
                  </label>
                  <input
                    type="text"
                    value={schemeInfo.card_code}
                    onChange={(event) =>
                      handleSchemeInfoChange('card_code', event.target.value.toUpperCase())
                    }
                    className="w-full px-3 py-2 border rounded-lg transition-colors"
                    style={{
                      backgroundColor: '#3b3b3b',
                      color: '#ffffff',
                      borderColor: errors.card_code ? '#ef4444' : '#4a4a4a',
                    }}
                    placeholder="ABC"
                    maxLength={3}
                  />
                  {errors.card_code && (
                    <p className="mt-1 text-sm text-red-400">{errors.card_code}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Company *
                </label>
                <select
                  value={schemeInfo.company}
                  onChange={(event) => handleSchemeInfoChange('company', event.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#3b3b3b',
                    color: '#ffffff',
                    borderColor: errors.company ? '#ef4444' : '#4a4a4a',
                  }}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
                {errors.company && (
                  <p className="mt-1 text-sm text-red-400">{errors.company}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(schemeInfo.is_renewable)}
                    onChange={(event) =>
                      handleSchemeInfoChange('is_renewable', event.target.checked)
                    }
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
                    Renewable Scheme
                  </span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={schemeInfo.family_applicable}
                    onChange={(event) =>
                      handleSchemeInfoChange('family_applicable', event.target.checked)
                    }
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <span className="text-sm font-medium" style={{ color: '#d1d5db' }}>
                    Family Applicable
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Description
                </label>
                <textarea
                  value={schemeInfo.description}
                  onChange={(event) =>
                    handleSchemeInfoChange('description', event.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#3b3b3b',
                    color: '#ffffff',
                    borderColor: '#4a4a4a',
                  }}
                  placeholder="Enter scheme description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                {scheme ? 'Current Period' : 'Initial Period'}
              </h3>

              {scheme ? (
                renderCurrentPeriodSummary()
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={initialPeriod.start_date}
                        onChange={(event) =>
                          handleInitialPeriodChange('start_date', event.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#3b3b3b',
                          color: '#ffffff',
                          borderColor: errors.initial_start_date ? '#ef4444' : '#4a4a4a',
                        }}
                      />
                      {errors.initial_start_date && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.initial_start_date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={initialPeriod.end_date}
                        onChange={(event) =>
                          handleInitialPeriodChange('end_date', event.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#3b3b3b',
                          color: '#ffffff',
                          borderColor: errors.initial_end_date ? '#ef4444' : '#4a4a4a',
                        }}
                      />
                      {errors.initial_end_date && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.initial_end_date}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Coverage Amount (UGX) *
                      </label>
                      <input
                        type="number"
                        value={initialPeriod.limit_amount}
                        onChange={(event) =>
                          handleInitialPeriodChange(
                            'limit_amount',
                            parseFloat(event.target.value) || 0,
                          )
                        }
                        className="w-full px-3 py-2 border rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#3b3b3b',
                          color: '#ffffff',
                          borderColor: errors.initial_limit_amount ? '#ef4444' : '#4a4a4a',
                        }}
                        placeholder="0"
                        min={0}
                        step={0.01}
                      />
                      {errors.initial_limit_amount && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.initial_limit_amount}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                        Period Remark
                      </label>
                      <input
                        type="text"
                        value={initialPeriod.remark}
                        onChange={(event) =>
                          handleInitialPeriodChange('remark', event.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg transition-colors"
                        style={{
                          backgroundColor: '#3b3b3b',
                          color: '#ffffff',
                          borderColor: '#4a4a4a',
                        }}
                        placeholder="Optional note for this period"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#ffffff' }}>
                Additional Information
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#d1d5db' }}>
                  Remarks
                </label>
                <textarea
                  value={schemeInfo.remark}
                  onChange={(event) => handleSchemeInfoChange('remark', event.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#3b3b3b',
                    color: '#ffffff',
                    borderColor: '#4a4a4a',
                  }}
                  placeholder="Enter any additional remarks"
                />
              </div>
            </div>
          </form>
        </div>

        <div
          className="flex items-center justify-end gap-3 p-6 border-t flex-shrink-0"
          style={{ borderColor: '#4a4a4a' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#9ca3af' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#3b3b3b';
              event.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
              event.currentTarget.style.color = '#9ca3af';
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
            onMouseEnter={(event) => {
              if (!loading) {
                event.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(event) => {
              if (!loading) {
                event.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {loading ? 'Saving…' : scheme ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
