import { useState, useRef, useEffect } from "react";
import { api } from "../components/Axios";
import "./AddProperty.css";

/* ── Leaflet map picker (loaded lazily to avoid SSR issues) ── */
const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/* ───────────────────────────────────────────────────
   MapPicker  — click/drag a pin on OpenStreetMap
   calls onPick({ lat, lon }) whenever the pin moves
─────────────────────────────────────────────────── */
function MapPicker({ lat, lon, onPick }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  // Default centre: Cairo
  const DEFAULT_LAT = 30.0444;
  const DEFAULT_LON = 31.2357;

  useEffect(() => {
    // Load Leaflet CSS once
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load Leaflet JS once, then init map
    const initMap = () => {
      const L = window.L;
      if (mapRef.current) return; // already initialised

      const initialLat = lat || DEFAULT_LAT;
      const initialLon = lon || DEFAULT_LON;

      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [initialLat, initialLon],
        13
      );
      L.tileLayer(OSM_TILE, {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Custom pin icon that matches the app's blue theme
      const icon = L.divIcon({
        className: "",
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24C32 7.163 24.837 0 16 0z" fill="#1a8cca"/>
          <circle cx="16" cy="16" r="7" fill="white"/>
          <circle cx="16" cy="16" r="4" fill="#1a8cca"/>
        </svg>`,
        iconSize:   [32, 40],
        iconAnchor: [16, 40],
      });

      const marker = L.marker([initialLat, initialLon], {
        icon,
        draggable: true,
      }).addTo(map);

      // Drag end → update coords
      marker.on("dragend", () => {
        const { lat: newLat, lng: newLon } = marker.getLatLng();
        onPick({ lat: newLat.toFixed(6), lon: newLon.toFixed(6) });
      });

      // Click on map → move pin
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onPick({ lat: e.latlng.lat.toFixed(6), lon: e.latlng.lng.toFixed(6) });
      });

      mapRef.current    = map;
      markerRef.current = marker;
    };

    if (window.L) {
      initMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id  = "leaflet-js";
      script.src = LEAFLET_JS;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script tag exists but not loaded yet — wait
      document.getElementById("leaflet-js").addEventListener("load", initMap);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if parent updates lat/lon externally
  useEffect(() => {
    if (markerRef.current && lat && lon) {
      markerRef.current.setLatLng([parseFloat(lat), parseFloat(lon)]);
      mapRef.current?.panTo([parseFloat(lat), parseFloat(lon)]);
    }
  }, [lat, lon]);

  return (
    <div className="ap-map-picker-wrap">
      <div ref={containerRef} className="ap-map-picker" />
      <div className="ap-map-coords">
        {lat && lon ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{parseFloat(lat).toFixed(5)}, {parseFloat(lon).toFixed(5)}</span>
          </>
        ) : (
          <span className="ap-map-hint">Click or drag the pin to set the property location</span>
        )}
      </div>
    </div>
  );
}

export default function AddProperty({ onBack }) {
  const [form, setForm] = useState({
    propertyType: "apartment",
    condition: "fully finished",
    lat: "",
    lon: "",
    price: "",
    yearBuilt: "",
    rooms: "",
    bathrooms: "",
    floor: "",
    City: "",
    district: "",
    area: "",
    description: "",
  });

  const [photos, setPhotos] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ message state for Add Property only
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Place name search
  const [placeQuery, setPlaceQuery]         = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeErr, setPlaceErr]             = useState("");
  const [selectedPlace, setSelectedPlace]   = useState("");
  const placeDebounceRef = useRef(null);

  const searchPlaces = (query) => {
    setPlaceQuery(query);
    setSelectedPlace("");
    setPlaceErr("");
    setPlaceSuggestions([]);

    if (!query.trim()) return;

    clearTimeout(placeDebounceRef.current);
    placeDebounceRef.current = setTimeout(async () => {
      setPlaceSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=eg`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data = await res.json();
        if (data.length === 0) {
          setPlaceErr("No results found. Try a more specific name.");
        } else {
          setPlaceSuggestions(data);
        }
      } catch {
        setPlaceErr("Search failed. Check your connection and try again.");
      } finally {
        setPlaceSearching(false);
      }
    }, 500);
  };

  const pickSuggestion = (place) => {
    setSelectedPlace(place.display_name);
    setPlaceQuery(place.display_name);
    setPlaceSuggestions([]);
    setPlaceErr("");
    set("lat", parseFloat(place.lat).toFixed(6));
    set("lon", parseFloat(place.lon).toFixed(6));
  };

  const fileRef = useRef();

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setMsg({ type: "", text: "" });
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setPhotos((p) => [...p, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setPhotos((p) => [...p, ...files]);
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get("/cities");
        setCities(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCities();
  }, []);

  const handleCityChange = async (value) => {
    set("City", value); // تخزين المدينة
    set("district", ""); // تصفير district

    try {
      const res = await api.get(`/cities/${value}/districts`);
      setDistricts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Save as Draft
  const handleSaveDraft = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        type: form.propertyType || null,
        lat: form.lat ? Number(form.lat) : null,
        lon: form.lon ? Number(form.lon) : null,
        price: form.price ? Number(form.price) : null,
        rooms: form.rooms ? Number(form.rooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        floors: floorsValue || null,
        city: form.City || null,
        district: form.district || null,
        area: form.area ? Number(form.area) : null,
        description: form.description || null,
        condition: form.condition || null,
      };
      await api.post("/drafts", payload);
      setMsg({ type: "ok", text: "Draft saved! You can continue editing later from My Properties." });
      setTimeout(() => onNavigate("myproperties"), 1500);
    } catch (err) {
      setMsg({ type: "err", text: err.response?.data?.error || "Failed to save draft." });
    } finally {
      setLoading(false);
    }
  };

  // ✅ API Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.price || !form.City || !form.district) {
      setMsg({ type: "err", text: "Please fill all required fields." });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // Convert floor label → number
      const floorMap = { Ground: 0, "Top floor": 99 };
      const floorsValue = floorMap[form.floor] ?? Number(form.floor);

      const media = photos.map((file) => ({
        fileName: file.name,
        size: file.size,
      }));

      const payload = {
        type: form.propertyType,
        lat: Number(form.lat),
        lon: Number(form.lon),
        price: Number(form.price),
        rooms: Number(form.rooms),
        bathrooms: Number(form.bathrooms),
        floors: floorsValue,
        city: form.City,
        district: form.district,
        area: Number(form.area),
        description: form.description,
        condition: form.condition,
        media,
      };

      const response = await api.post("/properties", payload); // ✅ plain object → axios sends JSON automatically

      const { id: propertyId, media: mediaMap } = response.data;

      // Upload each photo to its pre-signed URL, then confirm with backend
      const photoEntries = Object.entries(mediaMap); // [[fileName, {uploadUrl, mediaId}], ...]

      for (let i = 0; i < photoEntries.length; i++) {
        const [fileName, { uploadUrl, mediaId }] = photoEntries[i];
        const isLast = i === photoEntries.length - 1;

        // Find the matching File object by name
        const file = photos.find((f) => f.name === fileName);

        // Replace rustfs hostname with 127.0.0.1 in dev
        // const resolvedUrl =
        //   import.meta.env.VITE_ENV === "dev"
        //     ? uploadUrl.replace("http://0.0.0.0:9000", "http://127.0.0.1:9000")
        //     : uploadUrl;

        let resp = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
        });
        const text = await resp.text();
        console.log(text)
        // // 1️⃣ PUT the raw file to S3 (no auth headers — it's a pre-signed URL)
        // await fetch(uploadUrl, {
        //   method: "PUT",
        //   body: file,
        //   headers: {
        //     "Content-Type": file.type,
        //   },
        // });

        // 2️⃣ Confirm the upload with your backend
        const confirmRes = await api.put(
          `/properties/${propertyId}/media/${mediaId}`,
        );

        // 3️⃣ On the last file, backend returns { message: "property created" }
        if (isLast && confirmRes.data?.message === "property created") {
          setTimeout(() => {
            window.location.href = `/property/${propertyId}`;
          }, 500);
          return; // skip the setSubmitted(true) path
        }
      }

      setMsg({
        type: "ok",
        text: response.data?.message || "Property added successfully!",
      });

      setTimeout(() => setSubmitted(true), 1200);
    } catch (error) {
      const serverMsg =
        error.response?.data?.message || error.response?.data?.error;
      setMsg({
        type: "err",
        text: serverMsg || "Failed to add property. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  if (submitted) {
    return (
      <div className="ap-success">
        <div className="ap-success-icon">
          <svg
            width="52"
            height="52"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="9 12 11.5 14.5 15.5 9.5" />
          </svg>
        </div>
        <h2 className="ap-success-title">Listing Submitted!</h2>
        <p className="ap-success-sub">
          Your property has been submitted for review. We'll notify you once
          it's live.
        </p>
        <button className="ap-back-btn" onClick={onBack}>
          ← Back to Profile
        </button>
      </div>
    );
  }

  return (
    <div className="ap-page">
      {/* Main card */}
      <div className="ap-card">
        <form onSubmit={handleSubmit}>
          {/* ── Row 1 ── */}
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">property type</label>
              <select
                className="ap-select"
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                <option>apartment</option>
                <option>villa</option>
                <option>duplex</option>
                <option>chalet</option>
                <option>town house</option>
                <option>studio</option>
                <option>shop</option>
                <option>office</option>
              </select>
            </div>


            <div className="ap-field">
              <label className="ap-label">rooms</label>
              <select
                className="ap-select"
                value={form.rooms}
                onChange={(e) => set("rooms", e.target.value)}
              >
                <option value="">&lt;select&gt;</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
                <option>6+</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">bathrooms</label>
              <select
                className="ap-select"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              >
                <option value="">&lt;select&gt;</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4+</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">floor</label>
              <select
                className="ap-select"
                value={form.floor}
                onChange={(e) => set("floor", e.target.value)}
              >
                <option value="">&lt;select&gt;</option>
                <option>Ground</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5+</option>
                <option>Top floor</option>
              </select>
            </div>
          </div>

          {/* ── Row 2 ── */}
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">City</label>
              <select
                className="ap-select"
                value={form.City}
                onChange={(e) => handleCityChange(e.target.value)}
              >
                <option value="">Select City</option>
                {cities.map((city, i) => (
                  <option key={i} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">district</label>
              <select
                className="ap-select"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                disabled={!districts.length}
              >
                <option value="">Select District</option>
                {districts.map((d, i) => (
                  <option key={i} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">condition</label>
              <select className="ap-select" value={form.condition} onChange={e => set("condition", e.target.value)}>
                <option>fully finished</option>
                <option>luxury finished </option>
                <option>semi finished</option>
                <option>not finished</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">Area</label>
              <input
                className="ap-input"
                min="0"
                type="number"
                placeholder="e.g. 140"
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
              />
            </div>
          </div>

          {/* ── Row 3 ── */}
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">price</label>
              <input
                className="ap-input"
                min="0"
                type="number"
                placeholder="e.g. 1000000"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                prefix="EGP"
              />
            </div>
          </div>

          {/* ── Property desc ── */}
          <div className="ap-field">
            <label className="ap-label">Property desc.</label>
            <textarea
              className="ap-textarea"
              rows={4}
              placeholder="write brief description about the property you are selling"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* ── Location ── */}
          {/* <div className="ap-field">
            <label className="ap-label">Location</label>
            <input className="ap-input" type="text"
              placeholder="e.g.  cairo, maadi, degla al saryaat"
              value={form.location} onChange={e => set("location", e.target.value)} />
          </div> */}

          {/* ── Location Picker ── */}
          <div className="ap-field ap-field--full">
            <label className="ap-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"5px",verticalAlign:"middle"}}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Property Location
              <span className="ap-label-required"> *</span>
            </label>

            {/* Place name search */}
            <div className="ap-place-search-wrap">
              <div className="ap-gmaps-row">
                <div className="ap-gmaps-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <input
                  className={`ap-input ap-gmaps-input ${placeErr ? "ap-input--err" : ""}`}
                  type="text"
                  placeholder="Search by place name, address or landmark…"
                  value={placeQuery}
                  onChange={(e) => searchPlaces(e.target.value)}
                  autoComplete="off"
                />
                {placeSearching && (
                  <span className="ap-place-spinner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                      </path>
                    </svg>
                  </span>
                )}
                {placeQuery && !placeSearching && (
                  <button
                    type="button"
                    className="ap-gmaps-clear"
                    onClick={() => { setPlaceQuery(""); setPlaceSuggestions([]); setPlaceErr(""); setSelectedPlace(""); }}
                    title="Clear"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {placeSuggestions.length > 0 && (
                <ul className="ap-place-suggestions">
                  {placeSuggestions.map((p) => (
                    <li
                      key={p.place_id}
                      className="ap-place-suggestion-item"
                      onClick={() => pickSuggestion(p)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:"2px"}}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span>{p.display_name}</span>
                    </li>
                  ))}
                </ul>
              )}

              {placeErr && <p className="ap-gmaps-err">{placeErr}</p>}
              {!placeErr && !selectedPlace && (
                <p className="ap-gmaps-hint">Type a name or address, pick from results — or click/drag the pin below</p>
              )}
              {selectedPlace && (
                <p className="ap-place-selected">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Location set
                </p>
              )}
            </div>

            <MapPicker
              lat={form.lat}
              lon={form.lon}
              onPick={({ lat, lon }) => {
                set("lat", lat);
                set("lon", lon);
              }}
            />
          </div>

          {/* ── Upload Photos ── */}
          <div className="ap-upload-wrap">
            <h3 className="ap-upload-title">Upload Photos</h3>
            <div
              className="ap-dropzone"
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {photos.length === 0 ? (
                <div className="ap-dropzone-inner">
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    stroke="#555"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="16 16 12 12 8 16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                  </svg>
                  <span className="ap-dropzone-label">Upload Image</span>
                  <span className="ap-dropzone-sub">JPG, PNG, GIF</span>
                </div>
              ) : (
                <div className="ap-photo-grid">
                  {photos.map((file, i) => (
                    <div key={i} className="ap-thumb">
                      <img src={URL.createObjectURL(file)} alt="" />
                      <button
                        type="button"
                        className="ap-thumb-del"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotos((p) => p.filter((_, j) => j !== i));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="ap-thumb-add">
                    <svg
                      width="22"
                      height="22"
                      fill="none"
                      stroke="#aaa"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFiles}
              />
            </div>
          </div>

          {/* ── Features / Amenities ── */}
          {/* <div className="ap-features-wrap">
            <h3 className="ap-features-title">Features/Amenities</h3>
            <div className="ap-features-grid">
              {FEATURES.map((f, i) => (
                <label key={f} className="ap-feature">
                  <span className={`ap-cb ${features[i] ? "on" : ""}`}
                    onClick={() => toggleFeature(i)}>
                    {features[i] && (
                      <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  <span className="ap-feature-name">{f}</span>
                </label>
              ))}
            </div>
          </div> */}

          {/* ── Submit ── */}
          <div className="ap-submit-row">
            <button type="button" className="ap-draft" onClick={handleSaveDraft} disabled={loading}>
              {loading ? "Saving…" : "Save as Draft"}
            </button>
            <button type="submit" className="ap-submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Listing"}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="ap-footer">
        <div className="ap-footer-links">
          <span>ABOUT US</span>
          <span className="ap-dot">|</span>
          <span>CONTACT US</span>
          <span className="ap-dot">|</span>
          <span>TERMS &amp; PRIVACY POLICY</span>
        </div>
        <div className="ap-footer-icons">
          {/* Facebook */}
          <span className="ap-social">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </span>
          {/* Instagram */}
          <span className="ap-social">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
          </span>
          {/* LinkedIn */}
          <span className="ap-social">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </span>
          {/* YouTube */}
          <span className="ap-social">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
              <polygon
                points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                fill="white"
              />
            </svg>
          </span>
        </div>
        <p className="ap-footer-copy">© 2025 - 2026 3karati.org</p>
      </footer>
    </div>
  );
}