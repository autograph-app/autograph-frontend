'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Users, 
  Sparkles, 
  Trash2, 
  CheckCircle, 
  Clock, 
  LogOut, 
  User, 
  Play, 
  Image as ImageIcon,
  Check,
  Download,
  Loader2
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QueueItem {
  connectionId: string;
  userId: string;
  displayName: string;
}

interface StrokeData {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  size: number;
}

interface TemplateAsset {
  id: string;
  name: string;
  description: string;
  url: string;
}

const TEMPLATE_ASSETS: TemplateAsset[] = [
  {
    id: 'ticket',
    name: 'VIP Concert Ticket',
    description: 'A premium backstage concert pass overlay',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'vinyl',
    name: 'Limited Vinyl Cover',
    description: 'Retro 12" vinyl album cardboard sleeve',
    url: 'https://images.unsplash.com/photo-1539625319135-8d6fcf4a307e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'poster',
    name: 'Autograph Poster',
    description: 'Promo band photo poster print background',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop',
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LiveCampaignRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  const campaignId = (params?.id as string) || 'default-session';
  const isArtist = user?.accountType === 1;

  // SignalR connection in ref to prevent react-hooks/set-state-in-effect warnings
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  
  // Hub state
  const [connected, setConnected] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeFan, setActiveFan] = useState<QueueItem | null>(null);
  const [viewerCount, setViewerCount] = useState(12);

  // local drawing & canvas options
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#EC4899'); // Fuchsia
  const [brushSize, setBrushSize] = useState(4);
  const [selectedAsset, setSelectedAsset] = useState<TemplateAsset>(TEMPLATE_ASSETS[0]);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signedResult, setSignedResult] = useState<{ contentId: string, url: string } | null>(null);

  // Drawing coordinate refs for throttle/smoothness
  const lastX = useRef(0);
  const lastY = useRef(0);

  // Helper: Draw background template image
  const drawBackgroundTemplate = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedAsset.url;
    img.onload = () => {
      // Draw background keeping cover aspect
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = height * imgRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / imgRatio;
        offsetY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Add a dark overlay to make signatures stand out
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, height);

      // Add some subtle border framing inside canvas
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    };
  }, [selectedAsset]);

  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundTemplate(ctx, canvas.width, canvas.height);
  }, [drawBackgroundTemplate]);

  const drawStrokeOnCanvas = useCallback((stroke: StrokeData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(stroke.x0 * canvas.width, stroke.y0 * canvas.height);
    ctx.lineTo(stroke.x1 * canvas.width, stroke.y1 * canvas.height);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  // Connection setup
  useEffect(() => {
    if (!token) {
      toast.error('Authentication required.');
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5036';
    const hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/live-campaign`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    hubConnection.on('QueueUpdated', (updatedQueue: QueueItem[]) => {
      setQueue(updatedQueue);
    });

    hubConnection.on('ActiveFanChanged', (newActiveFan: QueueItem | null) => {
      setActiveFan(newActiveFan);
      // Clear canvas when active fan changes
      clearLocalCanvas();
      setSignedResult(null);
    });

    hubConnection.on('ReceiveDrawStroke', (strokeData: StrokeData) => {
      // Draw stroke received from the artist if caller is not the artist
      if (!isArtist) {
        drawStrokeOnCanvas(strokeData);
      }
    });

    hubConnection.on('CanvasCleared', () => {
      if (!isArtist) {
        clearLocalCanvas();
      }
    });

    hubConnection.on('SignatureCompleted', (contentId: string, watermarkUrl: string) => {
      setSignedResult({ contentId, url: watermarkUrl });
      toast.success('Your digital autograph is complete!');
    });

    hubConnection.start()
      .then(() => {
        setConnected(true);
        hubConnection.invoke('JoinCampaign', campaignId);
        // Randomize mock viewer count
        setViewerCount(Math.floor(Math.random() * 20) + 15);
      })
      .catch(() => {
        toast.error('Failed to establish real-time socket connection.');
      });

    connectionRef.current = hubConnection;

    return () => {
      if (hubConnection) {
        hubConnection.invoke('LeaveCampaign', campaignId);
        hubConnection.stop();
      }
    };
  }, [campaignId, token, isArtist, clearLocalCanvas, drawStrokeOnCanvas, router]);

  // Adjust canvas size based on container aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      // Set display dimensions
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      // Set coordinate space dimensions
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Re-draw background image
      clearLocalCanvas();
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial size
    setTimeout(handleResize, 100);

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedAsset, clearLocalCanvas]);

  const getEventCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Local drawing triggers (only for Artist)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isArtist) return;
    if (!activeFan) {
      toast.warning('No fan selected. Click "Next Fan" to start signing.');
      return;
    }
    
    setIsDrawing(true);
    const coords = getEventCoordinates(e);
    lastX.current = coords.x;
    lastY.current = coords.y;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isArtist || !activeFan) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getEventCoordinates(e);
    const strokeData: StrokeData = {
      x0: lastX.current / canvas.width,
      y0: lastY.current / canvas.height,
      x1: coords.x / canvas.width,
      y1: coords.y / canvas.height,
      color: brushColor,
      size: brushSize
    };

    // Draw locally immediately
    drawStrokeOnCanvas(strokeData);

    // Send stroke data to hub
    if (connectionRef.current && connected) {
      connectionRef.current.invoke('SendDrawStroke', campaignId, strokeData);
    }

    lastX.current = coords.x;
    lastY.current = coords.y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Artist Action: Clear Board
  const handleClear = () => {
    if (!isArtist) return;
    clearLocalCanvas();
    if (connectionRef.current && connected) {
      connectionRef.current.invoke('ClearCanvas', campaignId);
    }
  };

  // Artist Action: Next Fan
  const handleNextFan = async () => {
    if (!isArtist) return;
    if (connectionRef.current && connected) {
      try {
        await connectionRef.current.invoke('NextParticipant', campaignId);
      } catch {
        toast.error('Failed to trigger next participant.');
      }
    }
  };

  // Artist Action: Complete Signature (simulated database saving & pdf triggering)
  const handleCompleteSignature = async () => {
    if (!isArtist || !activeFan) return;
    
    setIsSaving(true);
    toast.loading('Processing digital signature...');

    try {
      // Simulate backend async processing & certificate generation
      await delay(2500);

      const mockContentId = 'sig-' + Math.random().toString(36).substr(2, 9);
      // Stamped result image is simulated as a static URL
      const mockResultUrl = selectedAsset.url;

      if (connectionRef.current && connected) {
        await connectionRef.current.invoke('CompleteSignature', campaignId, mockContentId, mockResultUrl);
      }
      
      toast.dismiss();
      toast.success('Signature successfully completed and certificate created!');
      clearLocalCanvas();
    } catch {
      toast.dismiss();
      toast.error('Failed to finalize signature request.');
    } finally {
      setIsSaving(false);
    }
  };

  // Fan Action: Join Queue
  const handleJoinQueue = async () => {
    if (isArtist) return;
    setJoiningQueue(true);

    try {
      if (connectionRef.current && connected) {
        await connectionRef.current.invoke('JoinQueue', campaignId, user?.displayName || user?.userName || 'Fan');
        toast.success('You have successfully joined the live signature queue!');
      }
    } catch {
      toast.error('Failed to join queue.');
    } finally {
      setJoiningQueue(false);
    }
  };

  // Fan Action: Leave Queue
  const handleLeaveQueue = async () => {
    if (isArtist) return;
    try {
      if (connectionRef.current && connected) {
        await connectionRef.current.invoke('LeaveQueue', campaignId);
        toast.success('Left the signature queue.');
      }
    } catch {
      toast.error('Failed to leave queue.');
    }
  };

  // Check queue position
  const queueIndex = queue.findIndex(q => q.userId === user?.id);
  const isInQueue = queueIndex !== -1;
  const isActiveFan = activeFan?.userId === user?.id;

  return (
    <div className="space-y-6">
      {/* Live Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-violet-950/40 via-zinc-950 to-fuchsia-950/20 p-6 md:p-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[10px] tracking-widest font-extrabold uppercase mb-1">
              Live
            </Badge>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {isArtist ? 'Artist Live Drawing Panel' : 'Artist Live Autograph Session'}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Draw live signatures or queue up to receive yours verified in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-300 font-bold text-sm bg-black/40 border border-white/5 px-4 py-2 rounded-xl">
            <Users className="h-4 w-4 text-violet-400" />
            <span>{viewerCount} Viewing</span>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/feed')}
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 font-semibold text-xs border border-white/5 hover:bg-white/5 rounded-xl cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Exit Room
          </Button>
        </div>
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Canvas Board */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-bold text-zinc-300">Selected Asset Template: {selectedAsset.name}</span>
            </div>

            {isArtist && !activeFan && (
              <div className="flex items-center gap-1">
                {TEMPLATE_ASSETS.map(asset => (
                  <Button 
                    key={asset.id} 
                    variant="ghost"
                    onClick={() => setSelectedAsset(asset)}
                    className={`h-7 text-[10px] px-2 rounded-lg cursor-pointer ${
                      selectedAsset.id === asset.id ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {asset.name.split(' ')[1] || asset.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div 
            ref={containerRef}
            className="relative aspect-[4/3] w-full bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center group"
          >
            <canvas 
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`absolute inset-0 block ${isArtist && activeFan ? 'cursor-crosshair touch-none' : 'cursor-default pointer-events-none'}`}
            />

            {!isArtist && !activeFan && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
                <Clock className="h-10 w-10 text-zinc-600 mb-2 animate-bounce" />
                <h3 className="text-white font-bold">Waiting for Artist to start signing...</h3>
                <p className="text-zinc-500 text-xs max-w-sm mt-1">
                  Once a fan is called, the artist will draw their signature live on this canvas.
                </p>
              </div>
            )}

            {isArtist && !activeFan && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                <Play className="h-12 w-12 text-violet-400 mb-2" />
                <h3 className="text-white font-bold">Autograph Board Idle</h3>
                <p className="text-zinc-400 text-xs max-w-sm mt-1 mb-4">
                  Please call the next fan from the queue on the right to load their signing template.
                </p>
                <Button 
                  onClick={handleNextFan}
                  disabled={queue.length === 0}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl px-6 py-5 shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  {queue.length === 0 ? 'Queue is Empty' : 'Call Next Fan'}
                </Button>
              </div>
            )}
          </div>

          {/* Canvas Controls Toolbar for Artist */}
          {isArtist && activeFan && (
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                {/* Color picker shortcuts */}
                <div className="flex items-center gap-1.5">
                  {['#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF'].map((color) => (
                    <button 
                      key={color}
                      onClick={() => setBrushColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                        brushColor === color ? 'border-violet-400 scale-110 shadow-md shadow-violet-500/40' : 'border-zinc-950 hover:scale-105'
                      }`}
                      title={color}
                    />
                  ))}
                </div>
                {/* Brush size sliders */}
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Size:</span>
                  {[2, 4, 6, 8].map((size) => (
                    <button 
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`h-6 w-6 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        brushSize === size ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleClear}
                  className="bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer px-4 py-2"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Clear
                </Button>
                <Button 
                  onClick={handleCompleteSignature}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl px-5 py-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" /> Stamping...
                    </span>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" /> Complete Signature
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Queue list & Interactions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Fan card */}
          <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Active Canvas Target
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeFan ? (
                <div className="flex items-center justify-between bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-white border border-white/10">
                      {activeFan.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{activeFan.displayName}</h4>
                      <span className="text-[10px] text-violet-400 font-semibold tracking-wider uppercase mt-0.5 block">
                        {isActiveFan ? 'YOU are being signed!' : 'In the Spotlight'}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                    Active
                  </Badge>
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-white/5 rounded-2xl">
                  <User className="h-7 w-7 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs">No active user on stage.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Request Queue Panel */}
          <Card className="border-white/10 bg-zinc-950/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-white">Live Waiting Queue</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">Queue list is managed in real-time.</CardDescription>
                </div>
                <Badge className="bg-zinc-800 text-zinc-300 border border-white/10 font-bold px-2 py-0.5">
                  {queue.length} in line
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* Queue Items list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {queue.length > 0 ? (
                  queue.map((item, index) => (
                    <div 
                      key={item.connectionId}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        item.userId === user?.id
                          ? 'border-violet-500/30 bg-violet-500/5'
                          : 'border-white/5 bg-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 w-4">#{index + 1}</span>
                        <span className="text-zinc-300 font-semibold truncate max-w-[120px]">{item.displayName}</span>
                        {item.userId === user?.id && (
                          <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1 text-[8px] uppercase tracking-wider font-extrabold rounded">
                            You
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">Est: ~{(index + 1) * 3} mins</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-600 text-xs">
                    No fans waiting in line yet.
                  </div>
                )}
              </div>

              {/* Fan Action buttons */}
              {!isArtist && (
                <div className="border-t border-white/5 pt-4">
                  {isActiveFan ? (
                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 text-center space-y-3">
                      <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto animate-pulse" />
                      <div>
                        <h4 className="text-white text-sm font-bold">You are active on stage!</h4>
                        <p className="text-zinc-400 text-[11px] mt-0.5">
                          Watch the canvas live as the artist signs your chosen template.
                        </p>
                      </div>
                      
                      {signedResult && (
                        <Button 
                          onClick={() => window.open(signedResult.url, '_blank')}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
                        >
                          <Download className="h-4 w-4" /> Download Signed Asset
                        </Button>
                      )}
                    </div>
                  ) : isInQueue ? (
                    <div className="space-y-3 bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10 text-center">
                      <Clock className="h-6 w-6 text-violet-400 mx-auto" />
                      <div>
                        <h4 className="text-white text-xs font-bold">You are in queue at position #{queueIndex + 1}</h4>
                        <p className="text-zinc-500 text-[10px] mt-0.5">
                          Please stay on this page. You will be automatically loaded when called.
                        </p>
                      </div>
                      <Button 
                        onClick={handleLeaveQueue}
                        variant="outline"
                        className="w-full border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 bg-transparent hover:bg-red-500/5 rounded-xl text-xs py-2 h-9 cursor-pointer"
                      >
                        Leave Queue
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Asset selector for queue */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Select item to sign
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {TEMPLATE_ASSETS.map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => setSelectedAsset(asset)}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] text-center transition-all cursor-pointer ${
                                selectedAsset.id === asset.id 
                                  ? 'border-violet-500 bg-violet-500/10 text-white font-bold' 
                                  : 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/10'
                              }`}
                            >
                              <ImageIcon className="h-4 w-4 mb-1" />
                              <span className="truncate max-w-[60px]">{asset.name.split(' ')[1] || asset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={handleJoinQueue}
                        disabled={joiningQueue}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-violet-600/20 cursor-pointer"
                      >
                        {joiningQueue ? 'Joining Queue...' : 'Queue up for Autograph'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Artist Action controls */}
              {isArtist && (
                <div className="border-t border-white/5 pt-4">
                  <Button 
                    onClick={handleNextFan}
                    disabled={queue.length === 0 || isSaving}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl py-4 shadow-lg shadow-violet-600/20 cursor-pointer"
                  >
                    Call Next Fan (Queue: {queue.length})
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
