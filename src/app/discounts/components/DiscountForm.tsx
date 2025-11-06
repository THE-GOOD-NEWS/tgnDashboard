'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Discount, DiscountApplicationType, DiscountCalculationType, DiscountCondition, CustomerTag, BuyXGetYDetails } from '@/types/discount';

interface DiscountFormProps {
  params: {
    id: string;
  };
}

type ConditionField = keyof DiscountCondition;

export default function DiscountForm({ params }: DiscountFormProps) {
  const router = useRouter();
  const isEditing = params.id !== 'new';
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Discount>>({
    code: '',
    name: '',
    description: '',
    applicationType: 'MANUAL',
    calculationType: 'PERCENTAGE',
    value: 0,
    isActive: true,
    redeemType: '',
    conditions: {
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  useEffect(() => {
    if (isEditing) {
      fetchDiscount();
    }
  }, [isEditing]);

  const fetchDiscount = async () => {
    try {
      const response = await fetch(`/api/discounts/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch discount');
      }
      const data = await response.json();
      // Convert string dates to Date objects
      if (data.conditions) {
        data.conditions.validFrom = new Date(data.conditions.validFrom);
        data.conditions.validUntil = new Date(data.conditions.validUntil);
      }
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/discounts${isEditing ? `/${params.id}` : ''}`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save discount');
      }

      router.push('/discounts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle nested fields (buyXGetYDetails)
    if (name.startsWith('buyXGetYDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => {
        const newBuyXGetYDetails = {
          ...prev.buyXGetYDetails,
          [field]: type === 'number' ? Number(value) : value,
        } as BuyXGetYDetails;
        
        return {
          ...prev,
          buyXGetYDetails: newBuyXGetYDetails,
        };
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleConditionChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (!prev.conditions) {
        return prev;
      }

      const newConditions = { ...prev.conditions };
      const fieldName = name as ConditionField;

      switch (fieldName) {
        case 'validFrom':
        case 'validUntil':
          newConditions[fieldName] = new Date(value);
          break;
        case 'minimumOrderAmount':
        case 'usageLimit':
        case 'usageLimitPerCustomer':
          newConditions[fieldName] = Number(value);
          break;
        case 'firstTimeCustomerOnly':
          newConditions[fieldName] = value === 'true';
          break;
        case 'productIds':
        case 'collectionIds':
          newConditions[fieldName] = value.split(',').map((v) => v.trim());
          break;
        case 'customerTags':
          newConditions[fieldName] = value
            .split(',')
            .map((v) => v.trim().toUpperCase() as CustomerTag)
            .filter((tag): tag is CustomerTag => 
              ['VIP', 'LOYAL', 'NEW'].includes(tag)
            );
          break;
        default:
          // This should never happen due to TypeScript's exhaustive checking
          const _exhaustiveCheck: never = fieldName;
          return prev;
      }

      return {
        ...prev,
        conditions: newConditions,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Discount' : 'Create New Discount'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Application Type
            </label>
            <select
              name="applicationType"
              value={formData.applicationType}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="AUTOMATIC">Automatic</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Calculation Type
            </label>
            <select
              name="calculationType"
              value={formData.calculationType}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
              {/* <option value="BUY_X_GET_Y">Buy X Get Y</option> */}
            </select>
          </div>

          {
          // formData.calculationType === 'BUY_X_GET_Y' ? (
          //   <>
          //     <div>
          //       <label className="block text-sm font-medium text-gray-700">
          //         Buy Quantity
          //       </label>
          //       <input
          //         type="number"
          //         name="buyXGetYDetails.buyQuantity"
          //         value={formData.buyXGetYDetails?.buyQuantity || ''}
          //         onChange={handleChange}
          //         required
          //         min="1"
          //         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          //       />
          //     </div>
          //     <div>
          //       <label className="block text-sm font-medium text-gray-700">
          //         Get Quantity
          //       </label>
          //       <input
          //         type="number"
          //         name="buyXGetYDetails.getQuantity"
          //         value={formData.buyXGetYDetails?.getQuantity || ''}
          //         onChange={handleChange}
          //         required
          //         min="1"
          //         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          //       />
          //     </div>
          //   </>
          // ) : 
          formData.calculationType !== 'FREE_SHIPPING' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Value {formData.calculationType === 'PERCENTAGE' ? '(%)' : ''}
              </label>
              <input
                type="number"
                name="value"
                value={formData.value || ''}
                onChange={handleChange}
                required
                min="0"
                step={formData.calculationType === 'PERCENTAGE' ? '1' : '0.01'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Redeem Type
            </label>
            <select
              name="redeemType"
              value={formData.redeemType || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Redeem Type</option>
              <option value="Purchase">Purchase</option>
              <option value="Subscription">Subscription</option>
              <option value="All">All</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valid From
            </label>
            <input
              type="datetime-local"
              name="validFrom"
              value={formData.conditions?.validFrom.toISOString().slice(0, 16)}
              onChange={handleConditionChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valid Until
            </label>
            <input
              type="datetime-local"
              name="validUntil"
              value={formData.conditions?.validUntil.toISOString().slice(0, 16)}
              onChange={handleConditionChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Order Amount
            </label>
            <input
              type="number"
              name="minimumOrderAmount"
              value={formData.conditions?.minimumOrderAmount || ''}
              onChange={handleConditionChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usage Limit
            </label>
            <input
              type="number"
              name="usageLimit"
              value={formData.conditions?.usageLimit || ''}
              onChange={handleConditionChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/discounts')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-accent disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Discount'}
          </button>
        </div>
      </form>
    </div>
  );
} 