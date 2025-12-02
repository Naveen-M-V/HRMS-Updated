import React, { useState } from "react";
import { ZoomIn, ZoomOut, Edit3, Printer, EyeOff, Eye } from "lucide-react";

import axios from "../utils/axiosConfig";


function Avatar({ initials }) {
  return (
    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#0056b3] flex items-center justify-center text-white font-bold text-xl md:text-2xl border-4 border-white shadow-md">
      {initials}
    </div>
  );
}

function NodeCard({ node, onProfile, children, hideable, hidden, onToggle }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-150 px-6 py-4 min-w-[210px] max-w-[240px] flex flex-col items-center border border-[#e7edf5] cursor-pointer relative"
        onClick={onProfile}
        style={{ zIndex: 2 }}
      >
        <Avatar initials={node.initials} />
        <div className="mt-3 text-lg font-bold text-gray-900 text-center leading-tight">{node.name}</div>
        <div className="text-sm text-gray-500 text-center mt-1">{node.role}</div>
        {hideable && (
          <button
            className="mt-3 text-[#0056b3] text-sm font-medium hover:underline focus:outline-none"
            onClick={e => { e.stopPropagation(); onToggle && onToggle(); }}
          >
            {hidden ? (
              <span className="inline-flex items-center"><Eye className="w-4 h-4 mr-1" /> Show employees</span>
            ) : (
              <span className="inline-flex items-center"><EyeOff className="w-4 h-4 mr-1" /> Hide employees</span>
            )}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Connector({ from, to, vertical = false }) {
  // from/to are {x, y} relative positions
  // Use SVG for curved/angled lines
  if (vertical) {
    return (
      <svg width="2" height={to.y - from.y} style={{ position: "absolute", left: from.x, top: from.y }}>
        <line x1="1" y1="0" x2="1" y2={to.y - from.y} stroke="#c9d4df" strokeWidth="2" />
      </svg>
    );
  }
  // For horizontal/curved lines
  const width = Math.abs(to.x - from.x);
  const height = Math.abs(to.y - from.y);
  const left = Math.min(from.x, to.x);
  const top = Math.min(from.y, to.y);
  // Draw a cubic bezier for a nice curve
  return (
    <svg width={width} height={height} style={{ position: "absolute", left, top, pointerEvents: "none" }}>
      <path
        d={`M${from.x > to.x ? width : 0},0 C${width / 2},0 ${width / 2},${height} ${from.x > to.x ? 0 : width},${height}`}
        stroke="#c9d4df"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function OrgChartTree({ teams, employees, zoom }) {
  // Layout constants (for pixel-perfect spacing)
  const rootY = 40;
  const rootX = 420;
  const vGap = 120;
  const hGap = 240;

  // Nodes positions for drawing connectors
  const stefanX = rootX;
  const stefanY = rootY + 120;
  const joX = rootX - hGap;
  const joY = stefanY + vGap;
  const garethX = rootX + hGap;
  const garethY = stefanY + vGap;

  return (
    <div
      className="relative mx-auto"
      style={{ width: 1080, height: 540, transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
    >
      {/* Root node (company) */}
      <div style={{ position: 'absolute', left: rootX, top: rootY }} className="flex flex-col items-center">
        <div className="bg-white rounded-xl shadow-lg px-8 py-4 min-w-[260px] max-w-[320px] flex flex-col items-center border border-[#e7edf5]">
          <div className="text-lg font-bold text-gray-900">Company</div>
        </div>
        {/* Vertical line down to teams */}
        <div className="w-0.5 h-16 bg-[#c9d4df] mx-auto"></div>
      </div>
      {/* Level 1: Teams */}
      {teams.map((team, index) => (
        <div key={team.id} style={{ position: 'absolute', left: stefanX + (index % 2 === 0 ? -hGap : hGap), top: stefanY }}>
          <NodeCard node={team} />
        </div>
      ))}
      {/* Level 2: Employees */}
      {employees.map((employee, index) => (
        <div key={employee.id} style={{ position: 'absolute', left: joX + (index % 2 === 0 ? -hGap : hGap), top: joY }}>
          <NodeCard node={employee} />
        </div>
      ))}
    </div>
  );
}

function OrganisationalChart() {
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [teamsRes, employeesRes] = await Promise.all([
          axios.get("/api/teams"),
          axios.get("/api/employees"),
        ]);
        setTeams(teamsRes.data.data || []);
        setEmployees(employeesRes.data.data || []);
      } catch (err) {
        setError("Failed to load org chart data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f8fa] p-8">
      {/* Header */}
      <div className="bg-white border border-[#e7edf5] rounded-lg px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Organisational chart</h1>
            <span className="bg-[#fbeaf3] text-[#e00070] text-xs font-bold px-3 py-1 rounded-full ml-2">Labs</span>
          </div>
          <div className="text-sm text-gray-500 max-w-xl">
            This is an experimental feature, please send us feedback to tell us what you love and what doesn't work for you.
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button className="border-2 border-[#e00070] text-[#e00070] px-5 py-2 rounded-lg font-medium text-sm hover:bg-[#fbeaf3] transition-colors flex items-center">
            <Edit3 className="w-4 h-4 mr-2" /> Edit
          </button>
          <button className="bg-[#e00070] text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-[#c00060] transition-colors flex items-center">
            Unpublish
          </button>
          <button className="border-2 border-[#e00070] text-[#e00070] px-5 py-2 rounded-lg font-medium text-sm hover:bg-[#fbeaf3] transition-colors flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Print chart
          </button>
          <button className="ml-2" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-6 h-6 text-[#0056b3]" />
          </button>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-6 h-6 text-[#0056b3]" />
          </button>
        </div>
      </div>
      {/* Chart Canvas */}
      <div className="relative bg-white border border-[#e7edf5] rounded-lg p-12 overflow-auto" style={{ minHeight: 700, minWidth: 900, maxHeight: '75vh' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-lg text-gray-500">Loading org chart...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-lg text-red-500">{error}</div>
        ) : (
          <OrgChartTree teams={teams} employees={employees} zoom={zoom} />
        )}
      </div>
    </div>
  );
}

export default OrganisationalChart;
