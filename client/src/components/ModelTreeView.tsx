import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelTree } from '@shared/schema';
import { ChevronRight, ChevronDown, Box } from 'lucide-react';

interface ModelTreeViewProps {
  isLoading: boolean;
  modelTree?: ModelTree;
}

interface TreeNodeProps {
  node: ModelTree;
  level?: number;
  onSelect: (nodeId: string) => void;
  selectedNodeId?: string;
}

const TreeNode = ({ node, level = 0, onSelect, selectedNodeId }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  return (
    <li>
      <div 
        className={`pl-2 py-1 hover:bg-gray-100 rounded flex items-center ${isSelected ? 'bg-gray-100' : ''}`}
        onClick={() => onSelect(node.id)}
      >
        <span className="mr-1 text-gray-500" onClick={handleToggleExpand}>
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <Box className={`h-4 w-4 ${isSelected ? 'text-primary' : ''}`} />
          )}
        </span>
        <span className={`${isSelected ? 'text-primary font-medium' : 'text-gray-800'}`}>
          {node.name}
        </span>
      </div>
      
      {hasChildren && isExpanded && (
        <ul className="ml-6 mt-1 space-y-1">
          {node.children!.map((child: ModelTree) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function ModelTreeView({ isLoading, modelTree }: ModelTreeViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Here we would typically trigger an action to highlight the selected part in the 3D view
  };
  
  const handleExpandAll = () => {
    // Implementation would require traversing the tree and updating state
    // For simplicity, we would re-render tree with all nodes expanded
  };
  
  const handleCollapseAll = () => {
    // Implementation would require traversing the tree and updating state
    // For simplicity, we would re-render tree with all nodes collapsed
  };
  
  if (isLoading) {
    return (
      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-4/6 ml-6" />
          <Skeleton className="h-6 w-4/6 ml-6" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }
  
  if (!modelTree) {
    return (
      <div className="flex-grow overflow-y-auto p-4 text-center text-gray-500">
        <p>Nie znaleziono struktury modelu</p>
      </div>
    );
  }
  
  return (
    <div className="flex-grow overflow-y-auto p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Drzewo modelu</h2>
          <div className="flex items-center space-x-2">
            <button 
              className="text-sm text-gray-500 hover:text-primary"
              onClick={handleExpandAll}
              title="Rozwiń wszystko"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 11 12 6 7 11"></polyline>
                <polyline points="17 18 12 13 7 18"></polyline>
              </svg>
            </button>
            <button 
              className="text-sm text-gray-500 hover:text-primary"
              onClick={handleCollapseAll}
              title="Zwiń wszystko"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="7 13 12 18 17 13"></polyline>
                <polyline points="7 6 12 11 17 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ul className="text-sm text-gray-700 space-y-1">
        <TreeNode 
          node={modelTree} 
          onSelect={handleSelectNode}
          selectedNodeId={selectedNodeId}
        />
      </ul>
    </div>
  );
}
