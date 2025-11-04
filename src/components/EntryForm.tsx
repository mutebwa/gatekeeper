import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import type { EntryType, Payload, PayloadBase } from '../types';

interface EntryFormProps {
    entryType: EntryType;
    onSubmit: (payload: Payload) => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ entryType, onSubmit }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<PayloadBase & any>({ notes: '' });

    // Reset form data when entryType changes
    useEffect(() => {
        setFormData({ notes: '' });
    }, [entryType]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as Payload);
        setFormData({ notes: '' });
    };

    const inputClasses = "w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white/90";

    const renderTypeSpecificFields = () => {
        switch (entryType) {
            case 'PERSONNEL':
                return (
                    <>
                        <input name="personnel_name" type="text" placeholder={t('entryForm.personnelName')} value={formData.personnel_name || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="id_number" type="text" placeholder={t('entryForm.personnelId')} value={formData.id_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="purpose" type="text" placeholder={t('entryForm.purpose')} value={formData.purpose || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'TRUCK':
                return (
                    <>
                        <input name="plate_number" type="text" placeholder={t('entryForm.licensePlate')} value={formData.plate_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="company" type="text" placeholder={t('entryForm.company')} value={formData.company || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="cargo_type" type="text" placeholder={t('entryForm.cargoDescription')} value={formData.cargo_type || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'CAR':
                return (
                    <>
                        <input name="plate_number" type="text" placeholder={t('entryForm.licensePlate')} value={formData.plate_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="driver_name" type="text" placeholder={t('entryForm.driverName')} value={formData.driver_name || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'OTHER':
                return (
                    <>
                        <input name="description" type="text" placeholder={t('entryForm.description')} value={formData.description || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="asset_tag" type="text" placeholder="Asset Tag (Optional)" value={formData.asset_tag || ''} onChange={handleChange} className={inputClasses} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white shadow-xl rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{t(`entryForm.${entryType.toLowerCase()}Entry`)}</h2>

            <div className="space-y-4">
                {renderTypeSpecificFields()}
                <textarea
                    name="notes"
                    placeholder={t('entryForm.notes')}
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className={inputClasses}
                />
            </div>

            <button
                type="submit"
                className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700:bg-indigo-600 transition-colors flex items-center justify-center space-x-2"
            >
                <Check size={20} />
                <span>{t('entryForm.logEntry')}</span>
            </button>
        </form>
    );
};
