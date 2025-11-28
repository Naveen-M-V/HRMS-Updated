import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const EmployeeMap = ({ latitude, longitude }) => {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://api.maptiler.com/maps/streets/style.json?key=SIcyJKY39KE1ld2VxqwP",  // FREE DEMO KEY
      center: [longitude, latitude],
      zoom: 16,
      pitch: 45,
      bearing: -20,
    });

    new maplibregl.Marker({ color: "red" })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => map.remove();
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainer}
      style={{ width: "100%", height: "400px", borderRadius: "10px" }}
    />
  );
};

export default EmployeeMap;
