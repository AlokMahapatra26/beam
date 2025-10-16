import { Card } from '@/components/ui/card';
import { Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  return (
    <>
      <main className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">About</h1>

          <Card className="p-6 mb-4">
            <h2 className="text-xl font-semibold mb-2">Beam</h2>
            <p className="text-muted-foreground mb-4">
              A peer-to-peer file sharing application that transfers files directly
              between devices without storing them on any server.
            </p>
            
          </Card>

          

          <Card className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Support
            </h3>
            <p className="text-sm text-muted-foreground">
              If you find this project helpful, consider starring it on GitHub!
            </p>
          </Card>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
