import { useState, useRef } from "react";
import axios from "axios";
import "./AddProperty.css";

const API_BASE = "http://localhost:8080/api";

export default function AddProperty({ onBack }) {
  const [form, setForm] = useState({
    propertyType: "apartment",
    //condition: "finished",
    lat: "",
    lon: "",
    price: "",
    yearBuilt: "",
    rooms: "",
    bathrooms: "",
    floor: "",
    CityID: "",
    districtID: "",
    area: "",
    description: "",
    //location: "",
  });

  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ message state for Add Property only
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fileRef = useRef();

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setMsg({ type: "", text: "" });
  };

  const handleFiles = (e) => {
    const urls = Array.from(e.target.files).map((f) =>
      URL.createObjectURL(f)
    );
    setPhotos((p) => [...p, ...urls]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const urls = Array.from(e.dataTransfer.files).map((f) =>
      URL.createObjectURL(f)
    );
    setPhotos((p) => [...p, ...urls]);
  };

  // ✅ API Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.price || !form.CityID || !form.districtID) {
      setMsg({
        type: "err",
        text: "Please fill all required fields.",
      });
      return;
    }

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const response = await axios.post(
        `${API_BASE}/properties`,
        {
          propertyType: form.propertyType,
          //condition: form.condition,
          lat: form.lat,
          lon: form.lon,
          price: form.price,
          yearBuilt: form.yearBuilt,
          rooms: form.rooms,
          bathrooms: form.bathrooms,
          floor: form.floor,
          CityID: form.CityID,
          districtID: form.districtID,
          area: form.area,
          description: form.description,
          //location: form.location,
        }
      );

      setMsg({
        type: "ok",
        text:
          response.data?.message ||
          "Property added successfully!",
      });

      setTimeout(() => {
        setSubmitted(true);
      }, 1200);
    } catch (error) {
      const serverMsg =
        error.response?.data?.message ||
        error.response?.data?.error;

      setMsg({
        type: "err",
        text:
          serverMsg ||
          "Failed to add property. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  if (submitted) {
    return (
      <div className="ap-success">
        <div className="ap-success-icon">
          <svg width="52" height="52" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 12 11.5 14.5 15.5 9.5"/>
          </svg>
        </div>
        <h2 className="ap-success-title">Listing Submitted!</h2>
        <p className="ap-success-sub">Your property has been submitted for review. We'll notify you once it's live.</p>
        <button className="ap-back-btn" onClick={onBack}>← Back to Profile</button>
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
              <select className="ap-select" value={form.propertyType} onChange={e => set("propertyType", e.target.value)}>
                <option>apartment</option>
                <option>villa</option>
                <option>duplex</option>
                <option>chalet</option>
                <option>townhouse</option>
                <option>studio</option>
                <option>shop</option>
                <option>office</option>
              </select>
            </div>
            {/* <div className="ap-field">
              <label className="ap-label">condition</label>
              <select className="ap-select" value={form.condition} onChange={e => set("condition", e.target.value)}>
                <option>finished</option>
                <option>semi-finished</option>
                <option>core &amp; shell</option>
                <option>new</option>
              </select>
            </div> */}
            <div className="ap-field">
              <label className="ap-label">lat</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 30.0444"
                value={form.lat} onChange={e => set("lat", e.target.value)} />
            </div>
            <div className="ap-field">
              <label className="ap-label">lon</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 31.2357"
                value={form.lon} onChange={e => set("lon", e.target.value)} />
            </div>
          </div>

          {/* ── Row 2 ── */}
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">rooms</label>
              <select className="ap-select" value={form.rooms} onChange={e => set("rooms", e.target.value)}>
                <option value="">&lt;select&gt;</option>
                <option>1</option><option>2</option><option>3</option>
                <option>4</option><option>5</option><option>6+</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">bathrooms</label>
              <select className="ap-select" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)}>
                <option value="">&lt;select&gt;</option>
                <option>1</option><option>2</option><option>3</option><option>4+</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">floor</label>
              <select className="ap-select" value={form.floor} onChange={e => set("floor", e.target.value)}>
                <option value="">&lt;select&gt;</option>
                <option>Ground</option><option>1</option><option>2</option>
                <option>3</option><option>4</option><option>5+</option><option>Top floor</option>
              </select>
            </div>
            <div className="ap-field">
              <label className="ap-label">CityID</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 1"
                value={form.CityID} onChange={e => set("CityID", e.target.value)} />
            </div>
          </div>

            {/* ── Row 3 ── */}
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label">districtID</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 21"
                value={form.districtID} onChange={e => set("districtID", e.target.value)} />
            </div>
            <div className="ap-field">
              <label className="ap-label">price</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 1000000"
                value={form.price} onChange={e => set("price", e.target.value)} 
                prefix="EGP" />
            </div>
            <div className="ap-field">
              <label className="ap-label">Area</label>
              <input className="ap-input" min="0" type="number" placeholder="e.g. 140"
                value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
              {/* <div className="ap-field">
              <label className="ap-label">year built</label>
              <input className="ap-input" type="number" placeholder="e.g. 2001"
                value={form.yearBuilt} onChange={e => set("yearBuilt", e.target.value)} />
            </div> */}
          </div>
          

{/* 
            <div className="ap-field ap-field-area">
            <label className="ap-label">Area</label>
            <input className="ap-input ap-input-area" type="number" placeholder="e.g. 180"
              value={form.area} onChange={e => set("area", e.target.value)} />
          </div> */}


          {/* ── Property desc ── */}
          <div className="ap-field">
            <label className="ap-label">Property desc.</label>
            <textarea className="ap-textarea" rows={4}
              placeholder="write brief description about the property you are selling"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* ── Location ── */}
          {/* <div className="ap-field">
            <label className="ap-label">Location</label>
            <input className="ap-input" type="text"
              placeholder="e.g.  cairo, maadi, degla al saryaat"
              value={form.location} onChange={e => set("location", e.target.value)} />
          </div> */}

          {/* ── Upload Photos ── */}
          <div className="ap-upload-wrap">
            <h3 className="ap-upload-title">Upload Photos</h3>
            <div className="ap-dropzone"
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}>
              {photos.length === 0 ? (
                <div className="ap-dropzone-inner">
                  <svg width="32" height="32" fill="none" stroke="#555" strokeWidth="1.8" viewBox="0 0 24 24">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
                  </svg>
                  <span className="ap-dropzone-label">Upload Image</span>
                  <span className="ap-dropzone-sub">JPG, PNG, GIF</span>
                </div>
              ) : (
                <div className="ap-photo-grid">
                  {photos.map((url, i) => (
                    <div key={i} className="ap-thumb">
                      <img src={url} alt="" />
                      <button type="button" className="ap-thumb-del"
                        onClick={e => { e.stopPropagation(); setPhotos(p => p.filter((_, j) => j !== i)); }}>×</button>
                    </div>
                  ))}
                  <div className="ap-thumb-add">
                    <svg width="22" height="22" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*"
                style={{ display:"none" }} onChange={handleFiles} />
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
            <button type="submit" className="ap-submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Listing"}
            </button>
          </div>

        </form>
      </div>

      {/* Footer */}
      <footer className="ap-footer">
        <div className="ap-footer-links">
          <span>ABOUT US</span><span className="ap-dot">|</span>
          <span>CONTACT US</span><span className="ap-dot">|</span>
          <span>TERMS &amp; PRIVACY POLICY</span>
        </div>
        <div className="ap-footer-icons">
          {/* Facebook */}
          <span className="ap-social"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></span>
          {/* Instagram */}
          <span className="ap-social"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></span>
          {/* LinkedIn */}
          <span className="ap-social"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></span>
          {/* YouTube */}
          <span className="ap-social"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg></span>
        </div>
        <p className="ap-footer-copy">© 2025 - 2026 3karati.org</p>
      </footer>
    </div>
  );
}
