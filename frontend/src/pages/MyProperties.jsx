import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import { BUCKET_url } from "../components/vars";
import "./MyProperties.css";

/* ── Icons ── */
const IconChevronLeft = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);
const IconHome = () => (
  <svg width="40" height="40" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function MyProperties({ onBack, onNavigate }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [propertyMedia, setPropertyMedia] = useState({});
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    fetchProperties();
    fetchCities();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data } = await api.get('/my-properties');
      setProperties(data);
      // Fetch media for each property
      data.forEach(p => fetchMedia(p.id));
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async (propertyId) => {
    try {
      const { data } = await api.get(`/properties/${propertyId}`);
      if (data.media) {
        setPropertyMedia(prev => ({ ...prev, [propertyId]: data.media }));
      }
    } catch (err) {
      // ignore - thumbnail fallback
    }
  };

  const fetchCities = async () => {
    try {
      const { data } = await api.get('/cities');
      setCities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCityChange = async (value) => {
    setEditForm(f => ({ ...f, city: value, district: '' }));
    try {
      const { data } = await api.get(`/cities/${value}/districts`);
      setDistricts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (propertyId) => {
    try {
      await api.delete(`/properties/${propertyId}`);
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete property:', err);
      setError('Failed to delete property. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditStart = async (property) => {
    setEditingProperty(property.id);
    setNewPhotos([]);

    // Map numeric floor back to select option
    const floorValue = property.floors;
    let floorOption = '';
    if (floorValue === 1) floorOption = 'Ground';
    else if (floorValue === 99) floorOption = 'Top floor';
    else if (floorValue >= 5) floorOption = '5+';
    else if (floorValue) floorOption = String(floorValue);

    // Map rooms/bathrooms to select options
    const roomsOption = property.rooms >= 6 ? '6' : String(property.rooms || '');
    const bathroomsOption = property.bathrooms >= 4 ? '4' : String(property.bathrooms || '');

    setEditForm({
      propertyType: property.type || 'apartment',
      rooms: roomsOption,
      bathrooms: bathroomsOption,
      floor: floorOption,
      city: property.city || '',
      district: property.district || '',
      condition: property.condition || 'fully finished',
      area: String(property.area || ''),
      price: String(property.price || ''),
      description: property.description || '',
    });
    // Load districts for the property's city
    if (property.city) {
      try {
        const { data } = await api.get(`/cities/${property.city}/districts`);
        setDistricts(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeletePhoto = async (propertyId, mediaFileName) => {
    // mediaFileName is like "uuid.ext" — the s3_key is the uuid part
    const s3Key = mediaFileName.split('.')[0];
    try {
      await api.delete(`/properties/${propertyId}/media/${s3Key}`);
      setPropertyMedia(prev => ({
        ...prev,
        [propertyId]: prev[propertyId].filter(m => m !== mediaFileName)
      }));
    } catch (err) {
      console.error('Failed to delete photo:', err);
      setError('Failed to delete photo.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(prev => [...prev, ...files]);
  };

  const handleEditSave = async (propertyId) => {
    setSaving(true);
    try {
      const floorMap = { Ground: 1, "Top floor": 99 };
      const floorsValue = floorMap[editForm.floor] ?? Number(editForm.floor);

      await api.patch(`/properties/${propertyId}`, {
        type: editForm.propertyType,
        price: Number(editForm.price),
        rooms: Number(editForm.rooms),
        bathrooms: Number(editForm.bathrooms),
        floors: floorsValue,
        area: Number(editForm.area),
        condition: editForm.condition,
        description: editForm.description,
      });

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const media = newPhotos.map(file => ({
          fileName: file.name,
          size: file.size,
        }));

        const { data } = await api.post(`/properties/${propertyId}/media`, { media });
        const mediaMap = data.media;

        for (const [fileName, { uploadUrl, mediaId }] of Object.entries(mediaMap)) {
          const file = newPhotos.find(f => f.name === fileName);
          if (file) {
            await fetch(uploadUrl, { method: 'PUT', body: file });
            await api.put(`/properties/${propertyId}/media/${mediaId}`);
          }
        }
      }

      // Refresh properties and media
      const { data: updatedProps } = await api.get('/properties/mine');
      setProperties(updatedProps);
      fetchMedia(propertyId);
      setEditingProperty(null);
      setNewPhotos([]);
    } catch (err) {
      console.error('Failed to update property:', err);
      setError(err.response?.data?.error || 'Failed to update property.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    const n = Number(price);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M EGP";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K EGP";
    return n + " EGP";
  };

  if (loading) {
    return (
      <div className="mp-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="mp-app">
      <button className="mp-back-btn" onClick={onBack}>
        <IconChevronLeft /> Back to Profile
      </button>

      <div className="mp-header">
        <h2 className="mp-title">My Properties</h2>
        <p className="mp-subtitle">{properties.length} {properties.length === 1 ? 'property' : 'properties'} listed</p>
      </div>

      {error && <div className="mp-error">{error}</div>}

      {properties.length === 0 ? (
        <div className="mp-empty">
          <IconHome />
          <h3>No properties yet</h3>
          <p>Add your first property to start selling</p>
        </div>
      ) : (
        <div className="mp-list">
          {properties.map(property => (
            <div key={property.id} className="mp-card">
              {/* Photos */}
              <div className="mp-card-photos">
                {propertyMedia[property.id] && propertyMedia[property.id].length > 0 ? (
                  <div className="mp-photos-grid">
                    {propertyMedia[property.id].map((media, idx) => (
                      <img
                        key={idx}
                        src={`${BUCKET_url}/media/${property.id}/${media}`}
                        alt={`${property.type} ${idx + 1}`}
                        className="mp-photo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ))}
                  </div>
                ) : property.thumbnail ? (
                  <div className="mp-photos-grid">
                    <img
                      src={`${BUCKET_url}/media/${property.id}/${property.thumbnail}`}
                      alt={property.type}
                      className="mp-photo"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="mp-card-img-ph"><IconHome /></div>
                )}
              </div>

              {/* Content */}
              <div className="mp-card-body">
                {editingProperty === property.id ? (
                  /* ── Edit Mode ── */
                  <div className="mp-edit-form">
                    {/* Photo Management */}
                    <div className="mp-edit-photos">
                      <label className="mp-edit-photos-label">Photos</label>
                      <div className="mp-edit-photos-grid">
                        {propertyMedia[property.id]?.map((media, idx) => (
                          <div key={idx} className="mp-edit-photo-item">
                            <img src={`${BUCKET_url}/media/${property.id}/${media}`} alt={`Photo ${idx + 1}`} />
                            <button
                              className="mp-photo-delete-btn"
                              onClick={() => handleDeletePhoto(property.id, media)}
                              title="Delete photo"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        ))}
                        {newPhotos.map((file, idx) => (
                          <div key={`new-${idx}`} className="mp-edit-photo-item mp-new-photo">
                            <img src={URL.createObjectURL(file)} alt={`New ${idx + 1}`} />
                            <button
                              className="mp-photo-delete-btn"
                              onClick={() => setNewPhotos(prev => prev.filter((_, i) => i !== idx))}
                              title="Remove"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        ))}
                        <label className="mp-add-photo-btn">
                          <input type="file" accept="image/*" multiple onChange={handleNewPhotos} hidden />
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add Photos
                        </label>
                      </div>
                    </div>

                    <div className="mp-edit-grid">
                      <div className="mp-edit-row">
                        <label>Property Type</label>
                        <select value={editForm.propertyType} onChange={(e) => setEditForm(f => ({ ...f, propertyType: e.target.value }))}>
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

                      <div className="mp-edit-row">
                        <label>Rooms</label>
                        <select value={editForm.rooms} onChange={(e) => setEditForm(f => ({ ...f, rooms: e.target.value }))}>
                          <option value="">&lt;select&gt;</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                          <option>5</option>
                          <option value="6">6+</option>
                        </select>
                      </div>

                      <div className="mp-edit-row">
                        <label>Bathrooms</label>
                        <select value={editForm.bathrooms} onChange={(e) => setEditForm(f => ({ ...f, bathrooms: e.target.value }))}>
                          <option value="">&lt;select&gt;</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option value="4">4+</option>
                        </select>
                      </div>

                      <div className="mp-edit-row">
                        <label>Floor</label>
                        <select value={editForm.floor} onChange={(e) => setEditForm(f => ({ ...f, floor: e.target.value }))}>
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

                      <div className="mp-edit-row">
                        <label>City</label>
                        <select value={editForm.city} onChange={(e) => handleCityChange(e.target.value)}>
                          <option value="">Select City</option>
                          {cities.map((city, i) => (
                            <option key={i} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mp-edit-row">
                        <label>District</label>
                        <select value={editForm.district} onChange={(e) => setEditForm(f => ({ ...f, district: e.target.value }))} disabled={!districts.length}>
                          <option value="">Select District</option>
                          {districts.map((d, i) => (
                            <option key={i} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mp-edit-row">
                        <label>Condition</label>
                        <select value={editForm.condition} onChange={(e) => setEditForm(f => ({ ...f, condition: e.target.value }))}>
                          <option value="fully finished">fully finished</option>
                          <option value="luxury finished">luxury finished</option>
                          <option value="semi finished">semi finished</option>
                          <option value="not finished">not finished</option>
                        </select>
                      </div>

                      <div className="mp-edit-row">
                        <label>Area (m²)</label>
                        <input type="number" min="0" value={editForm.area} onChange={(e) => setEditForm(f => ({ ...f, area: e.target.value }))} />
                      </div>

                      <div className="mp-edit-row">
                        <label>Price (EGP)</label>
                        <input type="number" min="0" value={editForm.price} onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))} />
                      </div>
                    </div>

                    <div className="mp-edit-row mp-edit-full">
                      <label>Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="mp-edit-actions">
                      <button className="mp-btn-cancel" onClick={() => setEditingProperty(null)}>Cancel</button>
                      <button className="mp-btn-save" onClick={() => handleEditSave(property.id)} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View Mode ── */
                  <>
                    <div className="mp-card-top">
                      <div>
                        <div className="mp-card-price">{formatPrice(property.price)}</div>
                        <div className="mp-card-type">{property.type}</div>
                      </div>
                      <div className="mp-card-actions">
                        <button className="mp-btn-edit" onClick={() => handleEditStart(property)}>
                          <IconEdit /> Edit
                        </button>
                        <button className="mp-btn-delete" onClick={() => setDeleteConfirm(property.id)}>
                          <IconTrash /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="mp-card-location">
                      <IconPin /> {property.district}, {property.city}
                    </div>

                    <div className="mp-card-specs">
                      <span>{property.rooms} beds</span>
                      <span>{property.bathrooms} baths</span>
                      <span>{property.area} m²</span>
                      {property.condition && <span className="mp-card-condition">{property.condition}</span>}
                    </div>

                    {property.description && (
                      <p className="mp-card-desc">{property.description}</p>
                    )}
                  </>
                )}
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === property.id && (
                <div className="mp-delete-overlay">
                  <div className="mp-delete-modal">
                    <p>Are you sure you want to delete this property?</p>
                    <div className="mp-delete-actions">
                      <button className="mp-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      <button className="mp-btn-confirm-delete" onClick={() => handleDelete(property.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
