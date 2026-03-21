import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { InteractionResult } from '../services/geminiService';

interface SimulationEntry {
  id: string;
  drugName: string;
  result: InteractionResult | null;
  loading: boolean;
  error: string | null;
}

interface NetworkGraphProps {
  primaryDrugName: string;
  simulations: SimulationEntry[];
}

export default function NetworkGraph({ primaryDrugName, simulations }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);

    // Prepare data
    const nodes: any[] = [{ id: primaryDrugName, group: 'primary', radius: 30 }];
    const links: any[] = [];

    const validSimulations = simulations.filter(sim => sim.result && !sim.loading && !sim.error);

    validSimulations.forEach(sim => {
      nodes.push({ id: sim.drugName, group: 'secondary', severity: sim.result?.severity, radius: 20, score: sim.result?.riskScore || 0 });
      links.push({
        source: primaryDrugName,
        target: sim.drugName,
        severity: sim.result?.severity,
        score: sim.result?.riskScore || 0
      });
    });

    if (nodes.length === 1) {
       // Just draw the center node if no simulations
       svg.append("circle")
         .attr("cx", width / 2)
         .attr("cy", height / 2)
         .attr("r", 30)
         .attr("fill", "#06b6d4")
         .attr("stroke", "#0891b2")
         .attr("stroke-width", 2);

       svg.append("text")
         .attr("x", width / 2)
         .attr("y", height / 2 + 5)
         .attr("text-anchor", "middle")
         .attr("fill", "#fff")
         .attr("font-size", "12px")
         .attr("font-weight", "bold")
         .text(primaryDrugName.substring(0, 8) + (primaryDrugName.length > 8 ? '...' : ''));
         
       return;
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 20));

    const getSeverityColor = (severity?: string) => {
      switch (severity?.toLowerCase()) {
        case 'low': return '#4ade80'; // green-400
        case 'moderate': return '#facc15'; // yellow-400
        case 'high': return '#fb923c'; // orange-400
        case 'severe': return '#ef4444'; // red-500
        default: return '#22d3ee'; // cyan-400
      }
    };

    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: any) => getSeverityColor(d.severity))
      .attr("stroke-width", (d: any) => Math.max(2, (d.score / 100) * 8));

    const dragstarted = (event: any, d: any) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: any, d: any) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event: any, d: any) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => d.group === 'primary' ? '#06b6d4' : '#1e293b') // cyan-500 or slate-800
      .attr("stroke", (d: any) => d.group === 'primary' ? '#0891b2' : getSeverityColor(d.severity))
      .attr("stroke-width", 2);

    node.append("text")
      .attr("x", 0)
      .attr("y", (d: any) => d.radius + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8") // slate-400
      .attr("font-size", "10px")
      .attr("stroke", "none")
      .text((d: any) => d.id);

    // Primary node text inside
    node.filter((d: any) => d.group === 'primary')
      .append("text")
      .attr("x", 0)
      .attr("y", 4)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("stroke", "none")
      .text((d: any) => d.id.substring(0, 8) + (d.id.length > 8 ? '...' : ''));

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [primaryDrugName, simulations]);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-cyan-950/10 border border-cyan-900/30 rounded-lg overflow-hidden flex items-center justify-center relative">
      {simulations.filter(s => s.result && !s.loading && !s.error).length === 0 ? (
         <div className="text-cyan-500/30 text-xs uppercase tracking-widest absolute">
            Add interactions to view network graph
         </div>
      ) : null}
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
