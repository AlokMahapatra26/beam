'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
}

export default function ShareModal({ open, onClose, url }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    if (url) {
      QRCode.toDataURL(url, { width: 256 }).then(setQrCode);
    }
  }, [url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          <div className="flex gap-2">
            <Input value={url} readOnly />
            <Button onClick={handleCopy} size="icon">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
