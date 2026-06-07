import { useState, useEffect } from "react";

const HABITS = [
  { 
    id: "passwords",   
    icon: "🔑", 
    label: "Strong Passwords",       
    desc: "All accounts use unique, complex passwords",              
    category: "Access Control",
    standards: ["CIS 4.1", "NIST PR.AC-1", "SOC2 CC6.1"]
  },
  { 
    id: "2fa",         
    icon: "🛡️", 
    label: "2FA / MFA Enabled",      
    desc: "Multi-factor authentication active on critical accounts", 
    category: "Access Control",
    standards: ["CIS 4.2", "NIST PR.AC-6", "GDPR Art 32"]
  },
  { 
    id: "pwmanager",   
    icon: "🗝️", 
    label: "Password Manager",       
    desc: "Using a trusted password manager like Bitwarden",        
    category: "Access Control",
    standards: ["CIS 4.1", "SOC2 CC6.1"]
  },
  { 
    id: "updates",     
    icon: "⚡", 
    label: "System Updates",          
    desc: "OS and all apps updated to latest versions",             
    category: "System Health",
    standards: ["CIS 8.1", "NIST PR.IP-1"]
  },
  { 
    id: "backup",      
    icon: "💾", 
    label: "Data Backed Up",          
    desc: "Critical files backed up to a secure location",         
    category: "System Health",
    standards: ["CIS 11.1", "NIST PR.IP-4", "SOC2 CC9.1"]
  },
  { 
    id: "encrypt",     
    icon: "🔐", 
    label: "Device Encryption",       
    desc: "Full-disk encryption enabled on all devices",           
    category: "System Health",
    standards: ["CIS 3.11", "NIST PR.DS-1", "GDPR Art 32"]
  },
  { 
    id: "antivirus",   
    icon: "🧬", 
    label: "Antivirus Active",        
    desc: "Real-time protection running and definitions current",   
    category: "System Health",
    standards: ["CIS 10.1", "NIST DE.CM-4"]
  },
  { 
    id: "vpn",         
    icon: "📡", 
    label: "VPN on Public WiFi",      
    desc: "VPN used whenever on untrusted networks",               
    category: "Network Safety",
    standards: ["CIS 12.1", "NIST PR.DS-5"]
  },
  { 
    id: "wifi",        
    icon: "🌐", 
    label: "Secure Home Network",     
    desc: "Router uses WPA3/WPA2 with a strong passphrase",        
    category: "Network Safety",
    standards: ["CIS 12.1", "NIST PR.DS-2"]
  },
  { 
    id: "firewall",    
    icon: "🧱", 
    label: "Firewall Enabled",        
    desc: "Software or hardware firewall is active",               
    category: "Network Safety",
    standards: ["CIS 12.2", "NIST PR.DS-5"]
  },
  { 
    id: "phishing",    
    icon: "🎣", 
    label: "Phishing Vigilance",      
    desc: "Verified email senders and links before clicking",      
    category: "Threat Awareness",
    standards: ["CIS 14.1", "NIST PR.AT-1"]
  },
  { 
    id: "breach",      
    icon: "🚨", 
    label: "Breach Check",            
    desc: "Checked HaveIBeenPwned for compromised credentials",    
    category: "Threat Awareness",
    standards: ["CIS 14.1", "NIST DE.CM-1"]
  },
  { 
    id: "logs",        
    icon: "📋", 
    label: "Account Activity Review", desc: "Reviewed login history for suspicious access",          
    category: "Threat Awareness",
    standards: ["CIS 14.1", "NIST DE.CM-1"]
  },
  { 
    id: "permissions", icon: "🔒", 
    label: "App Permissions Audit",   
    desc: "Reviewed and restricted unnecessary app permissions",   
    category: "Privacy",
    standards: ["CIS 2.1", "SOC2 CC6.3"]
  },
  { 
    id: "social",      
    icon: "👁️", 
    label: "Social Media Privacy",   
    desc: "Profile visibility and sharing settings reviewed",      
    category: "Privacy",
    standards: ["SOC2 CC6.3"]
  },
  { 
    id: "browser",     
    icon: "🧩", 
    label: "Browser Extensions",      
    desc: "Only essential, trusted extensions installed",          
    category: "Privacy",
    standards: ["CIS 2.1", "SOC2 CC6.2"]
  },
];

const CATEGORIES = ["Access Control", "System Health", "Network Safety", "Threat Awareness", "Privacy"];

const TIPS = [
  "Use a password manager like Bitwarden — it's free, open-source, and end-to-end encrypted.",
  "Enable login alerts on your email and banking apps to catch unauthorized access early.",
  "Reboot your router monthly to clear potential session hijacks and apply firmware updates.",
  "Never reuse passwords — even a secure one becomes a liability once any site is breached.",
  "Audit your browser extensions quarterly; many collect far more data than needed.",
  "Use a separate email alias for sign-ups to isolate breaches from your main inbox.",
  "Disable Bluetooth and WiFi on your phone when not in use to shrink your attack surface.",
  "Set devices to auto-lock after 30 seconds of inactivity to prevent physical access.",
  "Regularly review which apps have access to your location, camera, and microphone.",
  "Set up a free account on HaveIBeenPwned and enable breach notifications.",
];

const getThreat = (pct) => {
  if (pct >= 87) return { label: "EXCELLENT", color: "#4A90D9" };
  if (pct >= 68) return { label: "GOOD",      color: "#5BA3E8" };
  if (pct >= 44) return { label: "AT RISK",   color: "#7EAACC" };
  return             { label: "VULNERABLE",   color: "#A0B8CC" };
};

const DEMO_USERS = { "user@virtuous.app": "Virtuous@2024" };

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, vendorConfig }) {
  const [tab, setTab]       = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [sentOtp, setSent]  = useState("");
  const [error, setError]   = useState("");
  const [info, setInfo]     = useState("");
  const [loading, setLoad]  = useState(false);

  const reset = () => { setError(""); setInfo(""); };

  const doLogin = () => {
    reset();
    if (!email || !pass) { setError("Please enter email and password."); return; }
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      const stored = JSON.parse(localStorage.getItem("virt_users") || "{}");
      const all = { ...DEMO_USERS, ...stored };
      if (all[email.toLowerCase().trim()] === pass) {
        onLogin({ name: email.split("@")[0], email: email.toLowerCase().trim(), method: "email" });
      } else { setError("Incorrect email or password."); }
    }, 650);
  };

  const doRegister = () => {
    reset();
    if (!name || !email || !pass) { setError("All fields are required."); return; }
    if (pass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      const stored = JSON.parse(localStorage.getItem("virt_users") || "{}");
      if (stored[email.toLowerCase()] || DEMO_USERS[email.toLowerCase()]) {
        setError("An account with this email already exists."); return;
      }
      stored[email.toLowerCase()] = pass;
      localStorage.setItem("virt_users", JSON.stringify(stored));
      setInfo("Account created! Signing you in…");
      setTimeout(() => onLogin({ name, email: email.toLowerCase(), method: "email" }), 900);
    }, 700);
  };

  const doSendOtp = () => {
    reset();
    if (phone.length < 8) { setError("Enter a valid phone number."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSent(code);
    setInfo(`OTP sent! (Demo mode — your code is ${code})`);
  };

  const doVerifyOtp = () => {
    reset();
    if (otp === sentOtp) onLogin({ name: `+91 ${phone}`, email: `${phone}@phone.virtuous`, method: "phone" });
    else setError("Incorrect OTP. Please try again.");
  };

  const doGoogle = () => {
    reset(); setLoad(true);
    setTimeout(() => { setLoad(false); onLogin({ name: "Google User", email: "google@virtuous.app", method: "google" }); }, 800);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">{vendorConfig.logoEmoji}</div>
          <div className="auth-brand">{vendorConfig.brandName}</div>
          <div className="auth-tagline">{vendorConfig.tagline}</div>
        </div>

        <div className="tab-row">
          {[["login","Sign In"],["register","Register"],["phone","Phone"]].map(([k,l]) => (
            <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={() => { setTab(k); reset(); }}>{l}</button>
          ))}
        </div>

        {error && <div className="auth-error">⚠ {error}</div>}
        {info  && <div className="auth-success">✓ {info}</div>}

        {tab === "login" && (
          <>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doLogin()} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doLogin()} />
            </div>
            <button className="auth-btn" onClick={doLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
            <div className="divider"><div className="divider-line"/><span className="divider-text">OR</span><div className="divider-line"/></div>
            <button className="google-btn" onClick={doGoogle} disabled={loading}><GoogleIcon /> Continue with Google</button>
            <p className="auth-note">
              Demo: <span style={{color:"var(--blue)"}}>user@virtuous.app</span> / <span style={{color:"var(--blue)"}}>Virtuous@2024</span>
            </p>
          </>
        )}

        {tab === "register" && (
          <>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 8 characters" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
            <button className="auth-btn" onClick={doRegister} disabled={loading}>{loading ? "Creating…" : "Create Account"}</button>
          </>
        )}

        {tab === "phone" && (
          <>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="phone-row">
                <span className="phone-prefix">+91</span>
                <input className="form-input" placeholder="9876543210" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,""))} maxLength={10} style={{flex:1}} />
              </div>
            </div>
            {!sentOtp ? (
              <button className="auth-btn" onClick={doSendOtp}>Send OTP</button>
            ) : (
              <>
                <div className="form-group" style={{marginTop:12}}>
                  <label className="form-label">Enter OTP</label>
                  <input className="form-input" placeholder="6-digit code" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g,""))} maxLength={6}
                    onKeyDown={e => e.key === "Enter" && doVerifyOtp()} />
                </div>
                <button className="auth-btn" onClick={doVerifyOtp}>Verify & Sign In</button>
              </>
            )}
          </>
        )}

        <p className="auth-note" style={{marginTop:14}}>
          All data is stored locally on your device. Nothing leaves your browser.{" "}
          <span className="auth-link">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

// ── TRACKER ───────────────────────────────────────────────────────────────────
function TrackerApp({ user, onExportReport }) {
  const sk = `virt_checked_${user.email}`;
  const hk = `virt_hist_${user.email}`;

  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(sk) || "{}"); } catch { return {}; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(hk) || "[]"); } catch { return []; }
  });
  const [filter, setFilter] = useState("All");
  const [toast, setToast]   = useState(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const score = Object.values(checked).filter(Boolean).length;
  const total = HABITS.length;
  const pct   = Math.round((score / total) * 100);
  const threat = getThreat(pct);
  const C = 2 * Math.PI * 46;
  const dash = C * (pct / 100);

  useEffect(() => { localStorage.setItem(sk, JSON.stringify(checked)); }, [checked, sk]);

  const toggle = id => setChecked(p => ({ ...p, [id]: !p[id] }));

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const saveSnapshot = () => {
    const d = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
    const nh = [{ date:d, score, total, pct }, ...history.slice(0, 6)];
    setHistory(nh); localStorage.setItem(hk, JSON.stringify(nh));
    showToast(`✓ Snapshot saved — ${d}`);
  };

  const resetAll = () => { setChecked({}); showToast("Checklist reset."); };

  const cats = filter === "All" ? CATEGORIES : [filter];

  return (
    <div className="main fade-in">
      {/* Hero */}
      <div className="score-hero">
        <div className="score-ring">
          <svg width={104} height={104}>
            <circle cx={52} cy={52} r={46} fill="none" stroke="rgba(74,144,217,0.1)" strokeWidth={5}/>
            <circle cx={52} cy={52} r={46} fill="none" stroke="var(--blue)" strokeWidth={5}
              strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
              style={{transform:"rotate(-90deg)",transformOrigin:"52px 52px",transition:"stroke-dasharray .6s cubic-bezier(.16, 1, 0.3, 1)"}}/>
          </svg>
          <div className="score-ring-inner">
            <span className="score-pct">{pct}%</span>
            <span className="score-frac">{score}/{total}</span>
          </div>
        </div>
        <div className="score-info">
          <div className="score-status">
            <div className="score-dot" style={{background:threat.color,boxShadow:`0 0 7px ${threat.color}`}}/>
            <span className="score-label">STATUS: {threat.label}</span>
          </div>
          <div className="score-bar-wrap">
            <div className="score-bar-lbl"><span>COMPLIANCE POSTURE</span><span>{score} of {total} requirements met</span></div>
            <div className="score-bar-track"><div className="score-bar-fill" style={{width:`${pct}%`}}/></div>
          </div>
          <div className="action-row">
            <button className="btn-primary" onClick={saveSnapshot}>Save Snapshot</button>
            <button className="btn-primary" onClick={() => onExportReport(checked)}>Export Audit Report</button>
            <button className="btn-ghost"   onClick={resetAll}>Reset Dashboard</button>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="tip-bar">
        <span style={{fontSize:14,flexShrink:0,marginTop:1}}>💡</span>
        <span className="tip-text"><strong>Compliance Tip:</strong> {tip}</span>
      </div>

      {/* Breakdown */}
      <div className="sec-title">Framework Segment Breakdown</div>
      <div className="breakdown-grid">
        {CATEGORIES.map(cat => {
          const ch = HABITS.filter(h => h.category === cat);
          const cs = ch.filter(h => checked[h.id]).length;
          const cp = Math.round((cs / ch.length) * 100);
          return (
            <div key={cat} className="breakdown-card">
              <div className="breakdown-name">{cat}</div>
              <div className="breakdown-frac"><span>{cs}/{ch.length} Controls</span><span>{cp}%</span></div>
              <div className="mini-track"><div className="mini-fill" style={{width:`${cp}%`}}/></div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="filter-row">
        {["All", ...CATEGORIES].map(f => (
          <button key={f} className={`filter-chip ${filter===f?"active":""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Habits */}
      {cats.map(cat => (
        <div key={cat}>
          <div className="sec-title">{cat}</div>
          {HABITS.filter(h => h.category === cat).map(h => (
            <div key={h.id} className={`habit-row ${checked[h.id]?"done":""}`} onClick={() => toggle(h.id)}>
              <span className="habit-icon">{h.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div className="habit-name">{h.label}</div>
                <div className="habit-desc">{h.desc}</div>
                <div className="badge-group">
                  {h.standards.map((std, i) => (
                    <span key={i} className="badge-framework">{std}</span>
                  ))}
                </div>
              </div>
              <div className={`check-box ${checked[h.id]?"on":""}`}>{checked[h.id]?"✓":""}</div>
            </div>
          ))}
        </div>
      ))}

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="sec-title" style={{marginTop:28}}>Compliance Audit History</div>
          {history.map((e, i) => (
            <div key={i} className="history-row">
              <span className="history-date">{e.date}</span>
              <div className="history-track">
                <div className="history-fill" style={{width:`${e.pct}%`}}>
                  {e.pct > 12 && <span className="history-pct">{e.pct}% Compliance</span>}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ── CONTACT & INQUIRY PAGE ────────────────────────────────────────────────────────
function ContactPage({ user, vendorConfig }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSuccess(true);
      setMessage("");
      setTimeout(() => setSuccess(false), 5000);
    }, 1200);
  };

  return (
    <div className="contact-wrap fade-in">
      <div className="contact-title">Contact Security Provider</div>
      <div className="contact-sub">
        Need help remediating your failed security controls, upgrading your architecture, or conducting a full organizational compliance audit? Contact our cybersecurity lead.
      </div>

      <div className="contact-card">
        <div className="contact-dev-hdr">
          <div style={{display:"flex", alignItems:"center", gap: 15}}>
            <div className="dev-avatar">🛡️</div>
            <div>
              <div className="dev-name">{vendorConfig.brandName} Security Services</div>
              <div className="dev-role">Cybersecurity Operations & Audit Response</div>
            </div>
          </div>
        </div>
        <div className="contact-items">
          <div className="contact-item">
            <div className="contact-item-icon">📧</div>
            <div>
              <div className="contact-item-lbl">Email Operations</div>
              <div className="contact-item-val"><a href={`mailto:${vendorConfig.supportEmail}`}>{vendorConfig.supportEmail}</a></div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-item-icon">📱</div>
            <div>
              <div className="contact-item-lbl">Secure Helpline</div>
              <div className="contact-item-val"><a href={`tel:${vendorConfig.supportPhone.replace(/\s+/g, "")}`}>{vendorConfig.supportPhone}</a></div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-item-icon">🌍</div>
            <div>
              <div className="contact-item-lbl">Jurisdiction</div>
              <div className="contact-item-val">Kerala, India (Global Coverage)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="about-card">
        <div className="about-ttl">About {vendorConfig.brandName}</div>
        <div className="about-txt">
          <strong>{vendorConfig.brandName}</strong> provides enterprise-grade, privacy-first personal and organizational cyber hygiene tracking audits.
          Our solution maps individual operations to world-class security controls including 
          NIST CSF, CIS Controls, SOC 2, and GDPR.
          All assessment data is processed <strong>locally inside your secure web client</strong>.
        </div>
        <div className="tag-row">
          <span className="tag">React Compliance Core</span>
          <span className="tag">Local Audit Processing</span>
          <span className="tag">MSSP Ready</span>
          <span className="tag">NIST / CIS Aligned</span>
        </div>
      </div>

      {/* LEAD-GEN CONSULTATION FORM */}
      <form onSubmit={handleSubmit} className="consult-form">
        <div className="about-ttl">Request Security Consulting / Remediation</div>
        <p className="auth-note" style={{textAlign:"left", marginTop: 4, marginBottom: 12, color:"var(--text2)"}}>
          Let our expert review your report and build a custom remediation plan for your home or business.
        </p>

        {success && <div className="auth-success" style={{marginBottom: 12}}>✓ Inquiry Submitted! Our security operations lead will contact you within 24 hours.</div>}

        <div className="form-group">
          <label className="form-label">Client Account</label>
          <input className="form-input" value={user.email} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Scope of Services / Remediation Needs</label>
          <textarea 
            placeholder="E.g., I need assistance setting up full disk encryption, router firewall configurations, or configuring corporate password managers..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={sending || !message.trim()}>
          {sending ? "Transmitting..." : "Submit Consultation Request"}
        </button>
      </form>
    </div>
  );
}

// ── VENDOR CONFIGURATION MODAL ────────────────────────────────────────────────
function VendorConsoleModal({ config, onClose, onSave }) {
  const [name, setName]       = useState(config.brandName);
  const [tagline, setTagline] = useState(config.tagline);
  const [email, setEmail]     = useState(config.supportEmail);
  const [phone, setPhone]     = useState(config.supportPhone);
  const [color, setColor]     = useState(config.accentColor);
  const [logo, setLogo]       = useState(config.logoEmoji);

  const colors = [
    { key: "cyber-blue",   label: "Cyber Blue",  code: "#4A90D9" },
    { key: "steel-gray",   label: "Steel Gray",  code: "#8FA0B5" },
    { key: "dark-emerald", label: "Dark Emerald",code: "#10B981" },
    { key: "crimson-red",  label: "Crimson Red", code: "#EF4444" }
  ];

  const handleSave = () => {
    onSave({
      brandName: name || "VIRTUOUS",
      tagline: tagline || "The Personal Cyber Hygiene Keeper",
      supportEmail: email || "keerthanapalakkaparambil@gmail.com",
      supportPhone: phone || "+91 8943892585",
      accentColor: color,
      logoEmoji: logo || "🛡️"
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-hdr">
          <span className="modal-title">🖥️ VENDOR CONTROL CONSOLE</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Vendor Brand Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="E.g., VIRTUOUS" />
          </div>
          <div className="form-group">
            <label className="form-label">Product Tagline</label>
            <input className="form-input" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="E.g., The Personal Hygiene Keeper" />
          </div>
          <div className="form-group">
            <label className="form-label">Logo Emoji</label>
            <input className="form-input" value={logo} onChange={e => setLogo(e.target.value)} placeholder="E.g., 🛡️" maxLength={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Support Email Address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Helpline / Phone Number</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 8943892585" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Brand Theme Accent Color</label>
            <div className="theme-selector-grid">
              {colors.map(c => (
                <div 
                  key={c.key} 
                  className={`theme-option ${color === c.key ? "selected" : ""}`}
                  onClick={() => setColor(c.key)}
                >
                  <div className="theme-color-dot" style={{ background: c.code }} />
                  <span className="theme-option-lbl">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Apply Branding</button>
        </div>
      </div>
    </div>
  );
}

// ── COMPLIANCE AUDIT REPORT VIEW (PDF FRIENDLY) ──────────────────────────────
function ComplianceAuditReport({ user, checkedData, vendorConfig, onBack }) {
  const score = HABITS.filter(h => checkedData[h.id]).length;
  const total = HABITS.length;
  const pct   = Math.round((score / total) * 100);
  const threat = getThreat(pct);

  const passing = HABITS.filter(h => checkedData[h.id]);
  const failing = HABITS.filter(h => !checkedData[h.id]);

  const timestamp = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "40px 20px" }}>
      {/* Action panel (hidden on print) */}
      <div className="report-actions-panel">
        <button className="btn-ghost" onClick={onBack} style={{ borderColor: "#64748b", color: "#334155" }}>
          &larr; Back to Dashboard
        </button>
        <button className="btn-primary" onClick={() => window.print()} style={{ background: "#0f172a" }}>
          🖨️ Print / Save to PDF
        </button>
      </div>

      {/* Main Report Page */}
      <div className="report-wrap">
        <div className="report-header">
          <div>
            <div className="report-brand-name">{vendorConfig.logoEmoji} {vendorConfig.brandName}</div>
            <div className="report-brand-sub">POSTURE & COMPLIANCE AUDIT REPORT</div>
          </div>
          <div className="report-meta">
            <div><strong>Audit Reference:</strong> SEC-{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            <div><strong>Client ID:</strong> {user.email}</div>
            <div><strong>Audit Date:</strong> {timestamp}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="report-hero-stats">
          <div className="report-stat-card">
            <div className="report-stat-val" style={{ color: "#0f172a" }}>{pct}%</div>
            <div className="report-stat-lbl">Compliance Score</div>
          </div>
          <div className="report-stat-card">
            <div className="report-stat-val" style={{ color: threat.color }}>{threat.label}</div>
            <div className="report-stat-lbl">Security Rating</div>
          </div>
          <div className="report-stat-card">
            <div className="report-stat-val" style={{ color: "#0f172a" }}>{score} / {total}</div>
            <div className="report-stat-lbl">Controls Met</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="report-section-title">Executive Summary</div>
        <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#334155", marginBottom: "20px" }}>
          This security evaluation assesses the digital endpoints and security practices associated with client profile <strong>{user.email}</strong>. 
          The audit covers 16 checks across 5 core security categories. 
          The client achieved an overall score of <strong>{pct}% ({threat.label})</strong>. 
          A compliance rating of <strong>{threat.label}</strong> suggests that there are {failing.length > 0 ? `${failing.length} key control gaps that require immediate remediation to prevent unauthorized data exposure.` : "no immediately visible security vulnerabilities. Excellent work."}
        </p>

        {/* Failed Controls (Prioritized Remediation) */}
        {failing.length > 0 && (
          <>
            <div className="report-section-title" style={{ color: "#b91c1c" }}>Prioritized Remediations Needed ({failing.length})</div>
            <div className="report-list">
              {failing.map(h => (
                <div key={h.id} className="report-item fail">
                  <div>
                    <div className="report-item-title">{h.icon} {h.label}</div>
                    <div className="report-item-desc">{h.desc}</div>
                    <div style={{ marginTop: "6px" }}>
                      {h.standards.map((std, idx) => (
                        <span key={idx} style={{ fontSize: "8px", fontWeight: "600", marginRight: "5px", padding: "1px 4px", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: "3px", background: "#fef2f2" }}>
                          {std}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="report-item-badge fail">Vulnerable</span>
                </div>
              ))}
            </div>

            <div className="report-section-title">Remediation Action Steps</div>
            <div className="report-remediations">
              {failing.map((h, i) => (
                <div key={h.id} className="remediation-card">
                  <div className="remediation-title">Step {i+1}: Remediate {h.label}</div>
                  <div className="remediation-steps">
                    We recommend immediate implementation of this control to satisfy: <strong>{h.standards.join(", ")}</strong>. 
                    {h.id === "2fa" && " Enable multi-factor authentication (MFA/2FA) on your identity providers, critical banking, and developer tools using hardware tokens (YubiKey) or authenticator apps (Aegis, Google Authenticator)."}
                    {h.id === "passwords" && " Audit all existing accounts. Migrate any weak or duplicate credentials to secure, randomly generated 16+ character passphrases."}
                    {h.id === "pwmanager" && " Set up an encrypted password manager account (e.g., Bitwarden or 1Password). Save all credentials and secure notes there rather than relying on browser-level storage."}
                    {h.id === "updates" && " Turn on automated OS/firmware updates on workstations, mobile platforms, and firewalls. Establish weekly patch-checks."}
                    {h.id === "backup" && " Configure 3-2-1 backup policies: 3 copies of data, 2 different media types, 1 encrypted copy off-site (cold storage or secure cloud)."}
                    {h.id === "encrypt" && " Activate full-disk encryption (BitLocker on Windows Pro, FileVault on macOS, LUKS on Linux). Store recovery keys in physical fireproof vaults."}
                    {h.id === "antivirus" && " Install enterprise malware endpoint controls, run deep directory scans, and enable heuristic process behavior monitoring."}
                    {h.id === "vpn" && " Force secure VPN tunnels when operating on remote or unverified access points to prevent machine-in-the-middle packet sniffing."}
                    {h.id === "wifi" && " Access router administration controls, replace factory default logins, disable remote WAN management, and enable WPA3 network protocols."}
                    {h.id === "firewall" && " Verify system ports and enable OS-level firewalls. Block all unsolicited inbound socket connections."}
                    {h.id === "phishing" && " Deploy secure DNS services (e.g., Quad9) to automatically block known malicious domains, and audit email links."}
                    {h.id === "breach" && " Monitor HaveIBeenPwned. Perform credentials rotations immediately if any of your active email aliases appear in public dumps."}
                    {h.id === "logs" && " Inspect session trackers on Google, GitHub, and financial logs. Sign out of active, older device terminals."}
                    {h.id === "permissions" && " Revoke background permissions (Camera, Location, Contacts) on non-critical mobile/workstation apps."}
                    {h.id === "social" && " Restrict public visibility profiles on LinkedIn and social networks. Avoid posting operational setups or sensitive data."}
                    {h.id === "browser" && " Remove outdated, non-verified web extensions. Audit third-party extensions for invasive data mining access."}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Passing Controls */}
        {passing.length > 0 && (
          <>
            <div className="report-section-title" style={{ color: "#047857" }}>Satisfied Controls & Standards ({passing.length})</div>
            <div className="report-list">
              {passing.map(h => (
                <div key={h.id} className="report-item pass">
                  <div>
                    <div className="report-item-title">{h.icon} {h.label}</div>
                    <div className="report-item-desc">{h.desc}</div>
                  </div>
                  <span className="report-item-badge pass">Compliant</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="report-footer">
          <div>{vendorConfig.brandName} Cybersecurity Compliance Suite &middot; confidential audit printout</div>
          <div style={{ marginTop: "4px" }}>Support contact: {vendorConfig.supportEmail} &middot; {vendorConfig.supportPhone}</div>
        </div>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("virt_user") || "null"); } catch { return null; }
  });
  
  const [vendorConfig, setVendorConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("virt_vendor_config");
      return saved ? JSON.parse(saved) : {
        brandName: "VIRTUOUS",
        tagline: "The Personal Cyber Hygiene Keeper",
        supportEmail: "keerthanapalakkaparambil@gmail.com",
        supportPhone: "+91 8943892585",
        accentColor: "cyber-blue",
        logoEmoji: "🛡️"
      };
    } catch {
      return {
        brandName: "VIRTUOUS",
        tagline: "The Personal Cyber Hygiene Keeper",
        supportEmail: "keerthanapalakkaparambil@gmail.com",
        supportPhone: "+91 8943892585",
        accentColor: "cyber-blue",
        logoEmoji: "🛡️"
      };
    }
  });

  const [page, setPage] = useState("tracker");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [reportChecked, setReportChecked] = useState({});

  useEffect(() => {
    // Dynamic theme styling inject
    document.body.className = `theme-${vendorConfig.accentColor}`;
  }, [vendorConfig.accentColor]);

  const login  = u => { sessionStorage.setItem("virt_user", JSON.stringify(u)); setUser(u); setPage("tracker"); };
  const logout = () => { sessionStorage.removeItem("virt_user"); setUser(null); setPage("tracker"); };

  const saveVendorConfig = (newConfig) => {
    localStorage.setItem("virt_vendor_config", JSON.stringify(newConfig));
    setVendorConfig(newConfig);
    setConsoleOpen(false);
  };

  const handleExportReport = (checked) => {
    setReportChecked(checked);
    setShowReport(true);
  };

  const initials = user ? (user.name || "U").slice(0, 2).toUpperCase() : "";

  // If in Print Preview Mode, render the report directly
  if (showReport) {
    return (
      <ComplianceAuditReport 
        user={user} 
        checkedData={reportChecked} 
        vendorConfig={vendorConfig} 
        onBack={() => setShowReport(false)} 
      />
    );
  }

  return (
    <>
      {!user ? (
        <AuthPage onLogin={login} vendorConfig={vendorConfig} />
      ) : (
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-left">
              <span style={{fontSize:16}}>{vendorConfig.logoEmoji}</span>
              <div>
                <div className="topbar-brand">{vendorConfig.brandName}</div>
                <div className="topbar-sub">{vendorConfig.tagline}</div>
              </div>
            </div>
            <div className="topbar-right">
              <button className={`nav-link ${page==="tracker"?"active":""}`} onClick={() => setPage("tracker")}>Dashboard</button>
              <button className={`nav-link ${page==="contact"?"active":""}`} onClick={() => setPage("contact")}>Contact</button>
              <button className="nav-link" onClick={() => setConsoleOpen(true)} style={{ color: "var(--blue)", border: "1px solid var(--border)", background: "rgba(74, 144, 217, 0.05)" }}>
                Vendor Console
              </button>
              <div className="user-pill">
                <div className="user-avatar">{initials}</div>
                <span className="user-name">{user.name}</span>
              </div>
              <button className="logout-btn" onClick={logout}>Sign out</button>
            </div>
          </header>

          {page === "tracker" && <TrackerApp user={user} onExportReport={handleExportReport} />}
          {page === "contact" && <ContactPage user={user} vendorConfig={vendorConfig} />}

          <footer className="footer">
            <span className="footer-brand mono">{vendorConfig.brandName} &middot; Cybersecurity White-Label Suite &middot; v1.0</span>
            <button className="footer-link" onClick={() => setConsoleOpen(true)}>Configure White-Labeling</button>
          </footer>
        </div>
      )}

      {consoleOpen && (
        <VendorConsoleModal 
          config={vendorConfig} 
          onClose={() => setConsoleOpen(false)} 
          onSave={saveVendorConfig} 
        />
      )}
    </>
  );
}
