import SimplePeer from 'simple-peer';
import { Socket } from 'socket.io-client';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export class WebRTCFileTransfer {
  private peer: SimplePeer.Instance | null = null;
  private socket: Socket;
  private roomId: string;

  constructor(socket: Socket, roomId: string) {
    this.socket = socket;
    this.roomId = roomId;
  }

  createSender(file: File, onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.peer = new SimplePeer({
        initiator: true,
        trickle: false,
      });

      this.peer.on('signal', (data) => {
        this.socket.emit('signal', { room: this.roomId, signal: data });
      });

      this.peer.on('connect', () => {
        const metadata: FileMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
        };
        
        this.peer!.send(JSON.stringify({ type: 'metadata', data: metadata }));
        this.sendFileInChunks(file, onProgress, resolve, reject);
      });

      this.peer.on('error', (err) => reject(err));

      this.socket.on('signal', ({ signal }) => {
        this.peer?.signal(signal);
      });
    });
  }

  createReceiver(
    onMetadata: (metadata: FileMetadata) => void,
    onProgress: (progress: number) => void,
    onComplete: (blob: Blob) => void
  ): void {
    this.peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    let chunks: Uint8Array[] = [];
    let receivedSize = 0;
    let totalSize = 0;
    let metadata: FileMetadata | null = null;

    this.peer.on('signal', (data) => {
      this.socket.emit('signal', { room: this.roomId, signal: data });
    });

    this.peer.on('data', (data) => {
      const message = this.parseData(data);

      if (message.type === 'metadata') {
        metadata = message.data;
        if (metadata) {
          totalSize = metadata.size;
          onMetadata(metadata);
        }
      } else if (message.type === 'chunk') {
        const chunk = new Uint8Array(message.data);
        chunks.push(chunk);
        receivedSize += chunk.length;
        onProgress((receivedSize / totalSize) * 100);
      } else if (message.type === 'done') {
        const blob = new Blob(chunks, { type: metadata?.type });
        onComplete(blob);
      }
    });

    this.socket.on('signal', ({ signal }) => {
      this.peer?.signal(signal);
    });
  }

  private sendFileInChunks(
    file: File,
    onProgress: (progress: number) => void,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    const chunkSize = 16384; // 16KB chunks
    let offset = 0;

    const readSlice = () => {
      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target?.result) {
          const chunk = new Uint8Array(e.target.result as ArrayBuffer);
          this.peer!.send(JSON.stringify({ type: 'chunk', data: Array.from(chunk) }));

          offset += chunk.length;
          onProgress((offset / file.size) * 100);

          if (offset < file.size) {
            readSlice();
          } else {
            this.peer!.send(JSON.stringify({ type: 'done' }));
            resolve();
          }
        }
      };

      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsArrayBuffer(slice);
    };

    readSlice();
  }

  private parseData(data: any): any {
    try {
      return JSON.parse(data.toString());
    } catch {
      return data;
    }
  }

  destroy(): void {
    this.peer?.destroy();
    this.socket.off('signal');
  }
}
