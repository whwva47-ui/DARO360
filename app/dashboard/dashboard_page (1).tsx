'use client'
import { useState, useEffect } from 'react'

const API = ''

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [feedback, setFeedback] = useState({ stars: 0, text: '' })
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [payMethod, setPayMethod] = useState('mpesa')
  const [payRef, setPayRef] = useState('')
  const [upgradeMsg, setUpgradeMsg] = useState('')
  const [upgradeSent, setUpgradeSent] = useState(false)

  useEffect(() => {
    // Check auth status from URL
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    
    if (auth === 'success') {
      // Clear the auth param from URL
      window.history.replaceState({}, '', '/dashboard')
    }

    // Load user from session
    fetch(API + '/api/user/profile', {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('cic_token') || '') }
    })
    .then(r => r.json())
    .then(d => {
      if (d.email) setUser(d)
      else setUser({ email: 'Guest', plan: 'trial', remaining: 999, totalGenerations: 0, points: 0, trialDay: 1 })
    })
    .catch(() => {
      setUser({ email: 'Guest', plan: 'trial', remaining: 999, totalGenerations: 0, points: 0, trialDay: 1 })
    })
    .finally(() => setLoading(false))
  }, [])

  const planColor = (plan: string) => {
    if (plan === 'pro') return '#a855f7'
    if (plan === 'basic') return '#38bdf8'
    if (plan === 'expired') return '#f43f5e'
    return '#fbbf24'
  }

  const planLabel = (plan: string) => {
    if (plan === 'pro') return 'Pro'
    if (plan === 'basic') return 'Basic'
    if (plan === 'expired') return 'Expired'
    return 'Free Trial'
  }

  async function submitFeedback() {
    if (!feedback.stars || !feedback.text) return
    await fetch(API + '/api/user/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars: feedback.stars, message: feedback.text, platform: 'dashboard' })
    }).catch(() => {})
    setFeedbackSent(true)
  }

  async function submitUpgrade() {
    if (!payRef) { setUpgradeMsg('Please enter your payment reference'); return }
    const r = await fetch(API + '/api/pro/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user?.email, paymentMethod: payMethod, paymentReference: payRef })
    })
    const d = await r.json()
    if (d.success) setUpgradeSent(true)
    else setUpgradeMsg(d.error || 'Error submitting request')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#06060f',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#a855f7',fontFamily:'sans-serif',fontSize:'14px'}}>Loading...</div>
    </div>
  )

  const tabs = ['overview', 'download', 'upgrade', 'referral', 'feedback']

  return (
    <div style={{minHeight:'100vh',background:'#06060f',color:'#e2e8f0',fontFamily:'sans-serif'}}>

      {/* Header */}
      <div style={{padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,0.05)',background:'rgba(6,6,15,0.95)',position:'sticky',top:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>💬</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'13px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
            <div style={{fontSize:'10px',color:'#444460',letterSpacing:'0.5px'}}>Dashboard</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <span style={{fontSize:'12px',color:'#71767b'}}>{user?.email}</span>
          <span style={{padding:'3px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',background:planColor(user?.plan) + '20',color:planColor(user?.plan),border:`1px solid ${planColor(user?.plan)}40`}}>
            {planLabel(user?.plan)}
          </span>
          <a href="/" style={{fontSize:'11px',color:'#444460',textDecoration:'none'}}>← Home</a>
        </div>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 24px'}}>

        {/* Welcome */}
        <div style={{marginBottom:'28px'}}>
          <h1 style={{fontSize:'24px',fontWeight:'400',letterSpacing:'-0.5px',margin:'0 0 6px'}}>Welcome back 👋</h1>
          <p style={{color:'#71767b',fontSize:'13px',margin:0}}>Manage your account, download extensions, and track your usage.</p>
        </div>

        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'12px',marginBottom:'28px'}}>
          {[
            { label:'Plan', value: planLabel(user?.plan), color: planColor(user?.plan) },
            { label:'Replies Today', value: user?.remaining === 999999 ? '∞' : (user?.remaining || 0) + ' left', color:'#22c55e' },
            { label:'Total Generated', value: user?.totalGenerations || 0, color:'#a855f7' },
            { label:'Points', value: (user?.points || 0) + ' pts', color:'#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'16px'}}>
              <div style={{fontSize:'10px',color:'#444460',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>{s.label}</div>
              <div style={{fontSize:'22px',fontWeight:'600',color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Trial warning */}
        {user?.plan === 'trial' && user?.trialDay > 3 && (
          <div style={{background:'rgba(234,179,8,0.06)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'10px',padding:'14px 18px',marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <div style={{color:'#fbbf24',fontWeight:'600',fontSize:'13px',marginBottom:'3px'}}>Trial Day {user?.trialDay} of 7</div>
              <div style={{color:'#71767b',fontSize:'12px'}}>Your daily limit is reducing. Upgrade to keep full access.</div>
            </div>
            <button onClick={()=>setTab('upgrade')} style={{padding:'8px 18px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:'pointer',fontSize:'12px'}}>
              Upgrade Now
            </button>
          </div>
        )}

        {user?.plan === 'expired' && (
          <div style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'14px 18px',marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
            <div>
              <div style={{color:'#f43f5e',fontWeight:'600',fontSize:'13px',marginBottom:'3px'}}>Trial Expired</div>
              <div style={{color:'#71767b',fontSize:'12px'}}>Upgrade to continue generating replies.</div>
            </div>
            <button onClick={()=>setTab('upgrade')} style={{padding:'8px 18px',background:'#f43f5e',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:'pointer',fontSize:'12px'}}>
              Upgrade
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:'flex',gap:'6px',marginBottom:'24px',flexWrap:'wrap'}}>
          {tabs.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{padding:'7px 16px',background:tab===t?'linear-gradient(135deg,#7c3aed,#9333ea)':'rgba(255,255,255,0.03)',border:`1px solid ${tab===t?'rgba(124,58,237,0.5)':'rgba(255,255,255,0.06)'}`,borderRadius:'7px',color:tab===t?'#fff':'#71767b',cursor:'pointer',fontSize:'12px',fontWeight:tab===t?'600':'400',fontFamily:'sans-serif',textTransform:'capitalize',transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div>
            <h3 style={{fontSize:'16px',fontWeight:'400',marginBottom:'16px',color:'#a855f7'}}>What CIC does for you</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'14px'}}>
              {[
                { icon:'✦', title:'AI Reply Generation', desc:'4 unique replies per message — Casual, Flirty, Warm, Playful. Each one specific to what he said.' },
                { icon:'🔥', title:'Re-engage Cold Clients', desc:'One click generates the most intriguing message to bring back men who went quiet.' },
                { icon:'▶', title:'Human Typing Simulator', desc:'Types replies at 60 WPM with natural rhythm and typos. Undetectable by any platform.' },
                { icon:'📷', title:'Photo Compliments', desc:'Detects when he sends a photo and generates a specific genuine compliment.' },
                { icon:'📍', title:'Location Awareness', desc:'Scans his location and gives a believable city 35 minutes away when asked.' },
                { icon:'↻', title:'Regenerate Anytime', desc:'Not happy with the replies? Click regenerate for 4 completely new options.' },
              ].map(f => (
                <div key={f.title} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'18px',transition:'all 0.2s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(168,85,247,0.25)';(e.currentTarget as HTMLDivElement).style.background='rgba(124,58,237,0.04)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor='rgba(255,255,255,0.06)';(e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.02)'}}>
                  <div style={{fontSize:'20px',marginBottom:'8px'}}>{f.icon}</div>
                  <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'5px',color:'#e2e8f0'}}>{f.title}</div>
                  <div style={{fontSize:'12px',color:'#71767b',lineHeight:'1.6'}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Tab */}
        {tab === 'download' && (
          <div>
            <h3 style={{fontSize:'16px',fontWeight:'400',marginBottom:'8px',color:'#a855f7'}}>Download Extensions</h3>
            <p style={{color:'#71767b',fontSize:'13px',marginBottom:'20px'}}>Install both extensions for full platform coverage.</p>

            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <h4 style={{margin:'0 0 6px',fontSize:'14px',color:'#e2e8f0'}}>How to Install</h4>
              {['Download the extension zip file below','Extract the zip on your computer','Open Chrome and go to chrome://extensions','Enable Developer Mode (top right toggle)','Click Load unpacked → select the extracted folder','The CIC capsule button will appear on the right side of any chat page'].map((s,i) => (
                <div key={i} style={{display:'flex',gap:'10px',marginBottom:'8px',fontSize:'12px',color:'#a0a0b0',alignItems:'flex-start'}}>
                  <span style={{color:'#a855f7',fontWeight:'700',flexShrink:0}}>{i+1}.</span>{s}
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              {[
                { name:'CIC — Texting Factory', desc:'For chathomebase.com and Texting Factory', icon:'💬', platforms:'Texting Factory, ChatHomeBase' },
                { name:'CIC — General Platforms', desc:'For all other dating platforms', icon:'🌐', platforms:'Alpha.date, OnlyFans, Fansly, LoyalFans, FanCentro, AdmireMe, FanVue, ManyVids, Unlockd' },
              ].map(ext => (
                <div key={ext.name} style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',padding:'20px',textAlign:'center'}}>
                  <div style={{fontSize:'28px',marginBottom:'8px'}}>{ext.icon}</div>
                  <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'4px'}}>{ext.name}</div>
                  <div style={{color:'#71767b',fontSize:'11px',marginBottom:'6px'}}>{ext.desc}</div>
                  <div style={{color:'#444460',fontSize:'10px',marginBottom:'14px',lineHeight:'1.5'}}>{ext.platforms}</div>
                  <div style={{padding:'8px',background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.15)',borderRadius:'6px',fontSize:'11px',color:'#a855f7'}}>
                    Contact support to get your download link
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:'16px',padding:'14px',background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:'8px',fontSize:'12px',color:'#71767b'}}>
              📧 Email <a href="mailto:whwva47@gmail.com" style={{color:'#22c55e',textDecoration:'none'}}>whwva47@gmail.com</a> with your registered email to receive your download links.
            </div>
          </div>
        )}

        {/* Upgrade Tab */}
        {tab === 'upgrade' && (
          <div style={{maxWidth:'480px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'400',marginBottom:'8px',color:'#a855f7'}}>Upgrade Your Plan</h3>
            <p style={{color:'#71767b',fontSize:'13px',marginBottom:'20px'}}>Submit your payment proof and your account will be upgraded within 24 hours.</p>

            <div style={{background:'rgba(212,163,0,0.05)',border:'1px solid rgba(212,163,0,0.15)',borderRadius:'10px',padding:'16px',marginBottom:'20px',fontSize:'12px'}}>
              <div style={{color:'#fbbf24',fontWeight:'600',marginBottom:'8px'}}>Payment Options — $15/month (Pro) or $8/month (Basic)</div>
              <div style={{color:'#a0a0b0',lineHeight:'1.8'}}>
                📱 <b style={{color:'#e2e8f0'}}>M-Pesa:</b> Paybill 522522, Account 1280446110<br/>
                🅿️ <b style={{color:'#e2e8f0'}}>PayPal:</b> kagwe.felix@gmail.com<br/>
                ₿ <b style={{color:'#e2e8f0'}}>Crypto:</b> BTC, ETH, USDT — contact for address
              </div>
            </div>

            {upgradeSent ? (
              <div style={{textAlign:'center',padding:'32px',background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>✅</div>
                <div style={{color:'#22c55e',fontWeight:'600',marginBottom:'6px'}}>Request Submitted</div>
                <div style={{color:'#71767b',fontSize:'12px'}}>Check your email for confirmation. Approval within 24 hours.</div>
              </div>
            ) : (
              <>
                <div style={{marginBottom:'12px'}}>
                  <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Payment Method</label>
                  <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'12px',outline:'none',fontFamily:'sans-serif'}}>
                    <option value="mpesa">M-Pesa</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Transaction Reference / ID</label>
                  <input type="text" value={payRef} onChange={e=>setPayRef(e.target.value)} placeholder="e.g. QHG7K2X4P or PayPal TX ID"
                    style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'12px',outline:'none',boxSizing:'border-box' as any,fontFamily:'sans-serif'}} />
                </div>
                {upgradeMsg && <div style={{color:'#f43f5e',fontSize:'12px',marginBottom:'12px'}}>{upgradeMsg}</div>}
                <button onClick={submitUpgrade} style={{width:'100%',padding:'11px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontSize:'13px',fontFamily:'sans-serif'}}>
                  Submit Payment Proof →
                </button>
              </>
            )}
          </div>
        )}

        {/* Referral Tab */}
        {tab === 'referral' && (
          <div style={{maxWidth:'520px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'400',marginBottom:'8px',color:'#a855f7'}}>Refer & Earn</h3>
            <p style={{color:'#71767b',fontSize:'13px',marginBottom:'20px'}}>Every referral earns 150 points. 1,500 points = 1 month Pro free.</p>

            <div style={{background:'rgba(234,179,8,0.05)',border:'1px solid rgba(234,179,8,0.15)',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'10px',color:'#71767b',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Your Referral Code</div>
              <div style={{fontSize:'22px',fontWeight:'700',color:'#fbbf24',letterSpacing:'3px',marginBottom:'8px'}}>{user?.referralCode || '— — — —'}</div>
              <button onClick={()=>navigator.clipboard.writeText(`https://chattersinnercircle.vercel.app?ref=${user?.referralCode}`)}
                style={{padding:'7px 16px',background:'rgba(234,179,8,0.1)',border:'1px solid rgba(234,179,8,0.25)',borderRadius:'6px',color:'#fbbf24',cursor:'pointer',fontSize:'11px',fontWeight:'600',fontFamily:'sans-serif'}}>
                Copy Referral Link
              </button>
            </div>

            <div style={{display:'flex',gap:'12px'}}>
              <div style={{flex:1,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'24px',fontWeight:'700',color:'#a855f7'}}>{user?.points || 0}</div>
                <div style={{fontSize:'11px',color:'#71767b',marginTop:'4px'}}>Total Points</div>
              </div>
              <div style={{flex:1,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'24px',fontWeight:'700',color:'#fbbf24'}}>{Math.floor((user?.points || 0) / 150)}</div>
                <div style={{fontSize:'11px',color:'#71767b',marginTop:'4px'}}>Referrals</div>
              </div>
              <div style={{flex:1,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'24px',fontWeight:'700',color:'#22c55e'}}>{1500 - ((user?.points || 0) % 1500)}</div>
                <div style={{fontSize:'11px',color:'#71767b',marginTop:'4px'}}>Points to Pro</div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <div style={{maxWidth:'480px'}}>
            <h3 style={{fontSize:'16px',fontWeight:'400',marginBottom:'8px',color:'#a855f7'}}>Rate Your Experience</h3>
            <p style={{color:'#71767b',fontSize:'13px',marginBottom:'20px'}}>Help us improve CIC with your feedback.</p>

            {feedbackSent ? (
              <div style={{textAlign:'center',padding:'32px',background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px'}}>
                <div style={{fontSize:'32px',marginBottom:'10px'}}>🙏</div>
                <div style={{color:'#22c55e',fontWeight:'600',marginBottom:'6px'}}>Thank you!</div>
                <div style={{color:'#71767b',fontSize:'12px'}}>Your feedback helps make CIC better for everyone.</div>
              </div>
            ) : (
              <>
                <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={()=>setFeedback(p=>({...p,stars:s}))}
                      style={{fontSize:'32px',cursor:'pointer',color:s<=feedback.stars?'#fbbf24':'#1e1e32',transition:'color 0.15s'}}>★</span>
                  ))}
                </div>
                <textarea value={feedback.text} onChange={e=>setFeedback(p=>({...p,text:e.target.value}))} placeholder="What do you love? What could be better?" rows={4}
                  style={{width:'100%',background:'#0a0a14',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'12px',outline:'none',boxSizing:'border-box' as any,resize:'none',fontFamily:'sans-serif',marginBottom:'12px'}} />
                <button onClick={submitFeedback} disabled={!feedback.stars||!feedback.text}
                  style={{width:'100%',padding:'11px',background:!feedback.stars||!feedback.text?'rgba(124,58,237,0.2)':'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:!feedback.stars||!feedback.text?'not-allowed':'pointer',fontSize:'13px',fontFamily:'sans-serif'}}>
                  Submit Feedback
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
