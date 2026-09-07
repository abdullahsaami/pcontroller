import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { VehicleState, TrajectoryPoint, SimulationConfig } from '../types/simulation';
import { Eye, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface SimulationCanvasProps {
  vehicleState: VehicleState;
  trajectory: TrajectoryPoint[];
  config: SimulationConfig;
  isRunning: boolean;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  vehicleState,
  trajectory,
  config,
  isRunning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<'follow' | 'manual'>('follow');
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pixels per meter scale factor at zoom = 1.0
  const BASE_PIXELS_PER_METER = 90;
  const ppm = BASE_PIXELS_PER_METER * zoom;

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z * 1.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z / 1.2));
  const handleResetCamera = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    setCameraMode('follow');
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setCameraMode('manual');
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * zoomFactor)));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    const centerY = height / 2;
    let cameraX = width * 0.28 - vehicleState.x * ppm;

    if (cameraMode !== 'follow') {
      cameraX += panOffset.x;
    }
    const cameraY = centerY + (cameraMode === 'manual' ? panOffset.y : 0);

    const toCanvasX = (xMeters: number) => cameraX + xMeters * ppm;
    const toCanvasY = (yMeters: number) => cameraY - yMeters * ppm; // +y is upward on screen

    // 1. Draw Background Grid
    ctx.strokeStyle = '#121a2d';
    ctx.lineWidth = 1;
    const gridSizeMeters = 1.0;
    const gridPixels = gridSizeMeters * ppm;
    const startGridX = Math.floor((-cameraX) / gridPixels) * gridPixels + (cameraX % gridPixels);
    const startGridY = Math.floor((-cameraY) / gridPixels) * gridPixels + (cameraY % gridPixels);

    ctx.beginPath();
    for (let gx = startGridX; gx < width; gx += gridPixels) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
    }
    for (let gy = startGridY; gy < height; gy += gridPixels) {
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
    }
    ctx.stroke();

    // 2. Draw Road Surface & Lane Boundaries
    const laneHalfWidth = 1.5; // meters
    const roadTopY = toCanvasY(laneHalfWidth);
    const roadBottomY = toCanvasY(-laneHalfWidth);
    const roadHeight = roadBottomY - roadTopY;

    // Asphalt surface gradient
    const asphaltGrad = ctx.createLinearGradient(0, roadTopY, 0, roadBottomY);
    asphaltGrad.addColorStop(0, '#0f1726');
    asphaltGrad.addColorStop(0.5, '#131d30');
    asphaltGrad.addColorStop(1, '#0f1726');
    ctx.fillStyle = asphaltGrad;
    ctx.fillRect(0, roadTopY, width, roadHeight);

    // Road Shoulder
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, roadTopY);
    ctx.fillRect(0, roadBottomY, width, height - roadBottomY);

    // Curb / Boundary lines
    const drawCurb = (yPos: number, isTop: boolean) => {
      ctx.save();
      ctx.strokeStyle = '#2a3a5c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(width, yPos);
      ctx.stroke();

      const notchSpacing = 0.5 * ppm;
      const notchStart = (cameraX % notchSpacing);
      ctx.strokeStyle = isTop ? '#00f0ff40' : '#ff005540';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let nx = notchStart; nx < width; nx += notchSpacing) {
        ctx.moveTo(nx, yPos);
        ctx.lineTo(nx + 6, yPos + (isTop ? 4 : -4));
      }
      ctx.stroke();
      ctx.restore();
    };
    drawCurb(roadTopY, true);
    drawCurb(roadBottomY, false);

    // 3. Draw Lane Labels & Boundaries
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#4a6088';
    ctx.fillText('+1.50m (Upper Boundary)', 15, roadTopY - 6);
    ctx.fillText('-1.50m (Lower Boundary)', 15, roadBottomY + 16);

    // 4. Center Reference Line (Target: y = 0)
    const refLineY = toCanvasY(0);
    ctx.save();
    ctx.strokeStyle = '#00f0ff22';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, refLineY);
    ctx.lineTo(width, refLineY);
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff66';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([12 * zoom, 8 * zoom]);
    ctx.beginPath();
    ctx.moveTo(0, refLineY);
    ctx.lineTo(width, refLineY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('TARGET PATH y = 0.00m', 15, refLineY - 8);

    // 5. Distance markers along the track
    const markerInterval = 1.0;
    const firstMarkerX = Math.floor((-cameraX) / (markerInterval * ppm)) * markerInterval;
    const lastMarkerX = firstMarkerX + width / ppm + 2;

    ctx.fillStyle = '#3a4e75';
    ctx.font = '10px "JetBrains Mono", monospace';
    for (let mx = firstMarkerX; mx <= lastMarkerX; mx += markerInterval) {
      if (mx < -0.1) continue;
      const cx = toCanvasX(mx);
      if (cx >= 0 && cx <= width) {
        ctx.strokeStyle = '#283b5e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, refLineY - 6);
        ctx.lineTo(cx, refLineY + 6);
        ctx.stroke();

        if (mx % 2 === 0) {
          ctx.fillText(`${mx.toFixed(0)}m`, cx - 8, refLineY + 20);
        }
      }
    }

    // 6. Draw Historical Trajectory Trail
    if (trajectory.length > 1) {
      ctx.save();
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < trajectory.length; i++) {
        const p1 = trajectory[i - 1];
        const p2 = trajectory[i];
        const x1 = toCanvasX(p1.x);
        const y1 = toCanvasY(p1.y);
        const x2 = toCanvasX(p2.x);
        const y2 = toCanvasY(p2.y);

        const errorMag = Math.abs(p2.lateralError);
        let strokeColor = '#00ff88';
        if (errorMag > 0.3) {
          strokeColor = '#ff0055';
        } else if (errorMag > 0.1) {
          strokeColor = '#ffb703';
        }

        ctx.strokeStyle = strokeColor + 'aa';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const dotInterval = Math.max(1, Math.floor(5 / zoom));
      for (let i = 0; i < trajectory.length; i += dotInterval) {
        const pt = trajectory[i];
        const cx = toCanvasX(pt.x);
        const cy = toCanvasY(pt.y);

        ctx.fillStyle = Math.abs(pt.lateralError) < 0.05 ? '#00ff88' : '#ffb703';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Vehicle Coordinates & Dimensions
    const vehX = toCanvasX(vehicleState.x);
    const vehY = toCanvasY(vehicleState.y);
    const vehHeading = vehicleState.heading;

    const vehLengthM = 0.85;
    const vehWidthM = 0.44;
    const vehLengthPx = vehLengthM * ppm;
    const vehWidthPx = vehWidthM * ppm;

    // 8. Draw Lateral Error Orthogonal Line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = vehicleState.lateralError >= 0 ? '#00f0ff' : '#ff5500';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vehX, vehY);
    ctx.lineTo(vehX, refLineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(vehX, refLineY, 3, 0, Math.PI * 2);
    ctx.fill();

    const midErrorY = (vehY + refLineY) / 2;
    ctx.fillStyle = 'rgba(10, 15, 26, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    const errorText = `e = ${(vehicleState.lateralError >= 0 ? '+' : '')}${vehicleState.lateralError.toFixed(3)}m`;
    const textWidth = ctx.measureText(errorText).width;
    ctx.beginPath();
    ctx.roundRect(vehX + 8, midErrorY - 9, textWidth + 10, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(errorText, vehX + 13, midErrorY + 4);
    ctx.restore();

    // 9. Draw Top-Down Autonomous Robot / Vehicle
    ctx.save();
    ctx.translate(vehX, vehY);
    ctx.rotate(-vehHeading);

    // Front sensor / headlight beam
    const beamGrad = ctx.createLinearGradient(0, 0, vehLengthPx * 1.8, 0);
    beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(vehLengthPx * 0.45, -vehWidthPx * 0.35);
    ctx.lineTo(vehLengthPx * 1.6, -vehWidthPx * 0.9);
    ctx.lineTo(vehLengthPx * 1.6, vehWidthPx * 0.9);
    ctx.lineTo(vehLengthPx * 0.45, vehWidthPx * 0.35);
    ctx.closePath();
    ctx.fill();

    // Wheels
    const wheelLength = vehLengthPx * 0.28;
    const wheelWidth = vehWidthPx * 0.18;
    const wheelFrontX = vehLengthPx * 0.28;
    const wheelRearX = -vehLengthPx * 0.28;
    const wheelYOffset = vehWidthPx * 0.52;
    const visualSteerAngle = Math.max(-0.6, Math.min(0.6, (vehicleState.steeringCommandDeg * Math.PI) / 180 * 0.25));

    const drawWheel = (wx: number, wy: number, steer: number) => {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(-steer);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-wheelLength / 2, -wheelWidth / 2, wheelLength, wheelWidth, 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, -wheelWidth / 2);
      ctx.lineTo(0, wheelWidth / 2);
      ctx.stroke();
      ctx.restore();
    };

    drawWheel(wheelFrontX, -wheelYOffset, visualSteerAngle);
    drawWheel(wheelFrontX, wheelYOffset, visualSteerAngle);
    drawWheel(wheelRearX, -wheelYOffset, 0);
    drawWheel(wheelRearX, wheelYOffset, 0);

    // Chassis
    const chassisW = vehWidthPx;
    const chassisL = vehLengthPx;
    ctx.fillStyle = '#152033';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-chassisL / 2, -chassisW / 2, chassisL, chassisW, 6);
    ctx.fill();
    ctx.stroke();

    // Body panels
    ctx.fillStyle = '#1e2d47';
    ctx.beginPath();
    ctx.roundRect(-chassisL * 0.35, -chassisW * 0.35, chassisL * 0.7, chassisW * 0.7, 4);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#0f1726';
    ctx.strokeStyle = '#38bdf888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-chassisL * 0.05, -chassisW * 0.3, chassisL * 0.35, chassisW * 0.6, 3);
    ctx.fill();
    ctx.stroke();

    // Lidar dome
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-chassisL * 0.1, 0, chassisW * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isRunning ? '#00ff88' : '#ffb703';
    ctx.beginPath();
    ctx.arc(-chassisL * 0.1, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front arrow
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(chassisL * 0.38, 0);
    ctx.lineTo(chassisL * 0.22, -chassisW * 0.2);
    ctx.lineTo(chassisL * 0.26, 0);
    ctx.lineTo(chassisL * 0.22, chassisW * 0.2);
    ctx.closePath();
    ctx.fill();

    // Rear lights
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(-chassisL * 0.49, -chassisW * 0.4, 3, chassisW * 0.2, 1);
    ctx.roundRect(-chassisL * 0.49, chassisW * 0.2, 3, chassisW * 0.2, 1);
    ctx.fill();

    // 10. Heading Vector Arrow projecting forward from bumper
    const arrowLength = Math.max(45, vehLengthPx * 1.4);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(chassisL * 0.5, 0);
    ctx.lineTo(chassisL * 0.5 + arrowLength, 0);
    ctx.stroke();

    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(chassisL * 0.5 + arrowLength + 8, 0);
    ctx.lineTo(chassisL * 0.5 + arrowLength - 4, -5);
    ctx.lineTo(chassisL * 0.5 + arrowLength - 4, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 11. Canvas HUD Overlay
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.strokeStyle = 'rgba(30, 44, 74, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(12, 12, 185, 68, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('CAMERA: ' + (cameraMode === 'follow' ? 'AUTO-TRACKING' : 'MANUAL PAN'), 22, 28);
    ctx.fillText(`POSITION: X=${vehicleState.x.toFixed(2)}m  Y=${vehicleState.y.toFixed(3)}m`, 22, 44);
    ctx.fillText(`HEADING:  θ = ${vehicleState.headingDeg >= 0 ? '+' : ''}${vehicleState.headingDeg.toFixed(1)}°`, 22, 60);

    ctx.restore();
  }, [vehicleState, trajectory, config, isRunning, zoom, cameraMode, panOffset, ppm]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] bg-[#0a0e17] rounded-xl border border-slate-800/90 shadow-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Canvas Action Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/60 shadow-lg">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700" />
        <button
          onClick={handleResetCamera}
          title="Reset Camera & Re-center Vehicle"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors flex items-center gap-1 text-xs font-mono"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Follow</span>
        </button>
      </div>

      {/* Direction Compass / Coordinate System Guide */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Road Axis: +X (Forward) &bull; +Y (Up) &bull; Ref Line: y=0</span>
      </div>

      {/* Real-time Trajectory Sample Count */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
        Trajectory: <span className="text-cyan-300 font-medium">{trajectory.length}</span> samples
      </div>
    </div>
  );
};
