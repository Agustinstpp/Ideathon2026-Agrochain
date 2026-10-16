'use client';

import React from 'react';
import { QRCode } from './QRCode';

interface PassportQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotId: string;
}

export const PassportQrModal: React.FC<PassportQrModalProps> = ({ isOpen, onClose, lotId }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '380px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ef4444',
            color: '#ffffff',
            border: '2px solid #ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          ✕
        </button>

        <QRCode
          value={typeof window !== 'undefined' ? window.location.href : ''}
          lotId={lotId}
          title={`Pasaporte Lote ${lotId}`}
          size={220}
        />
      </div>
    </div>
  );
};
