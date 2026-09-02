import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * ScannableBarcode Component
 * 
 * Renders an exact, scannable digital Code 128 barcode, Code 39 barcode, or 2D QR code.
 * Optimized for camera scanner recognition off digital computer displays and label print previews.
 */
export default function ScannableBarcode({
  value,
  type = 'CODE128', // 'CODE128', 'CODE39', 'QR', 'QR_CODE'
  size = 'md',      // 'sm' (table thumbnail), 'md', 'lg' (detail modal / preview)
  showText = true,
  className = '',
  style = {}
}) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const normalizedType = String(type || 'CODE128').toUpperCase().replace('_CODE', '');

  useEffect(() => {
    if (!value) return;

    if (normalizedType === 'CODE128' || normalizedType === '128') {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, String(value), {
            format: 'CODE128',
            width: isSmall ? 1.2 : (isLarge ? 2.0 : 1.8),
            height: isSmall ? 26 : (isLarge ? 80 : 45),
            displayValue: showText && !isSmall,
            fontSize: isLarge ? 16 : 12,
            font: 'monospace',
            fontOptions: 'bold',
            textMargin: 4,
            margin: isSmall ? 4 : 10,
            background: '#ffffff',
            lineColor: '#000000',
            valid: () => {}
          });
        } catch (err) {
          console.warn('[Barcode] JsBarcode CODE128 error:', err);
        }
      }
    } else if (normalizedType === 'CODE39' || normalizedType === '39') {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, String(value), {
            format: 'CODE39',
            width: isSmall ? 1.0 : (isLarge ? 1.6 : 1.4),
            height: isSmall ? 26 : (isLarge ? 80 : 45),
            displayValue: showText && !isSmall,
            fontSize: isLarge ? 15 : 12,
            font: 'monospace',
            fontOptions: 'bold',
            textMargin: 4,
            margin: isSmall ? 4 : 8,
            background: '#ffffff',
            lineColor: '#000000',
            valid: () => {}
          });
        } catch (err) {
          console.warn('[Barcode] JsBarcode CODE39 error:', err);
        }
      }
    } else {
      // Default: QR Code
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, String(value), {
          width: isSmall ? 44 : (isLarge ? 150 : 95),
          margin: isSmall ? 1 : 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        }, (err) => {
          if (err) console.warn('[Barcode] QR render error:', err);
        });
      }
    }
  }, [value, normalizedType, size, showText]);

  if (!value) return null;

  const isQr = normalizedType === 'QR';

  return (
    <div
      className={`scannable-barcode-container ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: isSmall ? '2px 4px' : '8px 12px',
        borderRadius: isSmall ? '4px' : '8px',
        border: '1px solid #e2e8f0',
        boxShadow: isSmall ? 'none' : '0 2px 6px rgba(0,0,0,0.06)',
        ...style
      }}
      title={`Scannable ${normalizedType}: ${value}`}
    >
      {isQr ? (
        <>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          {showText && !isSmall && (
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: isLarge ? '17px' : '13px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              color: '#0f172a',
              marginTop: '4px',
              textAlign: 'center'
            }}>
              {value}
            </div>
          )}
        </>
      ) : (
        <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
      )}
    </div>
  );
}
