import React from 'react';

export interface FieldRowProps {
  /** Label text for the field */
  label: string;
  /** Field content */
  children: React.ReactNode;
}

/**
 * FieldRow - Layout component for form fields with label on left, content on right
 */
export const FieldRow: React.FC<FieldRowProps> = ({ label, children }) => (
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
    <div className="text-sm font-medium text-graystone-700 sm:pt-2">{label}</div>
    <div className="space-y-2 text-sm text-graystone-800 sm:col-span-2">{children}</div>
  </div>
);

export default FieldRow;
