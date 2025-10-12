import React, { useState, useCallback, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { EntryType, Payload, PayloadBase } from '../types';

interface EntryFormProps {
    entryType: EntryType;
    onSubmit: (payload: Payload) => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ entryType, onSubmit }) => {
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
                        <input name="personnel_name" type="text" placeholder="Personnel Name" value={formData.personnel_name || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="id_number" type="text" placeholder="ID/Badge Number" value={formData.id_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="purpose" type="text" placeholder="Purpose of Entry" value={formData.purpose || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'TRUCK':
                return (
                    <>
                        <input name="plate_number" type="text" placeholder="Truck Plate Number" value={formData.plate_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="company" type="text" placeholder="Company/Carrier" value={formData.company || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="cargo_type" type="text" placeholder="Cargo Type" value={formData.cargo_type || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'CAR':
                return (
                    <>
                        <input name="plate_number" type="text" placeholder="Car Plate Number" value={formData.plate_number || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="driver_name" type="text" placeholder="Driver Name" value={formData.driver_name || ''} onChange={handleChange} required className={inputClasses} />
                    </>
                );
            case 'OTHER':
                return (
                    <>
                        <input name="description" type="text" placeholder="Brief Description" value={formData.description || ''} onChange={handleChange} required className={inputClasses} />
                        <input name="asset_tag" type="text" placeholder="Asset Tag (Optional)" value={formData.asset_tag || ''} onChange={handleChange} className={inputClasses} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white shadow-xl rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">New Entry: {entryType.replace('_', ' ')}</h2>

            <div className="space-y-4">
                {renderTypeSpecificFields()}
                <textarea
                    name="notes"
                    placeholder="Notes (e.g., security check details)"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    rows={3}
                    className={inputClasses}
                />
            </div>

            <button
                type="submit"
                className="mt-6 w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
            >
                <Check size={20} />
                <span>Log Entry</span>
            </button>
        </form>
    );
};
