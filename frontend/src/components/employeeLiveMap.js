import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const EmployeeMap = ({ latitude, longitude }) => {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return;

    // Use OpenStreetMap style for free, reliable mapping
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [longitude, latitude],
      zoom: 15,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation control
    map.addControl(new maplibregl.NavigationControl());

    // Add marker for employee location
    const marker = new maplibregl.Marker({ 
      color: "#dc2626",
      scale: 1.2
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    // Add popup for the marker
    const popup = new maplibregl.Popup({ 
      offset: 30,
      closeButton: false
    }).setHTML(`
      <div style="padding: 8px; font-family: system-ui;">
        <strong>Employee Location</strong><br/>
        Lat: ${latitude.toFixed(6)}<br/>
        Lng: ${longitude.toFixed(6)}
      </div>
    `);
    
    marker.setPopup(popup);

    return () => {
      map.remove();
    };
  }, [latitude, longitude]);

  if (!latitude || !longitude) {
    return (
      <div 
        style={{ 
          width: "100%", 
          height: "400px", 
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          fontSize: "14px"
        }}
      >
        Location data not available
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "400px", borderRadius: "10px" }}
    />
  );
};

export default EmployeeMap;
