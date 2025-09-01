import React from 'react';
import { RichTextEditor as RTEditor } from '@rtdui/editor';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...", 
  rows = 4,
  className = "",
  error = false,
  disabled = false
}) => {
  const handleChange = (newValue) => {
    // Convert the editor's HTML output to our markdown-like format
    if (typeof newValue === 'string') {
      onChange(newValue);
    }
  };

  return (
    <div className={`${className}`}>
      <RTEditor
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
        styles={{
          root: {
            backgroundColor: 'transparent',
            border: error ? '1px solid #ef4444' : '1px solid #374151',
            borderRadius: '0.5rem',
            '&:focus-within': {
              borderColor: error ? '#ef4444' : '#3b82f6',
              boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }
          },
          content: {
            minHeight: `${rows * 1.5}rem`,
            padding: '0.75rem',
            color: '#f9fafb',
            fontSize: '0.875rem',
            lineHeight: '1.25rem'
          },
          toolbar: {
            backgroundColor: '#1f2937',
            borderBottom: '1px solid #374151',
            borderTopLeftRadius: '0.5rem',
            borderTopRightRadius: '0.5rem'
          },
          toolbarButton: {
            color: '#9ca3af',
            '&:hover': {
              backgroundColor: '#374151',
              color: '#ffffff'
            }
          },
          toolbarButtonActive: {
            backgroundColor: '#3b82f6',
            color: '#ffffff'
          }
        }}
        toolbar={[
          'bold',
          'italic',
          'underline',
          'strike',
          '|',
          'bulletList',
          'orderedList',
          '|',
          'blockquote',
          'codeBlock',
          '|',
          'alignLeft',
          'alignCenter',
          'alignRight',
          'alignJustify',
          '|',
          'link',
          'image'
        ]}
      />
      
      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Use the toolbar above to format your text. The editor automatically saves your formatting.</p>
      </div>
    </div>
  );
};

export default RichTextEditor;
