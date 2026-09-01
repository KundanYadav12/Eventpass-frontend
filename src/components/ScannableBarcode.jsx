import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * ScannableBarcode Component
 * 
 * Renders an exact, scannable digital Code 128 barcode or QR code for pass codes.
 * Optimized for camera scanner recognition off digital computer displays.
 */
export default function ScannableBarcode({
  value,
  type = 'CODE128', // 'CODE128' or 'QR'
  size = 'md',      // 'sm' (table thumbnail), 'md', 'lg' (detail modal)
  showText = true,
  className = '',
  style = {}
}) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  useEffect(() => {
    if (!value) return;

    if (type === 'CODE128') {
      if (svgRef.current) {
        try {
          JsBarcode(svgRef.current, String(value), {
            format: 'CODE128',
            width: isSmall ? 1.2 : (isLarge ? 2.2 : 1.8),
            height: isSmall ? 26 : (isLarge ? 70 : 45),
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
          console.warn('[Barcode] JsBarcode render error:', err);
        }
      }
    } else if (type === 'QR') {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, String(value), {
          width: isSmall ? 40 : (isLarge ? 180 : 90),
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
  }, [value, type, size, showText]);

  if (!value) return null;

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
      title={`Scannable Code 128: ${value}`}
    >
      {type === 'CODE128' ? (
        <svg ref={svgRef} style={{ display: 'block', maxWidth: '100%' }} />
      ) : (
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      )}
    </div>
  );
}
