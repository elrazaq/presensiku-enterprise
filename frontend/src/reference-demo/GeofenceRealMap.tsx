"use client";

import React, { useEffect, useRef } from "react";

interface GeofenceRealMapProps {
  officeLat: number;
  officeLng: number;
  officeRadius: number;
  employeeLat: number;
  employeeLng: number;
  onOfficeChange?: (lat: number, lng: number) => void;
  onEmployeeChange?: (lat: number, lng: number) => void;
}

export function GeofenceRealMap({
  officeLat,
  officeLng,
  officeRadius,
  employeeLat,
  employeeLng,
  onOfficeChange,
  onEmployeeChange,
}: GeofenceRealMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // HTML content with real Leaflet & OpenStreetMap tiles
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #e2e8f0; font-family: sans-serif; }
    .office-icon {
      background: #2563eb;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      font-size: 14px;
      font-weight: bold;
    }
    .employee-icon {
      background: #10b981;
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      font-size: 12px;
      font-weight: bold;
    }
    .custom-popup .leaflet-popup-content-wrapper {
      background: #ffffff;
      color: #0f172a;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      font-size: 12px;
      padding: 4px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let officeLat = ${officeLat};
    let officeLng = ${officeLng};
    let officeRadius = ${officeRadius};
    let empLat = ${employeeLat};
    let empLng = ${employeeLng};

    const map = L.map('map', { zoomControl: true }).setView([officeLat, officeLng], 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Office Icon & Marker
    const officeDivIcon = L.divIcon({
      className: 'custom-office-marker',
      html: '<div class="office-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const officeMarker = L.marker([officeLat, officeLng], { icon: officeDivIcon, draggable: true }).addTo(map);
    officeMarker.bindPopup('<strong>Kantor Pusat</strong><br>Pusat Geofence Presensi');

    // Geofence Circle
    const circle = L.circle([officeLat, officeLng], {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.22,
      radius: officeRadius,
      weight: 2
    }).addTo(map);

    // Employee Icon & Marker
    const empDivIcon = L.divIcon({
      className: 'custom-emp-marker',
      html: '<div class="employee-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    const empMarker = L.marker([empLat, empLng], { icon: empDivIcon, draggable: true }).addTo(map);
    empMarker.bindPopup('<strong>Pegawai</strong><br>Posisi scan GPS');

    // Connecting Distance Line
    const connectLine = L.polyline([[officeLat, officeLng], [empLat, empLng]], {
      color: '#059669',
      weight: 2,
      dashArray: '5, 8'
    }).addTo(map);

    // Haversine Distance in JS
    function getDistance(lat1, lon1, lat2, lon2) {
      const R = 6371e3;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
                Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }

    function updateLineAndPopup() {
      const p1 = officeMarker.getLatLng();
      const p2 = empMarker.getLatLng();
      connectLine.setLatLngs([p1, p2]);

      const dist = getDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      const isInside = dist <= circle.getRadius();
      connectLine.setStyle({ color: isInside ? '#059669' : '#dc2626' });

      empMarker.setPopupContent('<strong>Posisi Pegawai</strong><br>Jarak: ' + dist + 'm (' + (isInside ? 'Dalam Radius' : 'Luar Radius!') + ')');
      window.parent.postMessage({ type: 'DISTANCE_UPDATE', distance: dist, isInside: isInside }, '*');
    }

    updateLineAndPopup();

    // Event: Drag Office
    officeMarker.on('drag', function(e) {
      const pos = e.target.getLatLng();
      circle.setLatLng(pos);
      updateLineAndPopup();
      window.parent.postMessage({ type: 'OFFICE_MOVED', lat: pos.lat, lng: pos.lng }, '*');
    });

    // Event: Drag Employee
    empMarker.on('drag', function(e) {
      const pos = e.target.getLatLng();
      updateLineAndPopup();
      window.parent.postMessage({ type: 'EMPLOYEE_MOVED', lat: pos.lat, lng: pos.lng }, '*');
    });

    // Click map to reposition employee or office
    map.on('click', function(e) {
      empMarker.setLatLng(e.latlng);
      updateLineAndPopup();
      window.parent.postMessage({ type: 'EMPLOYEE_MOVED', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
    });

    // Listen for updates from React parent
    window.addEventListener('message', function(event) {
      const data = event.data;
      if (data && data.type === 'UPDATE_RADIUS') {
        circle.setRadius(data.radius);
        updateLineAndPopup();
      }
    });
  </script>
</body>
</html>
  `;

  // Send radius updates to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "UPDATE_RADIUS", radius: officeRadius },
        "*"
      );
    }
  }, [officeRadius]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "OFFICE_MOVED" && onOfficeChange) {
        onOfficeChange(e.data.lat, e.data.lng);
      } else if (e.data.type === "EMPLOYEE_MOVED" && onEmployeeChange) {
        onEmployeeChange(e.data.lat, e.data.lng);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onOfficeChange, onEmployeeChange]);

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        title="Real OpenStreetMap Geofence"
        className="w-full h-full border-0 absolute inset-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
