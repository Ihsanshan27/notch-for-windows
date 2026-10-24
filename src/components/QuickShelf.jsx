import React, { useState } from 'react';
import { FileText, Image, Trash2, X, FolderUp } from 'lucide-react';

export default function QuickShelf({ onClose }) {
  const [shelfFiles, setShelfFiles] = useState([
    { id: 1, name: 'screenshot_design.png', size: '1.2 MB', type: 'image' },
  ]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((f, i) => ({
        id: Date.now() + i,
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        type: f.type.includes('image') ? 'image' : 'file',
      }));
      setShelfFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id) => {
    setShelfFiles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px 8px',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        className="control-btn"
        onClick={onClose}
        style={{ position: 'absolute', top: '4px', right: '4px', padding: '4px' }}
      >
        <X size={13} color="#86868b" />
      </button>

      {shelfFiles.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: isDragOver ? '#64d2ff' : '#86868b',
            fontSize: '11px',
            fontWeight: '600',
          }}
        >
          <FolderUp size={16} />
          <span>Tarik & lepas file di sini untuk Quick Shelf</span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            width: '100%',
            padding: '2px 4px',
          }}
        >
          {shelfFiles.map((file) => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#f5f5f7',
                whiteSpace: 'nowrap',
              }}
            >
              {file.type === 'image' ? (
                <Image size={13} color="#64d2ff" />
              ) : (
                <FileText size={13} color="#ffd60a" />
              )}
              <span
                style={{
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: '500',
                }}
              >
                {file.name}
              </span>
              <span style={{ fontSize: '9px', color: '#86868b' }}>({file.size})</span>
              <button
                className="control-btn"
                onClick={() => removeFile(file.id)}
                style={{ padding: '2px' }}
              >
                <Trash2 size={11} color="#ff453a" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
