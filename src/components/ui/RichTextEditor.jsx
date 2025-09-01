import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Quote,
  Code,
  Link,
  Unlink,
  Undo,
  Redo
} from 'lucide-react';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start typing...", 
  rows = 4,
  className = "",
  error = false,
  disabled = false
}) => {
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textareaRef = useRef(null);
  const [history, setHistory] = useState([{ text: value || '', selection: { start: 0, end: 0 } }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Ensure value is always a string
  const safeValue = typeof value === 'string' ? value : '';

  useEffect(() => {
    if (safeValue !== history[historyIndex]?.text) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ text: safeValue, selection: { start: 0, end: 0 } });
      if (newHistory.length > 50) newHistory.shift(); // Limit history to 50 entries
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [safeValue, historyIndex]);

  const saveSelection = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      setSelection({ start: selectionStart, end: selectionEnd });
    }
  };

  const restoreSelection = () => {
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(selection.start, selection.end);
      textareaRef.current.focus();
    }
  };

  const addToHistory = (newText) => {
    if (typeof newText !== 'string') return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText, selection });
    if (newHistory.length > 50) newHistory.shift(); // Limit history to 50 entries
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const applyFormat = (format) => {
    if (!textareaRef.current) return;
    
    try {
      const { selectionStart, selectionEnd } = textareaRef.current;
      const text = textareaRef.current.value || '';
      const selectedText = text.substring(selectionStart, selectionEnd);
      
      let newText = text;
      let newSelectionStart = selectionStart;
      let newSelectionEnd = selectionEnd;
      
      switch (format) {
        case 'bold':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `**${selectedText}**` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 2;
            newSelectionEnd = selectionEnd + 2;
          } else {
            newText = text.substring(0, selectionStart) + '**bold text**' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 2;
            newSelectionEnd = selectionStart + 11;
          }
          break;
          
        case 'italic':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `*${selectedText}*` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 1;
            newSelectionEnd = selectionEnd + 1;
          } else {
            newText = text.substring(0, selectionStart) + '*italic text*' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 1;
            newSelectionEnd = selectionStart + 12;
          }
          break;
        
        case 'underline':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `<u>${selectedText}</u>` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 3;
            newSelectionEnd = selectionEnd + 3;
          } else {
            newText = text.substring(0, selectionStart) + '<u>underlined text</u>' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 3;
            newSelectionEnd = selectionStart + 18;
          }
          break;
        
        case 'bullet':
          if (selectedText) {
            const lines = selectedText.split('\n');
            const bulletedLines = lines.map(line => line.trim() ? `• ${line}` : line);
            newText = text.substring(0, selectionStart) + bulletedLines.join('\n') + text.substring(selectionEnd);
            newSelectionStart = selectionStart;
            newSelectionEnd = selectionStart + bulletedLines.join('\n').length;
          } else {
            newText = text.substring(0, selectionStart) + '• ' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 2;
            newSelectionEnd = selectionStart + 2;
          }
          break;
        
        case 'numbered':
          if (selectedText) {
            const lines = selectedText.split('\n');
            const numberedLines = lines.map((line, index) => line.trim() ? `${index + 1}. ${line}` : line);
            newText = text.substring(0, selectionStart) + numberedLines.join('\n') + text.substring(selectionEnd);
            newSelectionStart = selectionStart;
            newSelectionEnd = selectionStart + numberedLines.join('\n').length;
          } else {
            newText = text.substring(0, selectionStart) + '1. ' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 3;
            newSelectionEnd = selectionStart + 3;
          }
          break;
        
        case 'quote':
          if (selectedText) {
            const lines = selectedText.split('\n');
            const quotedLines = lines.map(line => line.trim() ? `> ${line}` : line);
            newText = text.substring(0, selectionStart) + quotedLines.join('\n') + text.substring(selectionEnd);
            newSelectionStart = selectionStart;
            newSelectionEnd = selectionStart + quotedLines.join('\n').length;
          } else {
            newText = text.substring(0, selectionStart) + '> ' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 2;
            newSelectionEnd = selectionStart + 2;
          }
          break;
        
        case 'code':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `\`${selectedText}\`` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 1;
            newSelectionEnd = selectionEnd + 1;
          } else {
            newText = text.substring(0, selectionStart) + '`code`' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 1;
            newSelectionEnd = selectionStart + 5;
          }
          break;
        
        case 'link':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `[${selectedText}](url)` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + selectedText.length + 3;
            newSelectionEnd = selectionStart + selectedText.length + 6;
          } else {
            newText = text.substring(0, selectionStart) + '[link text](url)' + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 10;
            newSelectionEnd = selectionStart + 13;
          }
          break;
        
        case 'align-left':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `<div style="text-align: left;">${selectedText}</div>` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 28;
            newSelectionEnd = selectionStart + 28 + selectedText.length;
          }
          break;
        
        case 'align-center':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `<div style="text-align: center;">${selectedText}</div>` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 30;
            newSelectionEnd = selectionStart + 30 + selectedText.length;
          }
          break;
        
        case 'align-right':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `<div style="text-align: right;">${selectedText}</div>` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 29;
            newSelectionEnd = selectionStart + 29 + selectedText.length;
          }
          break;
        
        case 'align-justify':
          if (selectedText) {
            newText = text.substring(0, selectionStart) + `<div style="text-align: justify;">${selectedText}</div>` + text.substring(selectionEnd);
            newSelectionStart = selectionStart + 31;
            newSelectionEnd = selectionStart + 31 + selectedText.length;
          }
          break;
      }
      
      onChange(newText);
      addToHistory(newText);
      
      // Restore selection after a brief delay to allow React to update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newSelectionStart, newSelectionEnd);
          textareaRef.current.focus();
        }
      }, 10);
    } catch (e) {
      console.error("Error applying format:", e);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex].text);
      setSelection(history[newIndex].selection);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex].text);
      setSelection(history[newIndex].selection);
    }
  };

  const handleChange = (e) => {
    try {
      const value = e.target.value;
      if (typeof value === 'string') {
        onChange(value);
      }
    } catch (error) {
      console.error('Error in handleChange:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newValue = e.target.value.substring(0, selectionStart) + '  ' + e.target.value.substring(selectionEnd);
      onChange(newValue);
      setTimeout(() => {
        e.target.setSelectionRange(selectionStart + 2, selectionStart + 2);
      }, 10);
    }
  };

  const ToolbarButton = ({ onClick, icon: Icon, title, disabled: btnDisabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={btnDisabled || disabled}
      title={title}
      className={`p-2 rounded hover:bg-dark-700 transition-colors ${
        btnDisabled || disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-dark-800 border border-dark-700 rounded-t-lg">
        <div className="flex items-center space-x-1">
          {/* Text Formatting */}
          <ToolbarButton onClick={() => applyFormat('bold')} icon={Bold} title="Bold (Ctrl+B)" />
          <ToolbarButton onClick={() => applyFormat('italic')} icon={Italic} title="Italic (Ctrl+I)" />
          <ToolbarButton onClick={() => applyFormat('underline')} icon={Underline} title="Underline (Ctrl+U)" />
          
          <div className="w-px h-6 bg-dark-600 mx-2" />
          
          {/* Lists */}
          <ToolbarButton onClick={() => applyFormat('bullet')} icon={List} title="Bullet List" />
          <ToolbarButton onClick={() => applyFormat('numbered')} icon={ListOrdered} title="Numbered List" />
          
          <div className="w-px h-6 bg-dark-600 mx-2" />
          
          {/* Alignment */}
          <ToolbarButton onClick={() => applyFormat('align-left')} icon={AlignLeft} title="Align Left" />
          <ToolbarButton onClick={() => applyFormat('align-center')} icon={AlignCenter} title="Align Center" />
          <ToolbarButton onClick={() => applyFormat('align-right')} icon={AlignRight} title="Align Right" />
          <ToolbarButton onClick={() => applyFormat('align-justify')} icon={AlignJustify} title="Justify" />
          
          <div className="w-px h-6 bg-dark-600 mx-2" />
          
          {/* Special Formatting */}
          <ToolbarButton onClick={() => applyFormat('quote')} icon={Quote} title="Quote" />
          <ToolbarButton onClick={() => applyFormat('code')} icon={Code} title="Inline Code" />
          <ToolbarButton onClick={() => applyFormat('link')} icon={Link} title="Insert Link" />
        </div>
        
        {/* History Controls */}
        <div className="flex items-center space-x-1">
          <ToolbarButton 
            onClick={undo} 
            icon={Undo} 
            title="Undo (Ctrl+Z)" 
            disabled={historyIndex <= 0} 
          />
          <ToolbarButton 
            onClick={redo} 
            icon={Redo} 
            title="Redo (Ctrl+Y)" 
            disabled={historyIndex >= history.length - 1} 
          />
        </div>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={safeValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={saveSelection}
        onFocus={saveSelection}
        onBlur={saveSelection}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={`input-primary rounded-t-none resize-none w-full ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      
      {/* Help Text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Use the toolbar above to format your text. You can also use Markdown syntax:</p>
        <p className="mt-1">
          <code className="bg-dark-800 px-1 py-0.5 rounded">**bold**</code>,{' '}
          <code className="bg-dark-800 px-1 py-0.5 rounded">*italic*</code>,{' '}
          <code className="bg-dark-800 px-1 py-0.5 rounded">• bullets</code>,{' '}
          <code className="bg-dark-800 px-1 py-0.5 rounded">1. numbers</code>
        </p>
      </div>
    </div>
  );
};

export default RichTextEditor;
