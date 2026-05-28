import { useState, useEffect, useRef } from "react";
import PropertyChat from "../components/PropertyChat";
import Navbar from "../components/Navbar";
import { api } from "../components/Axios";
import { BUCKET_url } from "../components/vars";
import "./PropertyDetails.css";

/* ── 360° viewer: renders the pre-built app-files/index.html blob ── */
function PannellumViewer({ imageUrl }) {
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!iframeRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await iframeRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="pd-vr-frame-wrap">
      <button
        className="pd-vr-fullscreen-btn"
        onClick={toggleFullscreen}
      >
        {isFullscreen ? (
          /* X icon */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          /* fullscreen icon */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>

      <iframe
        ref={iframeRef}
        src={imageUrl}
        title="360° VR Tour"
        className="pd-vr-iframe"
        allowFullScreen
      />
    </div>
  );
}

export default function PropertyDetails({
  fromPage = "home",
  onNavigate,
  theme,
  toggleTheme,
  isLoggedIn,
  propertyId,
  currentUser,
}) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  /* ── VR tour state ── */
  const [tourUrl, setTourUrl] = useState(null);
  const [tourLoading, setTourLoading] = useState(false);
  const [showVR, setShowVR] = useState(true);

  const openLightbox = (index) => { setLightboxIndex(index); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);

  /* ── Keyboard navigation for lightbox ── */
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % (property?.media?.length ?? 1));
      if (e.key === "ArrowLeft")  setLightboxIndex(i => (i - 1 + (property?.media?.length ?? 1)) % (property?.media?.length ?? 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, property]);

  /* ── Fetch property by ID ── */
  useEffect(() => {
    if (!propertyId) return;
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/properties/${propertyId}`);
        setProperty(res.data);
      } catch (err) {
        setError("Failed to load property details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [propertyId]);

  /* ── Fetch & unzip VR tour after property loads ── */
  useEffect(() => {
    if (!propertyId || !property) return;

    const objectUrls = []; // Track generated URLs for cleanup

    const loadTour = async () => {
      setTourLoading(true);
      try {
        const res = await api.get(`/properties/${propertyId}/tour`);
        const zipFilename = typeof res.data === "string"
          ? res.data.replace(/^"|"$/g, "").trim()
          : String(res.data).trim();

        if (!zipFilename) return;

        const base = BUCKET_url.replace(/\/+$/, "");
        const zipRes = await fetch(`${base}/media/${propertyId}/${zipFilename}`);
        if (!zipRes.ok) throw new Error("Zip not found");
        const zipBlob = await zipRes.blob();

        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(zipBlob);
        const allFiles = Object.values(zip.files).filter((f) => !f.dir);

        // 1. Find index.html
        const indexFile = allFiles.find((f) => /index\.html$/i.test(f.name));
        if (!indexFile) throw new Error("No index.html found in zip");

        const folderPrefix = indexFile.name.replace(/index\.html$/i, "");

        // 2. Sort files into buckets
        const textAssets = {};
        const dataUriAssets = {};
        const blobAssets = {}; // For heavy 360 tiles

        await Promise.all(
          allFiles.map(async (f) => {
            if (f.name === indexFile.name) return;
            const relKey = f.name.startsWith(folderPrefix) ? f.name.slice(folderPrefix.length) : f.name;
            const ext = relKey.split(".").pop().toLowerCase();
            const isText = ["js", "css", "json", "txt", "xml"].includes(ext);

            if (isText) {
              textAssets[relKey] = await f.async("string");
            } else if (relKey.includes("img/") || relKey.startsWith("img/")) {
              // Tiny UI icons -> Base64
              const b64 = await f.async("base64");
              const mime = ext === "png" ? "image/png" : "image/jpeg";
              dataUriAssets[relKey] = `data:${mime};base64,${b64}`;
            } else {
              // Heavy Tiles -> Lightweight Blob URLs
              const mime = ["jpg", "jpeg"].includes(ext) ? "image/jpeg" : "application/octet-stream";
              const fileBlob = await f.async("blob");
              const typedBlob = new Blob([fileBlob], { type: mime });
              const objUrl = URL.createObjectURL(typedBlob);
              objectUrls.push(objUrl);
              blobAssets[relKey] = objUrl;
            }
          })
        );

        let htmlText = await indexFile.async("string");

        // 3. Inline scripts
        htmlText = htmlText.replace(
          /<script([^>]*?)src=["']([^"']+)["']([^>]*)>[\s\S]*?<\/script>/gi,
          (match, pre, src, post) => {
            const key = src.replace(/^[./]+/, ""); // strip ./
            return textAssets[key] ? `<script${pre}${post}>${textAssets[key]}</script>` : match;
          }
        );

        // 4. Inline CSS & inject Base64 UI images into the CSS
        htmlText = htmlText.replace(
          /<link([^>]*?)href=["']([^"']+\.css)["']([^>]*)>/gi,
          (match, pre, href) => {
            const key = href.replace(/^[./]+/, "");
            let css = textAssets[key];
            if (css) {
              Object.entries(dataUriAssets).forEach(([imgKey, imgData]) => {
                const escaped = imgKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const re = new RegExp(escaped, "g");
                css = css.replace(re, imgData);
              });
              return `<style>${css}</style>`;
            }
            return match;
          }
        );

        // 5. Replace any UI icons directly referenced in HTML
        Object.entries(dataUriAssets).forEach(([imgKey, imgData]) => {
          const escaped = imgKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const re = new RegExp(`(["'])(?:[./]+)?${escaped}\\1`, "g");
          htmlText = htmlText.replace(re, `$1${imgData}$1`);
        });

        // 6. Build Interceptor for the VR Engine (Marzipano dynamic paths)
        const interceptor = `
          window.__VR_ASSETS__ = ${JSON.stringify(blobAssets)};
          
          function _getAsset(url) {
            if (!url || typeof url !== 'string') return null;
            for (let key in window.__VR_ASSETS__) {
              if (url.endsWith(key)) return window.__VR_ASSETS__[key];
            }
            return null;
          }

          // Intercept JS Image creation (Marzipano uses this)
          const imgDescr = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
          if (imgDescr) {
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
              set: function(val) {
                const asset = _getAsset(val);
                imgDescr.set.call(this, asset || val);
              },
              get: function() { return imgDescr.get.call(this); }
            });
          }

          // Intercept XHR / Fetch as fallback
          const _fetch = window.fetch;
          window.fetch = function(req, init) {
            const url = typeof req === 'string' ? req : req.url;
            const asset = _getAsset(url);
            return _fetch(asset || req, init);
          };

          const _open = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            const asset = _getAsset(url);
            return _open.call(this, method, asset || url, ...rest);
          };
        `;

        // Inject interceptor into <head>
        htmlText = htmlText.replace("<head>", `<head><script>${interceptor}</script>`);

        // 7. Render Final
        const htmlBlob = new Blob([htmlText], { type: "text/html" });
        const finalUrl = URL.createObjectURL(htmlBlob);
        objectUrls.push(finalUrl);

        setTourUrl(finalUrl);
        setShowVR(true);
      } catch (err) {
        console.warn("VR tour unavailable:", err);
        setTourUrl(null);
        setShowVR(false);
      } finally {
        setTourLoading(false);
      }
    };

    loadTour();

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [propertyId, property]);



  /* ── Check if already favourited ── */
  useEffect(() => {
    if (!isLoggedIn || !propertyId) return;
    const checkFav = async () => {
      try {
        const res = await api.get("/favorites");
        const ids = res.data.map((f) => f.property_id);
        setIsFav(ids.includes(propertyId));
      } catch (_) {}
    };
    checkFav();
  }, [isLoggedIn, propertyId]);

  /* ── Toggle favourite ── */
  const toggleFav = async () => {
    if (!isLoggedIn) { onNavigate("signin"); return; }
    setFavLoading(true);
    try {
      if (isFav) {
        await api.delete(`/favorites/${propertyId}`);
        setIsFav(false);
      } else {
        await api.post(`/favorites/${propertyId}`);
        setIsFav(true);
      }
    } catch (_) {}
    setFavLoading(false);
  };

  /* ── Media helpers ── */
  const mediaList = Array.isArray(property?.media) ? property.media : [];
  const imgUrl = (filename) =>
    `${BUCKET_url}/media/${property?.id}/${filename}`;

  /* ── WhatsApp link ── */
  const waLink = property?.seller_phone
    ? `https://wa.me/${property.seller_phone.replace(/\D/g, "")}`
    : "#";

  /* ── Map embed (OpenStreetMap) ── */
  const mapSrc =
    property?.lat && property?.lon
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${
          property.lon - 0.01
        },${property.lat - 0.01},${property.lon + 0.01},${
          property.lat + 0.01
        }&layer=mapnik&marker=${property.lat},${property.lon}`
      : null;

  const backLabel =
    fromPage === "favourite" ? "Back To Favourites" :
    fromPage === "search"    ? "Back To Search"     :
    fromPage === "chat"      ? "Back" : "Back";

  const hasTour = tourLoading || tourUrl;

  /* ── Loading / Error states ── */
  if (loading)
    return (
      <div className="pd-page">
        <Navbar
          onNavigate={onNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
        />
        <div className="pd-loader">
          <div className="pd-spinner" />
          <p>Loading property details…</p>
        </div>
      </div>
    );

  if (error || !property)
    return (
      <div className="pd-page">
        <Navbar
          onNavigate={onNavigate}
          theme={theme}
          toggleTheme={toggleTheme}
          isLoggedIn={isLoggedIn}
        />
          {/* <div className="pd-error">
            <p>{error || "Property not found."}</p>
            <button className="pd-back-btn" onClick={() => onNavigate("home")}>
              ← Back to Home
            </button>
          </div> */}
      </div>
    );

  return (
    <div className="pd-page">
      <Navbar
        onNavigate={onNavigate}
        theme={theme}
        toggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn}
      />

      <div className="pd-container">
        {/* ── Back ── */}
        <button className="pd-custom-back" onClick={() => onNavigate(fromPage)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{backLabel}</span>
        </button>

        {/* ── VR / Photos toggle ── */}
        {hasTour && (
          <div className="pd-view-toggle">
            <button
              className={`pd-toggle-btn ${showVR ? "active" : ""}`}
              onClick={() => setShowVR(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              360° Tour
            </button>
            <button
              className={`pd-toggle-btn ${!showVR ? "active" : ""}`}
              onClick={() => setShowVR(false)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="12" rx="2"/>
                <path d="M3 19h18M8 15v4M16 15v4"/>
              </svg>
              Photos
            </button>
          </div>
        )}

        {/* ── VR Viewer ── */}
        {hasTour && showVR && (
          <div className="pd-vr-wrap">
            {tourLoading ? (
              <div className="pd-vr-loading">
                <div className="pd-spinner" />
                <span>Loading 360° tour…</span>
              </div>
            ) : (
              <>
                <div className="pd-vr-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Drag to explore
                </div>
                <PannellumViewer imageUrl={tourUrl} />
              </>
            )}
          </div>
        )}

        {/* ── Gallery (shown when VR is hidden or no tour) ── */}
        {(!hasTour || !showVR) && (
          <>
            <div className="pd-gallery">
              {/* Main image */}
              <div className="pd-gallery-main">
                {mediaList.length > 0 ? (
                  <img
                    src={imgUrl(mediaList[activeImg])}
                    alt={`${property.type} main`}
                    className="pd-main-img pd-main-img--clickable"
                    onClick={() => openLightbox(activeImg)}
                  />
                ) : (
                  <div className="pd-img-placeholder">No Image</div>
                )}
              </div>

              {/* Thumbnails column */}
              <div className="pd-gallery-thumbs">
                {mediaList.slice(1, 3).map((m, i) => (
                  <div
                    key={m}
                    className={`pd-thumb ${activeImg === i + 1 ? "active" : ""}`}
                    onClick={() => { setActiveImg(i + 1); openLightbox(i + 1); }}
                  >
                    <img src={imgUrl(m)} alt={`thumb ${i + 1}`} />
                  </div>
                ))}
                {mediaList.length > 3 && (
                  <div
                    className="pd-thumb pd-thumb-more"
                    onClick={() => { setActiveImg(3); openLightbox(3); }}
                  >
                    <img src={imgUrl(mediaList[3])} alt="more" />
                    <span className="pd-thumb-overlay">+{mediaList.length - 3} more</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail strip (mobile / extra) */}
            {mediaList.length > 1 && (
              <div className="pd-thumb-strip">
                {mediaList.map((m, i) => (
                  <div
                    key={m}
                    className={`pd-strip-item ${activeImg === i ? "active" : ""}`}
                    onClick={() => { setActiveImg(i); openLightbox(i); }}
                  >
                    <img src={imgUrl(m)} alt={`img ${i}`} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Main content ── */}
        <div className="pd-body">
          {/* LEFT ── details */}
          <div className="pd-left">
            {/* Price + fav */}
            <div className="pd-price-row">
              <div className="pd-price">
                <span className="pd-price-label">EGP</span>
                <span className="pd-price-val">
                  {Number(property.price).toLocaleString()}
                </span>
              </div>
              <button
                className={`pd-fav-btn ${isFav ? "active" : ""}`}
                onClick={toggleFav}
                disabled={favLoading}
                title={isFav ? "Remove from favourites" : "Save to favourites"}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isFav ? "#e53935" : "none"}
                  stroke={isFav ? "#e53935" : "currentColor"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Location subtitle */}
            <div className="pd-location-line">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1a8cca"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {[property.district, property.city].filter(Boolean).join(", ")}
            </div>

            {/* Specs chips */}
            <div className="pd-specs">
              <div className="pd-spec-chip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>{property.rooms} Beds</span>
              </div>
              <div className="pd-spec-chip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 22V12h18v10"/><path d="M3 12V7a4 4 0 014-4h10a4 4 0 014 4v5"/>
                </svg>
                <span>{property.bathrooms} Baths</span>
              </div>
              <div className="pd-spec-chip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>{property.area} m²</span>
              </div>
              {property.floors && (
                <div className="pd-spec-chip">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <span>Floor {property.floors}</span>
                </div>
              )}
              {property.condition && (
                <div className="pd-spec-chip pd-chip-condition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{property.condition}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pd-section">
              <h2 className="pd-section-title">
                {property.type} for {property.available ? "Sale" : "Rent"} in{" "}
                {property.district}, {property.city}
              </h2>
              <p className="pd-description">{property.description}</p>
            </div>

            {/* Details table */}
            <div className="pd-section">
              <h3 className="pd-sub-title">Property Details</h3>
              <div className="pd-details-grid">
                {[
                  { label: "Type",       value: property.type },
                  { label: "City",       value: property.city },
                  { label: "District",   value: property.district },
                  { label: "Area",       value: `${property.area} m²` },
                  { label: "Bedrooms",   value: property.rooms },
                  { label: "Bathrooms",  value: property.bathrooms },
                  { label: "Floor",      value: property.floors ?? "—" },
                  { label: "Condition",  value: property.condition ?? "—" },
                  { label: "Status",     value: property.available ? "Available" : "Unavailable" },
                ].map(({ label, value }) => (
                  <div className="pd-detail-row" key={label}>
                    <span className="pd-detail-label">{label}</span>
                    <span className="pd-detail-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            {mapSrc && (
              <div className="pd-section">
                <h3 className="pd-sub-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a8cca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:"6px",verticalAlign:"middle"}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  Location
                </h3>
                <div className="pd-map-wrap">
                  <iframe
                    title="property-location"
                    src={mapSrc}
                    className="pd-map"
                    loading="lazy"
                    allowFullScreen
                  />
                  <a
                    className="pd-map-link"
                    href={`https://www.openstreetmap.org/?mlat=${property.lat}&mlon=${property.lon}#map=16/${property.lat}/${property.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT ── seller card */}
          <div className="pd-right">
            <div className="pd-seller-card">
              <div className="pd-seller-avatar">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <div className="pd-seller-info">
                <p className="pd-seller-name">{property.seller_name}</p>
                <p className="pd-seller-tag">Property Agent</p>
              </div>

              <div className="pd-seller-actions">
                {/* Email */}
                <a
                  className="pd-contact-btn pd-btn-email"
                  href={`mailto:${property.seller_email}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email
                </a>

                {/* Call */}
                <a
                  className="pd-contact-btn pd-btn-call"
                  href={`tel:${property.seller_phone}`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.13 12.13 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.13 12.13 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  Call
                </a>

                {/* WhatsApp */}
                <a
                  className="pd-contact-btn pd-btn-wa"
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>

              {property.seller_email && (
                <p className="pd-seller-email">{property.seller_email}</p>
              )}
              {property.seller_phone && (
                <p className="pd-seller-phone">{property.seller_phone}</p>
              )}

              {/* Chat with seller */}
              <PropertyChat
                propertyId={propertyId}
                sellerId={property.seller_id}
                currentUser={currentUser}
                onNavigate={onNavigate}
                sellerName={property.seller_name}
              />
            </div>
          </div>
        </div>
      </div>

            {/* ── Lightbox ── */}
      {lightboxOpen && mediaList.length > 0 && (
        <div className="pd-lightbox" onClick={closeLightbox}>
          {/* Close button */}
          <button className="pd-lb-close" onClick={closeLightbox} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {/* Prev arrow */}
          {mediaList.length > 1 && (
            <button
              className="pd-lb-arrow pd-lb-arrow--prev"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + mediaList.length) % mediaList.length); }}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
          {/* Image */}
          <div className="pd-lb-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img
              src={imgUrl(mediaList[lightboxIndex])}
              alt={`${property.type} ${lightboxIndex + 1}`}
              className="pd-lb-img"
            />
            <div className="pd-lb-counter">{lightboxIndex + 1} / {mediaList.length}</div>
          </div>
          {/* Next arrow */}
          {mediaList.length > 1 && (
            <button
              className="pd-lb-arrow pd-lb-arrow--next"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % mediaList.length); }}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="pd-footer">
        <div className="pd-footer-logo">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <path d="M5 34V19L13 11H27L35 19V34" stroke="#0fc4ff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 34V27H25V34" stroke="#1a8cca" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 19L20 7L35 19" stroke="#0fc4ff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>3KARATI REAL ESTATE</span>
        </div>
        <p className="pd-footer-copy">© 2025 3Karati Real Estate. All rights reserved.</p>
      </footer>
    </div>
  );
}
