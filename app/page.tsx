'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import FileTransfer from '@/components/FileTransfer';
import BottomNav from '@/components/BottomNav';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Beam</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Effortlessly share files of any size.<br />
              <span className="italic text-primary font-semibold">
              No limits, no cost coz this isnt costing me anything XD , Peer to Peer
              </span>
            </p>
          </div>

          {!selectedFile ? (
            <Card className="border-2 border-dashed p-12 hover:border-primary/50 transition-colors">
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium mb-1">
                      Choose a file to share
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click to browse or drag and drop
                    </p>
                  </div>
                </div>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </Card>
          ) : (
            <FileTransfer file={selectedFile} onReset={handleReset} />
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
