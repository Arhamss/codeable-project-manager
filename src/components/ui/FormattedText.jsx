import React from 'react';

const FormattedText = ({ text, className = "" }) => {
  if (!text || typeof text !== 'string') return null;

  // Function to parse and format the text
  const formatText = (text) => {
    // Split text into lines to handle different formatting
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      if (!line.trim()) return <br key={lineIndex} />;
      
      // Check for different line types
      if (line.startsWith('• ')) {
        // Bullet list
        return (
          <div key={lineIndex} className="flex items-start space-x-2 mb-1">
            <span className="text-primary-400 text-lg leading-none mt-0.5">•</span>
            <span className="flex-1">{formatInlineText(line.substring(2))}</span>
          </div>
        );
      }
      
      if (/^\d+\.\s/.test(line)) {
        // Numbered list
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          return (
            <div key={lineIndex} className="flex items-start space-x-2 mb-1">
              <span className="text-primary-400 font-medium min-w-[1.5rem]">{match[1]}.</span>
              <span className="flex-1">{formatInlineText(match[2])}</span>
            </div>
          );
        }
      }
      
      if (line.startsWith('> ')) {
        // Quote
        return (
          <blockquote key={lineIndex} className="border-l-4 border-primary-500 pl-4 py-2 my-2 bg-primary-500/10 italic">
            {formatInlineText(line.substring(2))}
          </blockquote>
        );
      }
      
      if (line.startsWith('<div style="text-align: center;">') && line.endsWith('</div>')) {
        // Centered text
        const content = line.replace('<div style="text-align: center;">', '').replace('</div>', '');
        return (
          <div key={lineIndex} className="text-center my-2">
            {formatInlineText(content)}
          </div>
        );
      }
      
      if (line.startsWith('<div style="text-align: right;">') && line.endsWith('</div>')) {
        // Right-aligned text
        const content = line.replace('<div style="text-align: right;">', '').replace('</div>', '');
        return (
          <div key={lineIndex} className="text-right my-2">
            {formatInlineText(content)}
          </div>
        );
      }
      
      if (line.startsWith('<div style="text-align: justify;">') && line.endsWith('</div>')) {
        // Justified text
        const content = line.replace('<div style="text-align: justify;">', '').replace('</div>', '');
        return (
          <div key={lineIndex} className="text-justify my-2">
            {formatInlineText(content)}
          </div>
        );
      }
      
      if (line.startsWith('<div style="text-align: left;">') && line.endsWith('</div>')) {
        // Left-aligned text
        const content = line.replace('<div style="text-align: left;">', '').replace('</div>', '');
        return (
          <div key={lineIndex} className="text-left my-2">
            {formatInlineText(content)}
          </div>
        );
      }
      
      // Regular paragraph
      return (
        <p key={lineIndex} className="mb-2">
          {formatInlineText(line)}
        </p>
      );
    });
  };
  
  // Function to format inline text elements
  const formatInlineText = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    // Handle bold text (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (*text*)
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle underlined text (<u>text</u>)
    text = text.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
    
    // Handle inline code (`code`)
    text = text.replace(/`(.*?)`/g, '<code class="bg-dark-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Handle links [text](url)
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary-400 hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Split by HTML tags and create React elements
    const parts = text.split(/(<\/?[^>]+>)/);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      if (part.startsWith('<strong>') && part.endsWith('</strong>')) {
        const content = part.replace('<strong>', '').replace('</strong>', '');
        return <strong key={index} className="font-bold">{content}</strong>;
      }
      
      if (part.startsWith('<em>') && part.endsWith('</em>')) {
        const content = part.replace('<em>', '').replace('</em>', '');
        return <em key={index} className="italic">{content}</em>;
      }
      
      if (part.startsWith('<u>') && part.endsWith('</u>')) {
        const content = part.replace('<u>', '').replace('</u>', '');
        return <u key={index} className="underline">{content}</u>;
      }
      
      if (part.startsWith('<code') && part.endsWith('</code>')) {
        const content = part.replace(/<code[^>]*>/, '').replace('</code>', '');
        return <code key={index} className="bg-dark-800 px-1 py-0.5 rounded text-sm font-mono">{content}</code>;
      }
      
      if (part.startsWith('<a') && part.endsWith('</a>')) {
        const hrefMatch = part.match(/href="([^"]+)"/);
        const contentMatch = part.match(/>([^<]+)</);
        if (hrefMatch && contentMatch) {
          return (
            <a 
              key={index} 
              href={hrefMatch[1]} 
              className="text-primary-400 hover:text-primary-300 underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {contentMatch[1]}
            </a>
          );
        }
      }
      
      // Return plain text
      return part;
    }).filter(Boolean); // Remove any null values
  };

  try {
    return (
      <div className={`prose prose-invert max-w-none ${className}`}>
        {formatText(text)}
      </div>
    );
  } catch (error) {
    console.error('Error formatting text:', error);
    // Fallback to plain text if formatting fails
    return (
      <div className={className}>
        <p className="text-gray-400">{text}</p>
      </div>
    );
  }
};

export default FormattedText;
