import React, { useState, useRef } from 'react'

const MarkdownEditor = ({ value = '', onChange, placeholder = '', disabled = false }) => {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef(null)

  // Insert text at cursor position
  const insertAtCursor = (beforeText, afterText = '') => {
    if (!textareaRef.current || disabled) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = 
      value.substring(0, start) + 
      beforeText + 
      selectedText + 
      afterText + 
      value.substring(end)

    onChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + beforeText.length,
        start + beforeText.length + selectedText.length
      )
    }, 0)
  }

  // Toolbar buttons
  const toolbarButtons = [
    {
      label: 'Bold',
      icon: '𝐁',
      action: () => insertAtCursor('**', '**'),
      shortcut: 'Ctrl+B'
    },
    {
      label: 'Italic', 
      icon: '𝐼',
      action: () => insertAtCursor('*', '*'),
      shortcut: 'Ctrl+I'
    },
    {
      label: 'Header 1',
      icon: 'H₁',
      action: () => insertAtCursor('# ', ''),
    },
    {
      label: 'Header 2',
      icon: 'H₂', 
      action: () => insertAtCursor('## ', ''),
    },
    {
      label: 'Header 3',
      icon: 'H₃',
      action: () => insertAtCursor('### ', ''),
    },
    {
      label: 'Link',
      icon: '🔗',
      action: () => insertAtCursor('[', '](url)'),
    },
    {
      label: 'Image',
      icon: '🖼️',
      action: () => insertAtCursor('![alt text](', ')'),
    },
    {
      label: 'Code',
      icon: '</>', 
      action: () => insertAtCursor('`', '`'),
    },
    {
      label: 'Code Block',
      icon: '{ }',
      action: () => insertAtCursor('\n```\n', '\n```\n'),
    },
    {
      label: 'Bullet List',
      icon: '• ',
      action: () => insertAtCursor('- ', ''),
    },
    {
      label: 'Numbered List',
      icon: '1.',
      action: () => insertAtCursor('1. ', ''),
    },
    {
      label: 'Quote',
      icon: '❝',
      action: () => insertAtCursor('> ', ''),
    }
  ]

  // Simple markdown to HTML conversion for preview
  const markdownToHtml = (markdown) => {
    if (!markdown || typeof markdown !== 'string') return ''
    
    // Prevent XSS by escaping HTML first, then applying markdown
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
    
    // Now apply markdown formatting
    html = html
      // Code blocks (handle before inline code)
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-3 rounded border overflow-x-auto"><code>$1</code></pre>')
      // Headers (in order of specificity)
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>')
      // Bold and italic (handle bold first)
      .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Images (before links)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto rounded border my-2 shadow-sm" loading="lazy" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/gim, '<a href="$2" class="text-primary-600 underline hover:text-primary-800" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists (numbered and bullet)
      .replace(/^\d+\. (.*)$/gim, '<li class="ml-6 mb-1">$1</li>')
      .replace(/^- (.*)$/gim, '<li class="ml-6 mb-1">$1</li>')
      // Quotes
      .replace(/^> (.*)$/gim, '<blockquote class="border-l-4 border-primary-300 pl-4 italic text-gray-700 my-2 bg-gray-50 py-2 rounded-r">$1</blockquote>')
      // Line breaks (double newlines become paragraphs, single become breaks)
      .replace(/\n\n/gim, '</p><p class="mb-2">')
      .replace(/\n/gim, '<br>')

    // Wrap content in paragraph tags
    html = '<p class="mb-2">' + html + '</p>'
    
    // Clean up empty paragraphs
    html = html.replace(/<p[^>]*><\/p>/g, '')
    
    // Wrap consecutive list items in ul/ol tags
    html = html.replace(/(<li class="ml-6 mb-1"[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      if (match.includes('1.')) {
        return '<ol class="list-decimal ml-4 mb-3">' + match.replace(/class="ml-6 mb-1"/g, 'class="mb-1"') + '</ol>'
      } else {
        return '<ul class="list-disc ml-4 mb-3">' + match.replace(/class="ml-6 mb-1"/g, 'class="mb-1"') + '</ul>'
      }
    })
    
    return html
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (disabled) return

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertAtCursor('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertAtCursor('*', '*')
          break
        default:
          break
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="border border-gray-200 rounded-t-lg bg-gray-50 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              disabled={disabled}
              className="px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
            >
              {button.icon}
            </button>
          ))}
          
          <div className="flex-1"></div>
          
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            disabled={disabled}
            className={`px-3 py-1 text-sm border rounded transition-colors ${
              showPreview
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-white border-gray-200 hover:bg-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showPreview ? '📝 Edit' : '👁️ Preview'}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative">
        {showPreview ? (
          /* Preview */
          <div className="border border-gray-200 rounded-b-lg p-4 min-h-[200px] bg-white">
            {value ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(value) }}
              />
            ) : (
              <div className="text-gray-400 italic">
                No content to preview. Switch to edit mode to add content.
              </div>
            )}
          </div>
        ) : (
          /* Editor */
          <textarea
            ref={textareaRef}
            className="input-field rounded-t-none min-h-[200px] resize-y font-mono text-sm"
            placeholder={placeholder || "Enter markdown content...\n\n**Bold text**\n*Italic text*\n# Header\n- List item\n[Link](url)\n![Image](url)"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={8}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-2 bg-gray-50 p-3 rounded-lg">
        <div>
          <strong>📝 Markdown Formatting:</strong> **bold**, *italic*, # headers, [links](url), ![images](url), `code`, ```code blocks```, lists, > quotes
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <span>💡 <strong>Shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic)</span>
          <span>📹 <strong>Videos:</strong> Use Video URL field above (not here)</span>
        </div>
        <div className="text-yellow-600">
          ⚠️ <strong>Security:</strong> HTML tags are escaped for safety. Use Markdown syntax for formatting.
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor