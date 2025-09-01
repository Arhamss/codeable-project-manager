import React from 'react';

const FormattedText = ({ text, className = "" }) => {
  if (!text || typeof text !== 'string') return null;

  // If the text contains HTML tags, render it safely
  if (text.includes('<') && text.includes('>')) {
    return (
      <div 
        className={`prose prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  // For plain text, just return it wrapped in a paragraph
  return (
    <div className={className}>
      <p className="text-gray-300">{text}</p>
    </div>
  );
};

export default FormattedText;
