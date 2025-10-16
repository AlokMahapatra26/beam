'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WebRTCFileTransfer } from '@/lib/webrtc';
import { getSocket, joinRoom } from '@/lib/socket';
import ShareModal from './ShareModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Props {
  file: File;
  onReset: () => void;
}

export default function FileTransfer({ file, onReset }: Props) {
  const [roomId, setRoomId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'connected' | 'transferring' | 'complete'>('waiting');
  const [showShareModal, setShowShareModal] = useState(false);
  

  useEffect(() => {
    const id = uuidv4();
    setRoomId(id);
    initializeTransfer(id);
  }, [file]);

  const initializeTransfer = async (id: string) => {
    try {
      const socket = getSocket();
      await joinRoom(id);
      setShowShareModal(true);

      socket.on('peer-joined', async () => {
        setStatus('connected');
        toast.success("peer connected , started transferring ")
        
        const transfer = new WebRTCFileTransfer(socket, id);
        setStatus('transferring');
        
        await transfer.createSender(file, (progress) => {
          setProgress(progress);
        });

        setStatus('complete');
        toast.success("transfer complete")
      });
    } catch (error) {
      toast.error("failed to initialized transfer")
    }
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/receive/${roomId}` 
    : '';

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">File</p>
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <p className="font-medium capitalize">{status}</p>
          </div>

          {status === 'transferring' && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowShareModal(true)} 
              disabled={status === 'complete'}
              className="flex-1"
            >
              Share Link
            </Button>
            <Button onClick={onReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={shareUrl}
      />
    </>
  );
}
