import { useState } from "react";
import { api } from "../components/Axios";
import { CreditCard, Landmark, Coins, ChevronLeft, CheckCircle2 } from "lucide-react";
import "./Checkout.css";

export default function Checkout({ offer, onBack, onComplete }) {
    const [method, setMethod] = useState("bank");
    const [installments, setInstallments] = useState(3);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const price = Number(offer.counter_price || offer.offer_price);

    // Interest structure: more months = higher fee
    const interestRates = {
        3: 0.02,   // 2%
        6: 0.035,  // 3.5%
        9: 0.05,   // 5%
        12: 0.07,  // 7%
        18: 0.09,  // 9%
        24: 0.12,  // 12%
        30: 0.15,  // 15%
        36: 0.18   // 18%
    };

    const serviceFee = price * 0.01;
    const installmentInterest = method === "installments" ? price * (interestRates[installments] || 0) : 0;
    const totalAmount = price + serviceFee + installmentInterest;
    const monthlyPayment = method === "installments" ? totalAmount / installments : 0;

    const handleCheckout = async () => {
        setLoading(true);
        try {
            await api.post(`/user/offers/${offer.id}/checkout`, {
                payment_method: method,
                installment_months: method === "installments" ? installments : null,
                final_amount: Math.round(totalAmount)
            });
            setSuccess(true);
            setTimeout(() => onComplete(), 2000);
        } catch (err) {
            alert(err.response?.data?.error || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="checkout-success">
                <CheckCircle2 size={64} color="#15803d" />
                <h2>Payment Successful!</h2>
                <p>The property has been officially marked as sold to you.</p>
                <p>Redirecting to your offers...</p>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <button className="checkout-back" onClick={onBack}>
                <ChevronLeft size={18} /> Back to Offers
            </button>

            <div className="checkout-layout">
                <div className="checkout-main">
                    <h2 className="checkout-title">Complete Purchase</h2>
                    <p className="checkout-subtitle">Securely finalize your purchase for the property in {offer.district}.</p>

                    <div className="payment-methods">
                        <label className={`method-card ${method === "bank" ? "active" : ""}`}>
                            <input type="radio" name="method" value="bank" checked={method === "bank"} onChange={() => setMethod("bank")} />
                            <Landmark size={24} />
                            <div className="method-info">
                                <span className="method-name">Bank Transfer</span>
                                <span className="method-desc">Direct transfer from your bank account</span>
                            </div>
                        </label>

                        <label className={`method-card ${method === "crypto" ? "active" : ""}`}>
                            <input type="radio" name="method" value="crypto" checked={method === "crypto"} onChange={() => setMethod("crypto")} />
                            <Coins size={24} />
                            <div className="method-info">
                                <span className="method-name">Crypto</span>
                                <span className="method-desc">Pay with BTC, ETH or USDT</span>
                            </div>
                        </label>

                        <label className={`method-card ${method === "installments" ? "active" : ""}`}>
                            <input type="radio" name="method" value="installments" checked={method === "installments"} onChange={() => setMethod("installments")} />
                            <CreditCard size={24} />
                            <div className="method-info">
                                <span className="method-name">Installments</span>
                                <span className="method-desc">Pay over 3 to 36 months</span>
                            </div>
                        </label>
                    </div>

                    {method === "installments" && (
                        <div className="installment-picker">
                            <label>Select Duration (Months)</label>
                            <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                                {Object.keys(interestRates).sort((a,b) => a-b).map(m => (
                                    <option key={m} value={m}>{m} Months ({(interestRates[m] * 100).toFixed(1)}% Fee)</option>
                                ))}
                            </select>
                            <div className="monthly-calc">
                                <span>Monthly Payment:</span>
                                <strong>EGP {Math.round(monthlyPayment).toLocaleString()} / mo</strong>
                            </div>
                        </div>
                    )}
                </div>

                <div className="checkout-summary">
                    <h3>Order Summary</h3>
                    <div className="summary-row">
                        <span>Property Price</span>
                        <span>EGP {price.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                        <span>Service Fee (1%)</span>
                        <span>EGP {Math.round(serviceFee).toLocaleString()}</span>
                    </div>
                    {method === "installments" && (
                        <div className="summary-row interest">
                            <span>Installment Fee ({(interestRates[installments] * 100).toFixed(1)}%)</span>
                            <span style={{ color: "#e53935", fontWeight: 700 }}>+ EGP {Math.round(installmentInterest).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="summary-total">
                        <span>Total Amount</span>
                        <span>EGP {Math.round(totalAmount).toLocaleString()}</span>
                    </div>

                    <button className="pay-btn" onClick={handleCheckout} disabled={loading}>
                        {loading ? "Processing..." : `Pay EGP ${Math.round(totalAmount).toLocaleString()}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
