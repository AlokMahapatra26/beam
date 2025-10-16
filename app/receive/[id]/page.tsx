'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WebRTCFileTransfer, FileMetadata } from '@/lib/webrtc';
import { getSocket } from '@/lib/socket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

export default function ReceivePage() {
  const params = useParams();
  const roomId = params.id as string;
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'receiving' | 'complete'>('connecting');
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const transferRef = useRef<WebRTCFileTransfer | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && roomId) {
      initializedRef.current = true;
      initializeReceiver();
    }

    return () => {
      if (transferRef.current) {
        transferRef.current.destroy();
        transferRef.current = null;
      }
    };
  }, [roomId]);

  const initializeReceiver = async () => {
    try {
      const socket = getSocket();
      
      socket.emit('join-room', roomId);
      
      await new Promise<void>((resolve) => {
        socket.once('room-joined', ({ isInitiator, roomSize }) => {
          console.log('Room joined as receiver, room size:', roomSize);
          resolve();
        });
      });

      socket.emit('signal', { room: roomId, signal: null });

      await new Promise(resolve => setTimeout(resolve, 500));

      transferRef.current = new WebRTCFileTransfer(socket, roomId, false);
      
      transferRef.current.createReceiver(
        (meta) => {
          console.log('Metadata received:', meta);
          setMetadata(meta);
          setStatus('receiving');
        },
        (prog) => {
          setProgress(prog);
        },
        (blob) => {
          console.log('File received completely');
          setFileBlob(blob);
          setStatus('complete');
          toast({ title: 'Download ready!', description: 'File received successfully' });
        }
      );

    } catch (error) {
      console.error('Receiver initialization error:', error);
      toast.error("failed to connect")
    }
  };

  const handleDownload = () => {
    if (fileBlob && metadata) {
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Receive File</h1>
            <p className="text-muted-foreground">
              Waiting for file transfer
            </p>
          </div>

          <Card className="p-6">
            {status === 'connecting' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">Connecting to sender...</p>
              </div>
            )}

            {metadata && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">File</p>
                  <p className="font-medium truncate">{metadata.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(metadata.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {status === 'receiving' && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Receiving</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {status === 'complete' && (
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
