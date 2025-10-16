'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WebRTCFileTransfer, FileMetadata } from '@/lib/webrtc';
import { getSocket } from '@/lib/socket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';

export default function ReceivePage() {
  const params = useParams();
  const roomId = params.id as string;
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'waiting-sender' | 'receiving' | 'complete'>('connecting');
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
      
      console.log('🔵 Receiver joining room:', roomId);
      socket.emit('join-room', roomId);
      
      // Wait for room join confirmation
      const roomInfo = await new Promise<{ isInitiator: boolean, roomSize: number }>((resolve) => {
        socket.once('room-joined', (info) => {
          console.log('🔵 Receiver room joined:', info);
          resolve(info);
        });
      });

      // If room is empty (sender not joined yet), wait
      if (roomInfo.roomSize === 1) {
        console.log('🔵 Waiting for sender to join...');
        setStatus('waiting-sender');
        toast.success("")
        
        // Wait for sender to join
        await new Promise<void>((resolve) => {
          socket.once('peer-joined', () => {
            console.log('🔵 Sender has joined!');
            resolve();
          });
        });
      }

      console.log('🔵 Both peers in room, establishing connection...');
      setStatus('connecting');

      // Notify sender that receiver is ready
      socket.emit('receiver-ready', roomId);

      // Small delay to ensure sender is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create receiver peer connection
      transferRef.current = new WebRTCFileTransfer(socket, roomId, false);
      
      transferRef.current.createReceiver(
        (meta) => {
          console.log('🔵 Metadata received:', meta);
          setMetadata(meta);
          setStatus('receiving');
          toast.success("getting files")
        },
        (prog) => {
          setProgress(prog);
        },
        (blob) => {
          console.log('🔵 File received completely');
          setFileBlob(blob);
          setStatus('complete');
          toast.success("download ready")
        }
      );

    } catch (error) {
      console.error('❌ Receiver initialization error:', error);
      toast.error("connection failed")
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
              {status === 'waiting-sender' && 'Waiting for sender to join...'}
              {status === 'connecting' && 'Connecting to sender...'}
              {status === 'receiving' && 'Receiving file...'}
              {status === 'complete' && 'File received!'}
            </p>
          </div>

          <Card className="p-6">
            {(status === 'connecting' || status === 'waiting-sender') && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">
                  {status === 'waiting-sender' ? 'Waiting for sender...' : 'Connecting to sender...'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few moments
                </p>
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
