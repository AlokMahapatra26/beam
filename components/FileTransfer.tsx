'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WebRTCFileTransfer } from '@/lib/webrtc';
import { getSocket } from '@/lib/socket';
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
  const transferRef = useRef<WebRTCFileTransfer | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const id = uuidv4();
      setRoomId(id);
      initializeTransfer(id);
    }

    return () => {
      if (transferRef.current) {
        transferRef.current.destroy();
        transferRef.current = null;
      }
    };
  }, []);

  const initializeTransfer = async (id: string) => {
    try {
      const socket = getSocket();
      
      console.log('🟢 Sender joining room:', id);
      socket.emit('join-room', id);
      
      await new Promise<void>((resolve) => {
        socket.once('room-joined', ({ isInitiator }) => {
          console.log('🟢 Sender room joined, isInitiator:', isInitiator);
          resolve();
        });
      });

      setShowShareModal(true);

      // Wait for receiver to join
      socket.once('peer-joined', async ({ peerId }) => {
        console.log('🟢 Receiver joined:', peerId);
        setStatus('connected');
        toast.success("reciever connected")
        
        // Wait a bit for receiver to be fully ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          console.log('🟢 Creating sender peer connection');
          transferRef.current = new WebRTCFileTransfer(socket, id, true);
          setStatus('transferring');
          
          await transferRef.current.createSender(file, (progress) => {
            setProgress(progress);
          });

          setStatus('complete');
          toast.success("transfer complete")
        } catch (error) {
          console.error('❌ Transfer error:', error);
          setStatus('waiting');
          toast.error("transfer failed")
        }
      });

    } catch (error) {
      console.error(' Initialization error:', error);
      toast.error("failed to initialise transfer")
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
            <div className="flex items-center gap-2">
              {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />}
              {status === 'connected' && <div className="w-2 h-2 rounded-full bg-green-500" />}
              {status === 'transferring' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              {status === 'complete' && <div className="w-2 h-2 rounded-full bg-green-500" />}
              <p className="font-medium capitalize">{status}</p>
            </div>
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
