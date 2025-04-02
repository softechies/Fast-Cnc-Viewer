import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut, Move, Maximize } from 'lucide-react';

interface ViewerControlsProps {
  onRotate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: () => void;
  onFitToView: () => void;
}

export default function ViewerControls({
  onRotate,
  onZoomIn,
  onZoomOut,
  onPan,
  onFitToView
}: ViewerControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-md shadow-lg p-2 flex space-x-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-gray-700 hover:bg-gray-200"
        onClick={onRotate}
        title="Obróć widok"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-gray-700 hover:bg-gray-200"
        onClick={onZoomIn}
        title="Przybliż"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-gray-700 hover:bg-gray-200"
        onClick={onZoomOut}
        title="Oddal"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-gray-700 hover:bg-gray-200"
        onClick={onPan}
        title="Przesuń widok"
      >
        <Move className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-8 h-8 text-gray-700 hover:bg-gray-200"
        onClick={onFitToView}
        title="Dopasuj do ekranu"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}
