
import { useState, useEffect } from "react";
import { api } from "../components/Axios";
import { CreditCard } from "lucide-react";
import Checkout from "./Checkout";
import "./PropertyOffers.css";

const IconChevronLeft = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function PropertyOffers({ onBack, onNavigate, userRole }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [activeCounterId, setActiveCounterId] = useState(null);
  const [selectedOfferIdForCheckout, setSelectedOfferIdForCheckout] = useState(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === "seller" ? "/seller/offers" : "/user/offers";
      const res = await api.get(endpoint);
      setOffers(res.data);
    } catch (err) {
      console.error("Failed to fetch offers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [userRole]);

  const handleUpdateStatus = async (offerId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this offer?`)) return;
    setActionLoading(offerId);
    try {
      const endpoint = userRole === "seller" ? `/seller/offers/${offerId}` : `/user/offers/${offerId}`;
      await api.patch(endpoint, { status });
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update offer");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCounterOffer = async (offerId) => {
    if (!counterPrice || isNaN(counterPrice)) return;
    setActionLoading(offerId);
    try {
      await api.post(`/seller/offers/${offerId}/counter`, { counter_price: Number(counterPrice) });
      setActiveCounterId(null);
      setCounterPrice("");
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send counter offer");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="po-loading">Loading offers...</div>;

  if (selectedOfferIdForCheckout) {
    const offer = offers.find(o => o.id === selectedOfferIdForCheckout);
    return (
      <Checkout 
        offer={offer} 
        onBack={() => setSelectedOfferIdForCheckout(null)}
        onComplete={() => {
          setSelectedOfferIdForCheckout(null);
          fetchOffers();
        }}
      />
    );
  }

  return (
    <div className="po-container">
      <div className="po-header">
        <button className="po-back-btn" onClick={onBack}>
          <IconChevronLeft /> Back
        </button>
        <h2 className="po-title">{userRole === "seller" ? "Received Offers" : "My Sent Offers"}</h2>
      </div>

      {offers.length === 0 ? (
        <div className="po-empty">
          <p>No offers found.</p>
        </div>
      ) : (
        <div className="po-list">
          {offers.map((offer) => (
            <div key={offer.id} className={`po-card ${offer.status}`}>
              <div className="po-card-main">
                <div className="po-prop-info">
                  <span className="po-prop-type">{offer.type}</span>
                  <h3 className="po-prop-loc">{offer.district}, {offer.city}</h3>
                  <div className="po-price-compare">
                    <span className="po-listing-price">Listed: EGP {Number(offer.listing_price).toLocaleString()}</span>
                    <span className="po-offer-price-tag">Offer: EGP {Number(offer.offer_price).toLocaleString()}</span>
                    {offer.status === 'countered' && (
                      <span className="po-counter-price-tag">Counter: EGP {Number(offer.counter_price).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="po-status-badge">
                  {offer.status.toUpperCase()}
                </div>
              </div>

              <div className="po-card-footer">
                <div className="po-meta">
                  <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                  {userRole === "seller" && (
                    <span className="po-buyer-info">Buyer: {offer.buyer_name} ({offer.buyer_email})</span>
                  )}
                </div>

                {userRole === "seller" && offer.status === "pending" && (
                  <div className="po-actions-stack">
                    {activeCounterId === offer.id ? (
                      <div className="po-counter-input-wrap">
                        <input 
                          type="number" 
                          placeholder="Counter Price" 
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                        />
                        <button onClick={() => handleCounterOffer(offer.id)} disabled={actionLoading === offer.id}>Send</button>
                        <button onClick={() => setActiveCounterId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div className="po-actions">
                        <button 
                          className="po-btn-reject" 
                          onClick={() => handleUpdateStatus(offer.id, "rejected")}
                          disabled={actionLoading === offer.id}
                        >
                          <IconX /> Reject
                        </button>
                        <button 
                          className="po-btn-counter" 
                          onClick={() => setActiveCounterId(offer.id)}
                          disabled={actionLoading === offer.id}
                        >
                          Counter
                        </button>
                        <button 
                          className="po-btn-accept" 
                          onClick={() => handleUpdateStatus(offer.id, "accepted")}
                          disabled={actionLoading === offer.id}
                        >
                          <IconCheck /> Accept
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {userRole === "buyer" && offer.status === "countered" && (
                  <div className="po-actions">
                    <button 
                      className="po-btn-reject" 
                      onClick={() => handleUpdateStatus(offer.id, "rejected")}
                      disabled={actionLoading === offer.id}
                    >
                      <IconX /> Reject Counter
                    </button>
                    <button 
                      className="po-btn-accept" 
                      onClick={() => handleUpdateStatus(offer.id, "accepted")}
                      disabled={actionLoading === offer.id}
                    >
                      <IconCheck /> Accept Counter
                    </button>
                  </div>
                )}
                
                {userRole === "buyer" && offer.status === "accepted" && (
                  <div className="po-actions">
                    <button 
                      className="po-btn-checkout" 
                      onClick={() => setSelectedOfferIdForCheckout(offer.id)}
                    >
                      <CreditCard size={16} /> Checkout
                    </button>
                  </div>
                )}
                
                <button 
                  className="po-view-btn"
                  onClick={() => onNavigate("propertyDetails", { id: offer.property_id })}
                >
                  View Property
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
