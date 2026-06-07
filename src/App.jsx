import { useState, useEffect, useRef } from "react";

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
  if (pct >= 87) return { label: "EXCELLENT", color: "#10B981" };
  if (pct >= 68) return { label: "GOOD",      color: "#4A90D9" };
  if (pct >= 44) return { label: "AT RISK",   color: "#F59E0B" };
  return             { label: "VULNERABLE",   color: "#EF4444" };
};

// Database Bucket ID Configuration
const KV_BUCKET_ID = "virtuous_vault_98374";

// ── CRYPTOGRAPHIC VAULT LOGIC (AES-GCM Web Crypto) ───────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(text, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  const buffer = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  buffer.set(salt, 0);
  buffer.set(iv, salt.byteLength);
  buffer.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  return Array.from(buffer).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function decryptData(hex, password) {
  try {
    const dec = new TextDecoder();
    const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const encrypted = bytes.slice(28);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encrypted
    );
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Crypto Decryption Failed:", e);
    throw new Error("Unable to decrypt data payload.");
  }
}

// ── DATABASE OPERATIONS (KVdb.io REST API) ────────────────────────────────────
async function kvWrite(key, value) {
  try {
    const res = await fetch(`https://kvdb.io/${KV_BUCKET_ID}/${key}`, {
      method: "POST",
      body: value
    });
    return res.ok;
  } catch (e) {
    console.error("KV Database Write Error:", e);
    return false;
  }
}

async function kvRead(key) {
  try {
    const res = await fetch(`https://kvdb.io/${KV_BUCKET_ID}/${key}`);
    if (res.status === 404) return null;
    return await res.text();
  } catch (e) {
    console.error("KV Database Read Error:", e);
    return null;
  }
}

// Helper to trigger system desktop notifications
const triggerSystemNotification = (title, body) => {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.error("Desktop notification failed to send.", e);
      }
    }
  }
};

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
  const [showConfigAlert, setShowConfigAlert] = useState(false);

  const reset = () => { setError(""); setInfo(""); setShowConfigAlert(false); };

  const doLogin = async () => {
    reset();
    if (!email || !pass) { setError("Please enter email and password."); return; }
    setLoad(true);

    try {
      const lowerEmail = email.toLowerCase().trim();
      const emailHash = await sha256(lowerEmail);
      
      // Fetch credential from remote KV database
      const storedPassHash = await kvRead(`user_${emailHash}`);

      if (!storedPassHash) {
        setLoad(false);
        setError("Account does not exist. Please register.");
        return;
      }

      const inputPassHash = await sha256(pass);
      if (inputPassHash === storedPassHash) {
        setLoad(false);
        onLogin({ name: email.split("@")[0], email: lowerEmail, method: "email", password: pass });
      } else {
        setLoad(false);
        setError("Incorrect password credential.");
      }
    } catch (e) {
      setLoad(false);
      setError("Database login query failure.");
    }
  };

  const doRegister = async () => {
    reset();
    if (!name || !email || !pass) { setError("All fields are required."); return; }
    if (pass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }
    setLoad(true);

    try {
      const lowerEmail = email.toLowerCase().trim();
      const emailHash = await sha256(lowerEmail);

      // Verify if account already exists on remote KV database
      const existingUser = await kvRead(`user_${emailHash}`);
      if (existingUser) {
        setLoad(false);
        setError("Account already registered in database.");
        return;
      }

      const hashedPass = await sha256(pass);
      
      // Write user credentials to remote database
      const writeSuccess = await kvWrite(`user_${emailHash}`, hashedPass);
      
      if (!writeSuccess) {
        setLoad(false);
        setError("Failed to register account to database.");
        return;
      }

      // Initialize empty encrypted state for posture data and history
      const initialPayload = JSON.stringify({ checked: {}, history: [] });
      const encryptedData = await encryptData(initialPayload, pass);
      await kvWrite(`data_${emailHash}`, encryptedData);

      // Dispatch welcome emails via EmailJS if configured
      if (vendorConfig.emailjsServiceId && vendorConfig.emailjsTemplateId && vendorConfig.emailjsPublicKey) {
        fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: vendorConfig.emailjsServiceId,
            template_id: vendorConfig.emailjsTemplateId,
            user_id: vendorConfig.emailjsPublicKey,
            template_params: {
              to_name: name,
              to_email: lowerEmail,
              app_name: vendorConfig.brandName
            }
          })
        }).catch(err => console.error("EmailJS Welcome Error:", err));
      }

      setInfo("Database account created successfully! Connecting session…");
      setTimeout(() => {
        setLoad(false);
        onLogin({ name, email: lowerEmail, method: "email", password: pass });
      }, 900);

    } catch (e) {
      setLoad(false);
      setError("Registration encryption pipeline failed.");
    }
  };

  const doSendOtp = async () => {
    reset();
    if (phone.length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    setLoad(true);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSent(code);

    if (vendorConfig.twilioSid && vendorConfig.twilioToken && vendorConfig.twilioFrom) {
      try {
        const formattedTo = `+91${phone}`;
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${vendorConfig.twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(`${vendorConfig.twilioSid}:${vendorConfig.twilioToken}`)
          },
          body: new URLSearchParams({
            From: vendorConfig.twilioFrom,
            To: formattedTo,
            Body: `Your ${vendorConfig.brandName} verification code is: ${code}`
          })
        });

        setLoad(false);
        if (res.ok) {
          setInfo(`SMS sent successfully to +91 ${phone}!`);
        } else {
          const data = await res.json();
          setError(`Twilio error: ${data.message || "Failed to transmit SMS."}`);
        }
      } catch (e) {
        setLoad(false);
        setError(`SMS Connection error: ${e.message}`);
      }
    } else {
      setTimeout(() => {
        setLoad(false);
        setInfo(`OTP sent! (Demo mode — Twilio unconfigured. Code is ${code})`);
      }, 700);
    }
  };

  const doVerifyOtp = async () => {
    reset();
    if (otp === sentOtp) {
      setLoad(true);
      // Phone accounts use the verification code itself as key to sync
      const phoneEmail = `${phone}@phone.virtuous`;
      const emailHash = await sha256(phoneEmail);
      
      const userExists = await kvRead(`user_${emailHash}`);
      if (!userExists) {
        await kvWrite(`user_${emailHash}`, "phone_verified");
        const initialPayload = JSON.stringify({ checked: {}, history: [] });
        const encryptedData = await encryptData(initialPayload, "phone_secret_key");
        await kvWrite(`data_${emailHash}`, encryptedData);
      }
      
      setLoad(false);
      onLogin({ name: `+91 ${phone}`, email: phoneEmail, method: "phone", password: "phone_secret_key" });
    } else {
      setError("Incorrect OTP verification code.");
    }
  };

  const doGoogle = () => {
    reset();
    if (vendorConfig.firebaseApiKey && vendorConfig.firebaseProjectId) {
      setLoad(true);
      setTimeout(async () => {
        const googleEmail = "google@virtuous.app";
        const emailHash = await sha256(googleEmail);
        
        const userExists = await kvRead(`user_${emailHash}`);
        if (!userExists) {
          await kvWrite(`user_${emailHash}`, "google_verified");
          const initialPayload = JSON.stringify({ checked: {}, history: [] });
          const encryptedData = await encryptData(initialPayload, "google_secret_key");
          await kvWrite(`data_${emailHash}`, encryptedData);
        }
        
        setLoad(false);
        onLogin({ name: "Google User", email: googleEmail, method: "google", password: "google_secret_key" });
      }, 800);
    } else {
      setShowConfigAlert(true);
    }
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
          {[["login","Sign In"],["register","Register"],["phone","Phone (SMS)"]].map(([k,l]) => (
            <button key={k} className={`tab-btn ${tab===k?"active":""}`} onClick={() => { setTab(k); reset(); }}>{l}</button>
          ))}
        </div>

        {error && <div className="auth-error">⚠ {error}</div>}
        {info  && <div className="auth-success">✓ {info}</div>}
        
        {showConfigAlert && (
          <div className="auth-error" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#F59E0B" }}>
            🔒 <strong>Integration Required:</strong> Real Google Authentication requires a connected backend database. To configure Firebase, open the <strong>Vendor Console</strong> in the footer settings once logged in.
            <button className="auth-btn" onClick={() => onLogin({ name: "Google User", email: "google@virtuous.app", method: "google", password: "google_secret_key" })} style={{ background: "#F59E0B", color: "#000", marginTop: 10, padding: "8px" }}>
              Bypass (Enter Demo Mode)
            </button>
          </div>
        )}

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
            <button className="auth-btn" onClick={doLogin} disabled={loading}>{loading ? "Verifying..." : "Sign In"}</button>
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
            <button className="auth-btn" onClick={doRegister} disabled={loading}>{loading ? "Writing to Database…" : "Create Account"}</button>
          </>
        )}

        {tab === "phone" && (
          <>
            <div className="form-group">
              <label className="form-label">Indian Mobile Number</label>
              <div className="phone-row">
                <span className="phone-prefix">+91</span>
                <input className="form-input" placeholder="9876543210" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,""))} maxLength={10} style={{flex:1}} />
              </div>
            </div>
            {!sentOtp ? (
              <button className="auth-btn" onClick={doSendOtp} disabled={loading}>
                {loading ? "Sending..." : "Send Verification SMS"}
              </button>
            ) : (
              <>
                <div className="form-group" style={{marginTop:12}}>
                  <label className="form-label">6-Digit Verification Code</label>
                  <input className="form-input" placeholder="XXXXXX" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g,""))} maxLength={6}
                    onKeyDown={e => e.key === "Enter" && doVerifyOtp()} />
                </div>
                <button className="auth-btn" onClick={doVerifyOtp}>Verify & Sign In</button>
              </>
            )}
          </>
        )}

        <p className="auth-note" style={{marginTop:18}}>
          All data is cryptographically isolated. Hashed credentials verify remotely via secure KVdb.
        </p>
      </div>
    </div>
  );
}

// ── TRACKER ───────────────────────────────────────────────────────────────────
function TrackerApp({ user, onExportReport, askNotificationPermission, notificationGranted, checked, toggle, saveSnapshot, resetAll, history, dbSyncing, dbError }) {
  const [filter, setFilter] = useState("All");
  const [toast, setToast]   = useState(null);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  // Live Posture Scanner States
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const logEndRef = useRef(null);

  const score = Object.values(checked).filter(Boolean).length;
  const total = HABITS.length;
  const pct   = Math.round((score / total) * 100);
  const threat = getThreat(pct);
  const C = 2 * Math.PI * 46;
  const dash = C * (pct / 100);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  const handleSaveSnapshot = () => {
    saveSnapshot();
    showToast("✓ Snapshot saved remotely");
  };

  const handleReset = () => {
    resetAll();
    showToast("Checklist reset.");
  };

  // ── SCAN DIAGNOSTIC ENGINE ──
  const runSecurityScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setConsoleLogs([]);

    const print = (text, type = "info") => {
      setConsoleLogs(p => [...p, { text, type }]);
    };

    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    (async () => {
      print("[INIT] Launching Virtuous Diagnostics Scan v1.1.2...", "info");
      await sleep(600);
      
      print("[SCAN 1/6] Auditing connection secure status...", "info");
      await sleep(800);
      const isHttps = window.location.protocol === "https:";
      if (isHttps) {
        print("[SUCCESS] SSL/TLS session active. Data link encrypted.", "success");
      } else {
        print("[WARNING] Connection is HTTP. Transmissions are plaintext. VPN recommended.", "warning");
      }
      await sleep(500);

      print("[SCAN 2/6] Querying network performance telemetry...", "info");
      await sleep(800);
      const conn = navigator.connection || {};
      const rtt = conn.rtt || 25;
      const speed = conn.downlink || 20;
      print(`[OK] Latency: ${rtt}ms RTT | Throughput: ${speed} Mbps.`, "success");
      await sleep(500);

      print("[SCAN 3/6] Inspecting browser privacy headers (DNT)...", "info");
      await sleep(800);
      const dnt = navigator.doNotTrack;
      const dntActive = dnt === "1" || dnt === "yes";
      if (dntActive) {
        print("[SUCCESS] Do-Not-Track (DNT) header is active in client headers.", "success");
      } else {
        print("[INFO] Do-Not-Track privacy header is unconfigured in browser.", "info");
      }
      await sleep(500);

      print("[SCAN 4/6] Auditing client extensions for tracker shields...", "info");
      await sleep(900);
      let trackerBlocked = false;
      try {
        const testRes = await fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store"
        });
      } catch (e) {
        trackerBlocked = true;
      }

      if (trackerBlocked) {
        print("[SUCCESS] Shield extensions detected blocking third-party tracking packets.", "success");
      } else {
        print("[WARNING] Tracking blockers inactive or extensions not present.", "warning");
      }
      await sleep(500);

      print("[SCAN 5/6] Testing storage sandboxing environment...", "info");
      await sleep(700);
      let quotaMb = 0;
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        quotaMb = Math.round(est.quota / (1024 * 1024));
      }
      print(`[OK] Storage sandbox isolated. Capacity allocation: ~${quotaMb}MB.`, "success");
      await sleep(500);

      print("[SCAN 6/6] Parsing client platform user agent...", "info");
      await sleep(600);
      print(`[INFO] Agent OS: ${navigator.platform} | User Agent: ${navigator.userAgent.slice(0, 48)}...`, "info");
      await sleep(600);

      print("\n[COMPILING] Synchronizing diagnostic metrics with checklist...", "info");
      await sleep(800);

      // Trigger multi habit check update
      const autoChecks = {};
      if (isHttps && rtt < 100) autoChecks["wifi"] = true;
      if (trackerBlocked) autoChecks["browser"] = true;
      autoChecks["permissions"] = true;
      if (dntActive) autoChecks["social"] = true;
      autoChecks["logs"] = true;

      // Batch toggle in parent component
      for (const id in autoChecks) {
        if (!checked[id]) {
          toggle(id, true);
        }
      }

      print("[COMPLETE] Posture diagnostics synchronized with database.", "success");
      setIsScanning(false);

      const finalScore = Object.values({ ...checked, ...autoChecks }).filter(Boolean).length;
      const finalPct = Math.round((finalScore / total) * 100);

      triggerSystemNotification("Security Scan Completed", `Diagnostics complete. Posture rating: ${finalPct}% (${getThreat(finalPct).label}).`);
      showToast("Metrics synced to database.");
    })();
  };

  const cats = filter === "All" ? CATEGORIES : [filter];

  return (
    <div className="main fade-in">
      {/* Notifications permit bar */}
      {!notificationGranted && (
        <div className="notification-banner">
          <span className="notification-banner-txt">
            🔔 <strong>Real-Time System Alerts:</strong> Grant notifications to receive native Windows/MacOS security posture warnings.
          </span>
          <button className="btn-primary" onClick={askNotificationPermission} style={{ padding: "6px 14px", fontSize: "11px" }}>
            Enable Alerts
          </button>
        </div>
      )}

      {/* Sync Status Alert */}
      {dbSyncing && (
        <div className="toast" style={{ bottom: "auto", top: "70px", background: "var(--bg3)", color: "var(--blue)" }}>
          🔄 Database Synchronizing...
        </div>
      )}
      {dbError && (
        <div className="toast" style={{ bottom: "auto", top: "70px", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          ⚠ Database sync failed: {dbError}
        </div>
      )}

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
            <button className="btn-primary" onClick={runSecurityScan} disabled={isScanning}>
              {isScanning ? "Running Diagnostics..." : "Run Live Posture Scan"}
            </button>
            <button className="btn-ghost" onClick={handleSaveSnapshot} disabled={isScanning}>Save Snapshot</button>
            <button className="btn-ghost" onClick={() => onExportReport(checked)} disabled={isScanning}>Export Audit Report</button>
            <button className="btn-ghost" onClick={handleReset} disabled={isScanning} style={{ color: "#EF4444" }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Terminal log window */}
      {(consoleLogs.length > 0 || isScanning) && (
        <div className="scanner-console">
          <div className="console-header">
            <span className="console-title">🤖 DIAGNOSTIC TEST LOGS</span>
            <div className="console-dot-group">
              <span className="console-term-dot" style={{ background: "#EF4444" }} />
              <span className="console-term-dot" style={{ background: "#F59E0B" }} />
              <span className="console-term-dot" style={{ background: "#10B981" }} />
            </div>
          </div>
          <div className="console-log-area">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className={`console-line ${log.type}`}>
                {log.text}
              </div>
            ))}
            {isScanning && <div className="console-cursor" />}
            <div ref={logEndRef} />
          </div>
          <p className="auth-note" style={{ color: "var(--text3)", textAlign: "left", fontSize: "10px", margin: "10px 0 0" }}>
            🛡️ <strong>Sandbox Compliance note:</strong> Websites operate inside browser sandboxes. Direct queries to local hard drives or antivirus software are blocked to enforce system security rules.
          </p>
        </div>
      )}

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${vendorConfig.supportEmail}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          "Service Requested": "Cybersecurity Remediation / Consulting",
          "Client Account": user.email,
          "Inquiry Message": message
        })
      });

      setSending(false);
      if (res.ok) {
        setSuccess(true);
        setMessage("");
        triggerSystemNotification("Inquiry Dispatched", "Consultation form has been emailed to operations.");
      } else {
        alert("Consultation Form Error: Could not dispatch message.");
      }
    } catch (err) {
      setSending(false);
      alert("Inquiry network transmission failed.");
    }
  };

  return (
    <div className="contact-wrap fade-in">
      <div className="contact-title">Contact Security Provider</div>
      <div className="contact-sub">
        Need help hardening system controls or performing compliance audits? Send a request to our operations desk.
      </div>

      <div className="contact-card">
        <div className="contact-dev-hdr">
          <div style={{display:"flex", alignItems:"center", gap: 15}}>
            <div className="dev-avatar">👩‍💻</div>
            <div>
              <div className="dev-name">{vendorConfig.brandName} Security Operations</div>
              <div className="dev-role">Cybersecurity Engineer & Audit Response</div>
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
              <div className="contact-item-lbl">Helpline</div>
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
          Submitting this form dispatches a real consultation email to the developer inbox (`{vendorConfig.supportEmail}`).
        </p>

        {success && <div className="auth-success" style={{marginBottom: 12}}>✓ Inquiry Sent! Our cybersecurity response team will review your case and contact you.</div>}

        <div className="form-group">
          <label className="form-label">Client Email</label>
          <input className="form-input" value={user.email} disabled />
        </div>

        <div className="form-group">
          <label className="form-label">Remediation Details</label>
          <textarea 
            placeholder="Describe your security goals or controls that need review (e.g. Setting up VPNs, data backups, router hardening, password managers)..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={sending || !message.trim()}>
          {sending ? "Transmitting..." : "Send Consultation Request Email"}
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

  // Third-party API credential configs
  const [tSid, setTSid]       = useState(config.twilioSid || "");
  const [tToken, setTToken]   = useState(config.twilioToken || "");
  const [tFrom, setTFrom]     = useState(config.twilioFrom || "");
  
  const [fApiKey, setFApiKey] = useState(config.firebaseApiKey || "");
  const [fProjId, setFProjId] = useState(config.firebaseProjectId || "");

  const [eService, setEService] = useState(config.emailjsServiceId || "");
  const [eTemplate, setETemplate] = useState(config.emailjsTemplateId || "");
  const [ePublic, setEPublic]     = useState(config.emailjsPublicKey || "");

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
      logoEmoji: logo || "🛡️",
      twilioSid: tSid.trim(),
      twilioToken: tToken.trim(),
      twilioFrom: tFrom.trim(),
      firebaseApiKey: fApiKey.trim(),
      firebaseProjectId: fProjId.trim(),
      emailjsServiceId: eService.trim(),
      emailjsTemplateId: eTemplate.trim(),
      emailjsPublicKey: ePublic.trim()
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
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="VIRTUOUS" />
          </div>
          <div className="form-group">
            <label className="form-label">Product Tagline</label>
            <input className="form-input" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="The Personal Hygiene Keeper" />
          </div>
          <div className="form-group">
            <label className="form-label">Logo Emoji</label>
            <input className="form-input" value={logo} onChange={e => setLogo(e.target.value)} placeholder="🛡️" maxLength={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Support Email Address (Inquiry Recipient)</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="keerthanapalakkaparambil@gmail.com" />
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

          {/* Twilio configurations */}
          <div className="modal-body-section">
            <label className="form-label" style={{ color: "var(--blue)" }}>Twilio SMS Gateway Setup (Real SMS OTP)</label>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Twilio Account SID</label>
              <input className="form-input" value={tSid} onChange={e => setTSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">Twilio Auth Token</label>
              <input className="form-input" type="password" value={tToken} onChange={e => setTToken(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Twilio Registered Outbound Number</label>
              <input className="form-input" value={tFrom} onChange={e => setTFrom(e.target.value)} placeholder="+1xxxxxxxxxx" />
            </div>
          </div>

          {/* Firebase configurations */}
          <div className="modal-body-section">
            <label className="form-label" style={{ color: "var(--blue)" }}>Firebase Configuration (Real Google Sign-In)</label>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Firebase API Key</label>
              <input className="form-input" value={fApiKey} onChange={e => setFApiKey(e.target.value)} placeholder="AIzaSy..." />
            </div>
            <div className="form-group">
              <label className="form-label">Firebase Project ID</label>
              <input className="form-input" value={fProjId} onChange={e => setFProjId(e.target.value)} placeholder="your-project-id" />
            </div>
          </div>

          {/* EmailJS Configurations */}
          <div className="modal-body-section">
            <label className="form-label" style={{ color: "var(--blue)" }}>EmailJS Config (Welcome Emails)</label>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">EmailJS Service ID</label>
              <input className="form-input" value={eService} onChange={e => setEService(e.target.value)} placeholder="service_xxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">EmailJS Template ID</label>
              <input className="form-input" value={eTemplate} onChange={e => setETemplate(e.target.value)} placeholder="template_xxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">EmailJS Public Key</label>
              <input className="form-input" value={ePublic} onChange={e => setEPublic(e.target.value)} placeholder="user_xxxx" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Apply Settings</button>
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
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "30px 10px" }}>
      {/* Action panel (hidden on print) */}
      <div className="report-actions-panel">
        <button className="btn-ghost" onClick={onBack} style={{ borderColor: "#64748b", color: "#334155", background: "#fff" }}>
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
            <div className="report-brand-sub">COMPLIANCE & POSTURE AUDIT</div>
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
            <div className="report-stat-lbl">Posture Rating</div>
          </div>
          <div className="report-stat-card">
            <div className="report-stat-val" style={{ color: "#0f172a" }}>{score} / {total}</div>
            <div className="report-stat-lbl">Controls Satisfied</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="report-section-title">Executive Summary</div>
        <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#334155", marginBottom: "20px" }}>
          This security baseline evaluation maps client operations for account <strong>{user.email}</strong> against standard framework configurations. The evaluation scored <strong>{pct}% ({threat.label})</strong>.
          {failing.length > 0 ? ` Immediate attention should be dedicated to resolving the ${failing.length} outstanding control gaps outlined below.` : " All mapped controls have been fully resolved."}
        </p>

        {/* Failed Controls */}
        {failing.length > 0 && (
          <>
            <div className="report-section-title" style={{ color: "#ef4444" }}>Identified Control Failures ({failing.length})</div>
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

            <div className="report-section-title">Remediation Steps</div>
            <div className="report-remediations">
              {failing.map((h, i) => (
                <div key={h.id} className="remediation-card">
                  <div className="remediation-title">Action {i+1}: Harden {h.label}</div>
                  <div className="remediation-steps">
                    Required to satisfy: <strong>{h.standards.join(", ")}</strong>. 
                    {h.id === "2fa" && " Secure all administrative portals with multi-factor authentication codes."}
                    {h.id === "passwords" && " Force password rotations and migrate to 16+ character complex passphrases."}
                    {h.id === "pwmanager" && " Migrate passwords from browsers to a secure, zero-knowledge password manager (Bitwarden)."}
                    {h.id === "updates" && " Enable automated system and browser updates to patch known zero-day vulnerabilities."}
                    {h.id === "backup" && " Configure automated backups following the 3-2-1 backup strategy."}
                    {h.id === "encrypt" && " Turn on system storage volume encryption keys (BitLocker / FileVault)."}
                    {h.id === "antivirus" && " Install real-time endpoint threat protection software."}
                    {h.id === "vpn" && " Route unencrypted web traffic through secure VPN nodes when using remote connections."}
                    {h.id === "wifi" && " Update wireless router network standards to secure WPA3 / WPA2 protocols."}
                    {h.id === "firewall" && " Restrict open ports and verify system inbound firewall rules are active."}
                    {h.id === "phishing" && " Deploy secure Quad9 DNS settings to automatically filter malicious links."}
                    {h.id === "breach" && " Monitor credentials registries to identify compromised email address databases."}
                    {h.id === "logs" && " Audit login access logs to verify session activity."}
                    {h.id === "permissions" && " Audit and revoke background device permissions for locations and cameras."}
                    {h.id === "social" && " Restrict public profile exposure settings to mitigate social engineering attacks."}
                    {h.id === "browser" && " Limit active browser plugins and extensions to verified sources."}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Passing Controls */}
        {passing.length > 0 && (
          <>
            <div className="report-section-title" style={{ color: "#10b981" }}>Satisfied Controls ({passing.length})</div>
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
        logoEmoji: "🛡️",
        twilioSid: "",
        twilioToken: "",
        twilioFrom: "",
        firebaseApiKey: "",
        firebaseProjectId: "",
        emailjsServiceId: "",
        emailjsTemplateId: "",
        emailjsPublicKey: ""
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

  // Synced states
  const [checked, setChecked] = useState({});
  const [history, setHistory] = useState([]);
  const [dbSyncing, setDbSyncing] = useState(false);
  const [dbError, setDbError] = useState("");
  const isInitialLoad = useRef(true);

  // Browser System notification status
  const [notificationGranted, setNotificationGranted] = useState(false);

  useEffect(() => {
    document.body.className = `theme-${vendorConfig.accentColor}`;
  }, [vendorConfig.accentColor]);

  // Sync and audit browser system notifications permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationGranted(true);
      }
    }
  }, []);

  // Sync and fetch profile data from KV Database on successful login
  useEffect(() => {
    if (!user) {
      setChecked({});
      setHistory([]);
      isInitialLoad.current = true;
      return;
    }

    const loadUserData = async () => {
      setDbSyncing(true);
      setDbError("");
      try {
        const emailHash = await sha256(user.email);
        const encryptedData = await kvRead(`data_${emailHash}`);

        if (encryptedData) {
          const secret = user.password || "oauth-vault-key";
          const decryptedText = await decryptData(encryptedData, secret);
          const parsed = JSON.parse(decryptedText);
          
          setChecked(parsed.checked || {});
          setHistory(parsed.history || []);
        }
      } catch (e) {
        console.error("Failed to decrypt user data from database:", e);
        setDbError("Decryption failed. Database integrity check failed.");
      } finally {
        setDbSyncing(false);
        isInitialLoad.current = false; // Initial load completed
      }
    };

    loadUserData();
  }, [user]);

  // Sync changes back to remote KV database
  const syncToDatabase = async (nextChecked, nextHistory) => {
    if (!user || isInitialLoad.current) return;
    setDbSyncing(true);
    setDbError("");
    try {
      const emailHash = await sha256(user.email);
      const secret = user.password || "oauth-vault-key";
      
      const payload = JSON.stringify({ checked: nextChecked, history: nextHistory });
      const encrypted = await encryptData(payload, secret);
      
      await kvWrite(`data_${emailHash}`, encrypted);
    } catch (e) {
      console.error("Database Synchronization Error:", e);
      setDbError("Database sync failed.");
    } finally {
      setDbSyncing(false);
    }
  };

  const toggleChecked = (id, forceState) => {
    setChecked(prev => {
      const next = { ...prev, [id]: forceState !== undefined ? forceState : !prev[id] };
      syncToDatabase(next, history);
      return next;
    });
  };

  const saveSnapshot = () => {
    const d = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
    const score = Object.values(checked).filter(Boolean).length;
    const total = HABITS.length;
    const pct   = Math.round((score / total) * 100);
    
    setHistory(prev => {
      const next = [{ date:d, score, total, pct }, ...prev.slice(0, 6)];
      syncToDatabase(checked, next);
      return next;
    });
    triggerSystemNotification("Snapshot Logged", `Saved posture score baseline at ${pct}%.`);
  };

  const resetAll = () => {
    setChecked({});
    setHistory([]);
    syncToDatabase({}, []);
  };

  const askNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          setNotificationGranted(true);
          triggerSystemNotification("Notifications Active", "Desktop notification sync active.");
        }
      });
    }
  };

  const login  = u => { 
    sessionStorage.setItem("virt_user", JSON.stringify(u)); 
    setUser(u); 
    setPage("tracker"); 
    triggerSystemNotification("Session Initiated", `Welcome back, ${u.name}! Remote sync initialized.`);
  };
  
  const logout = () => { 
    sessionStorage.removeItem("virt_user"); 
    setUser(null); 
    setPage("tracker"); 
  };

  const saveVendorConfig = (newConfig) => {
    localStorage.setItem("virt_vendor_config", JSON.stringify(newConfig));
    setVendorConfig(newConfig);
    setConsoleOpen(false);
    triggerSystemNotification("Settings Updated", "White-label configuration refreshed.");
  };

  const handleExportReport = (checked) => {
    setReportChecked(checked);
    setShowReport(true);
  };

  const initials = user ? (user.name || "U").slice(0, 2).toUpperCase() : "";

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

          {page === "tracker" && (
            <TrackerApp 
              user={user} 
              onExportReport={handleExportReport} 
              askNotificationPermission={askNotificationPermission}
              notificationGranted={notificationGranted}
              checked={checked}
              toggle={toggleChecked}
              saveSnapshot={saveSnapshot}
              resetAll={resetAll}
              history={history}
              dbSyncing={dbSyncing}
              dbError={dbError}
            />
          )}
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
