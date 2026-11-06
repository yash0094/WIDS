import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Info } from 'lucide-react';

interface IncidentGraphProps {
  elements: any[];
  selectedEventId: number | null;
  onSelectEvent: (eventId: number) => void;
  onSelectEdge?: (edgeData: any) => void;
}

export const IncidentGraph: React.FC<IncidentGraphProps> = ({
  elements,
  selectedEventId,
  onSelectEvent,
  onSelectEdge
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<any | null>(null);
  const [layoutMode, setLayoutMode] = useState<'flow' | 'force'>('flow');

  const getLayoutConfig = (mode: 'flow' | 'force') => {
    if (mode === 'flow') {
      return {
        name: 'breadthfirst',
        directed: true,
        padding: 45,
        spacingFactor: 1.85,
        avoidOverlap: true,
        animate: true,
        animationDuration: 350
      };
    }
    return {
      name: 'cose',
      animate: false,
      nodeRepulsion: () => 950000,
      idealEdgeLength: () => 140,
      edgeElasticity: () => 100,
      nestingFactor: 5,
      gravity: 50,
      numIter: 1000,
      padding: 45,
      spacingFactor: 2.2
    };
  };

  useEffect(() => {
    if (!containerRef.current || !elements || elements.length === 0) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#14171A',
            'font-size': '11px',
            'font-weight': 'bold',
            'font-family': 'monospace',
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'background-color': (ele) => {
              const type = ele.data('event_type') || '';
              if (type.includes('Deauth')) return '#ef4444';
              if (type.includes('Rogue')) return '#a855f7';
              if (type.includes('Disassoc')) return '#f59e0b';
              if (type.includes('Beacon')) return '#06b6d4';
              return '#10b981';
            },
            'width': 38,
            'height': 38,
            'border-width': 3,
            'border-color': '#ffffff',
            'text-background-opacity': 0.95,
            'text-background-color': '#ffffff',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#cbd5e1'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4.5,
            'border-color': '#1E9E88',
            'background-blacken': 0.1
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2.5,
            'line-color': (ele) => {
              const rel = ele.data('relationship_type') || '';
              if (rel === 'pattern_match') return '#e11d48';
              if (rel === 'shared_entity') return '#0284c7';
              return '#94a3b8';
            },
            'target-arrow-color': (ele) => {
              const rel = ele.data('relationship_type') || '';
              if (rel === 'pattern_match') return '#e11d48';
              if (rel === 'shared_entity') return '#0284c7';
              return '#94a3b8';
            },
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.25,
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'font-family': 'monospace',
            'font-weight': 'bold',
            'color': '#0f172a',
            'text-background-opacity': 0.95,
            'text-background-color': '#ffffff',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#cbd5e1',
            'text-rotation': 'autorotate'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 4,
            'line-color': '#1E9E88',
            'target-arrow-color': '#1E9E88'
          }
        }
      ],
      layout: getLayoutConfig(layoutMode)
    });

    cy.ready(() => {
      cy.fit(undefined, 45);
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const eventId = node.data('event_id');
      setSelectedEdgeInfo(null);
      if (eventId) {
        onSelectEvent(eventId);
      }
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      const edgeData = edge.data();
      setSelectedEdgeInfo(edgeData);
      if (onSelectEdge) {
        onSelectEdge(edgeData);
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEdgeInfo(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutMode]);

  // Synchronize external selection with Cytoscape node
  useEffect(() => {
    if (!cyRef.current || !selectedEventId) return;
    const cy = cyRef.current;
    cy.nodes().unselect();
    const targetNode = cy.$(`node[event_id = ${selectedEventId}]`);
    if (targetNode.length > 0) {
      targetNode.select();
    }
  }, [selectedEventId]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleSwitchLayout = (mode: 'flow' | 'force') => {
    setLayoutMode(mode);
    if (cyRef.current) {
      cyRef.current.layout(getLayoutConfig(mode)).run();
      setTimeout(() => cyRef.current?.fit(undefined, 40), 250);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-white rounded-3xl border border-white overflow-hidden shadow-neu flex flex-col">
      {/* Top Toolbar */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center space-x-2 bg-[#ECEFF4]/90 backdrop-blur px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-xs">
        <span className="text-xs font-bold text-[#14171A]">Correlation Graph</span>
        <span className="text-[10px] text-[#687684] font-mono">
          ({elements.filter((e) => !e.data.source).length} nodes, {elements.filter((e) => e.data.source).length} edges)
        </span>
      </div>

      <div className="absolute top-3.5 right-3.5 z-10 flex items-center space-x-1.5 bg-[#ECEFF4]/90 backdrop-blur p-1 rounded-full border border-slate-200/60 shadow-xs">
        <div className="flex bg-white rounded-full p-0.5 border border-slate-200/60 text-[10px] mr-1 shadow-inner">
          <button
            onClick={() => handleSwitchLayout('flow')}
            className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
              layoutMode === 'flow' ? 'bg-[#16181C] text-white shadow-xs' : 'text-[#687684] hover:text-[#14171A]'
            }`}
            title="Hierarchical Attack Flow View"
          >
            Flow
          </button>
          <button
            onClick={() => handleSwitchLayout('force')}
            className={`px-2.5 py-1 rounded-full font-bold transition cursor-pointer ${
              layoutMode === 'force' ? 'bg-[#16181C] text-white shadow-xs' : 'text-[#687684] hover:text-[#14171A]'
            }`}
            title="Force-directed Network Mesh View"
          >
            Network
          </button>
        </div>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-[#687684] hover:text-[#14171A] hover:bg-white rounded-full transition cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-[#687684] hover:text-[#14171A] hover:bg-white rounded-full transition cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFit}
          title="Fit View"
          className="p-1.5 text-[#687684] hover:text-[#14171A] hover:bg-white rounded-full transition cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleSwitchLayout(layoutMode)}
          title="Re-layout"
          className="p-1.5 text-[#687684] hover:text-[#14171A] hover:bg-white rounded-full transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Graph Canvas */}
      <div ref={containerRef} className="flex-1 w-full h-full min-h-[460px] cytoscape-container bg-radial from-slate-50 to-white" />

      {/* Edge Inspector Overlay (When user clicks any edge) */}
      {selectedEdgeInfo && (
        <div className="absolute bottom-12 left-4 right-4 z-10 bg-white/95 backdrop-blur p-4 rounded-2xl border border-[#1E9E88]/40 shadow-neu flex items-start space-x-3 text-xs animate-in fade-in duration-150">
          <div className="p-2 bg-[#D7F3EE] text-[#1E9E88] rounded-xl">
            <Info className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#14171A]">
                Correlation Rule: <span className="text-[#1E9E88] font-mono">{selectedEdgeInfo.relationship_type}</span>
              </span>
              <span className="text-[#687684] font-mono">Time Delta: {selectedEdgeInfo.time_delta}s</span>
            </div>
            <p className="text-slate-700 mt-1 font-medium">{selectedEdgeInfo.reason}</p>
            <p className="text-[11px] text-[#687684] mt-0.5">
              Source: <span className="font-mono text-[#14171A] font-semibold">{selectedEdgeInfo.source}</span> &rarr; Target: <span className="font-mono text-[#14171A] font-semibold">{selectedEdgeInfo.target}</span>
            </p>
          </div>
          <button
            onClick={() => setSelectedEdgeInfo(null)}
            className="text-slate-400 hover:text-black text-base px-1.5 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Legend Footer */}
      <div className="bg-[#ECEFF4] border-t border-slate-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-[#687684] gap-2">
        <div className="flex items-center space-x-3.5 flex-wrap">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span className="font-medium text-[#14171A]">Deauth Attack</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="font-medium text-[#14171A]">Rogue AP</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-medium text-[#14171A]">Disassoc</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span className="font-medium text-[#14171A]">Beacon Flood</span>
          </span>
        </div>
        <span className="italic">Click node to inspect frame SHAP values • Click edge to view correlation rule</span>
      </div>
    </div>
  );
};
