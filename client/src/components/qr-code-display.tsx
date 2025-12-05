import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  status?: string;
}

export default function QRCodeDisplay({ value, size = 280, status = "pending" }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const generateQR = async () => {
      try {
        const QRCode = await import("qrcode");
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        setLoaded(true);
        setError(false);
      } catch (err) {
        console.error("QR Code generation failed:", err);
        setError(true);
      }
    };

    generateQR();
  }, [value, size]);

  const isPaid = status === "completed" || status === "processing";

  return (
    <div className="relative flex items-center justify-center">
      <div 
        className={`
          relative p-4 rounded-xl bg-white transition-all duration-500
          ${status === "pending" ? "animate-pulse-border" : ""}
          ${isPaid ? "opacity-50" : ""}
        `}
        style={{
          boxShadow: status === "pending" 
            ? "0 0 0 3px rgba(59, 130, 246, 0.3)" 
            : "none",
        }}
      >
        <canvas 
          ref={canvasRef} 
          className="rounded-lg"
          style={{ 
            width: size, 
            height: size,
            display: loaded && !error ? "block" : "none" 
          }}
          data-testid="qr-code-canvas"
        />
        
        {!loaded && !error && (
          <div 
            className="bg-muted animate-pulse rounded-lg"
            style={{ width: size, height: size }}
          />
        )}

        {error && (
          <div 
            className="bg-muted rounded-lg flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-muted-foreground text-sm">QR Error</span>
          </div>
        )}
      </div>

      {isPaid && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="p-4 rounded-full bg-green-500 animate-scale-in">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.1);
          }
        }
        
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
