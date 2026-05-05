
'use client'
import { useState } from 'react'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [referral, setReferral] = useState('')
  const [step, setStep] = useState<'home'|'signup'|'sent'>('home')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSignup = async () => {
    if (!email || !phone) { setMsg('Email and phone are required'); return }
    setLoading(true)
    setMsg('')
    const r = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, referralCode: referral || undefined })
    })
    const d = await r.json()
    if (d.success) setStep('sent')
    else setMsg(d.error || 'Something went wrong')
    setLoading(false)
  }

  const plans = [
    { name: 'Free Trial', price: 'Free', period: '3 days', color: '#71767b', features: ['Unlimited AI replies for 3 days', 'Degrading limits days 4-7', 'Basic AI model', 'Both extensions included'] },
    { name: 'Basic', price: 'Free', period: 'after trial', color: '#60a5fa', features: ['50 messages per 4 days', 'Standard AI quality', 'Both extensions', 'Email support'] },
    { name: 'Pro', price: '$15', period: 'per month', color: '#a855f7', features: ['Unlimited messages', 'Premium AI quality', 'Priority responses', 'Admin approved access', 'Referral rewards'] },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#080810',color:'#e2e8f0',fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>

      {/* Header */}
      <div style={{padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #1e1e32'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>💬</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'14px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
            <div style={{fontSize:'11px',color:'#444460'}}>AI Reply Assistant</div>
          </div>
        </div>
        <button onClick={()=>setStep('signup')} style={{padding:'8px 20px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'600',cursor:'pointer',fontSize:'13px'}}>
          Get Started
        </button>
      </div>

      {step === 'sent' ? (
        <div style={{maxWidth:'480px',margin:'80px auto',textAlign:'center',padding:'0 24px'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>📧</div>
          <h2 style={{color:'#a855f7',marginBottom:'12px'}}>Check Your Email</h2>
          <p style={{color:'#71767b',lineHeight:'1.6'}}>We sent a magic link to <b style={{color:'#e2e8f0'}}>{email}</b>. Click it to activate your account. The link expires in 1 hour.</p>
          <button onClick={()=>setStep('home')} style={{marginTop:'24px',padding:'10px 24px',background:'transparent',border:'1px solid #1e1e32',borderRadius:'8px',color:'#71767b',cursor:'pointer'}}>Back to home</button>
        </div>

      ) : step === 'signup' ? (
        <div style={{maxWidth:'420px',margin:'60px auto',padding:'0 24px'}}>
          <h2 style={{color:'#a855f7',marginBottom:'8px'}}>Create Your Account</h2>
          <p style={{color:'#71767b',marginBottom:'24px',fontSize:'14px'}}>Get 3 days unlimited free. No credit card needed.</p>

          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'11px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
              style={{width:'100%',background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'14px',boxSizing:'border-box',outline:'none'}} />
          </div>

          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'11px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Phone Number (with country code)</label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+254712345678"
              style={{width:'100%',background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'14px',boxSizing:'border-box',outline:'none'}} />
            <div style={{fontSize:'11px',color:'#444460',marginTop:'4px'}}>Required to prevent duplicate accounts</div>
          </div>

          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'11px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Referral Code (optional)</label>
            <input type="text" value={referral} onChange={e=>setReferral(e.target.value)} placeholder="Enter referral code"
              style={{width:'100%',background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'14px',boxSizing:'border-box',outline:'none'}} />
          </div>

          {msg && <div style={{color:'#f43f5e',fontSize:'13px',marginBottom:'14px'}}>{msg}</div>}

          <button onClick={handleSignup} disabled={loading}
            style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontSize:'14px',fontWeight:'600',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
            {loading ? 'Sending...' : 'Send Magic Link →'}
          </button>

          <p style={{textAlign:'center',marginTop:'16px',fontSize:'13px',color:'#444460'}}>
            By signing up you agree to our terms. One account per person.
          </p>

          <button onClick={()=>setStep('home')} style={{display:'block',margin:'12px auto 0',background:'none',border:'none',color:'#444460',cursor:'pointer',fontSize:'13px'}}>← Back</button>
        </div>

      ) : (
        <>
          {/* Hero */}
          <div style={{maxWidth:'700px',margin:'0 auto',padding:'80px 24px 40px',textAlign:'center'}}>
            <div style={{display:'inline-block',padding:'6px 16px',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'20px',fontSize:'12px',color:'#a855f7',marginBottom:'20px'}}>
              AI-Powered Reply Assistant for Dating Platforms
            </div>
            <h1 style={{fontSize:'clamp(28px,5vw,48px)',fontWeight:'800',margin:'0 0 16px',lineHeight:'1.2'}}>
              Replies That Get
              <span style={{display:'block',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                Him Hooked
              </span>
            </h1>
            <p style={{fontSize:'16px',color:'#71767b',lineHeight:'1.6',maxWidth:'520px',margin:'0 auto 32px'}}>
              CIC generates smart, warm, and irresistible replies for women on dating platforms. Never run out of things to say.
            </p>
            <button onClick={()=>setStep('signup')} style={{padding:'14px 36px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'16px',fontWeight:'700',cursor:'pointer',boxShadow:'0 4px 20px rgba(124,58,237,0.4)'}}>
              Start Free — 3 Days Unlimited
            </button>
          </div>

          {/* Downloads */}
          <div style={{maxWidth:'700px',margin:'0 auto',padding:'0 24px 60px'}}>
            <h2 style={{textAlign:'center',color:'#fbbf24',marginBottom:'20px'}}>Download Extensions</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
              {[
                { name:'CIC — Texting Factory', desc:'For chathomebase.com / Texting Factory', icon:'💬', url:'#tf' },
                { name:'CIC — General Platforms', desc:'For Alpha.date, OnlyFans, Fansly & more', icon:'🌐', url:'#gp' }
              ].map(ext => (
                <div key={ext.name} style={{background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'10px',padding:'20px',textAlign:'center'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>{ext.icon}</div>
                  <div style={{fontWeight:'600',marginBottom:'6px',fontSize:'14px'}}>{ext.name}</div>
                  <div style={{color:'#71767b',fontSize:'12px',marginBottom:'14px'}}>{ext.desc}</div>
                  <div style={{color:'#444460',fontSize:'11px',padding:'8px',background:'#080810',borderRadius:'6px'}}>
                    Sign up and login to access download links
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div style={{maxWidth:'800px',margin:'0 auto',padding:'0 24px 80px'}}>
            <h2 style={{textAlign:'center',marginBottom:'32px'}}>Simple Pricing</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px'}}>
              {plans.map(plan => (
                <div key={plan.name} style={{background:'#0f0f1a',border:`1px solid ${plan.name==='Pro'?'rgba(168,85,247,0.4)':'#1e1e32'}`,borderRadius:'10px',padding:'24px',position:'relative',overflow:'hidden'}}>
                  {plan.name==='Pro' && <div style={{position:'absolute',top:'12px',right:'12px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',padding:'3px 10px',borderRadius:'12px',fontSize:'10px',fontWeight:'700',color:'#fff'}}>BEST</div>}
                  <div style={{color:plan.color,fontWeight:'700',marginBottom:'8px'}}>{plan.name}</div>
                  <div style={{fontSize:'28px',fontWeight:'800',marginBottom:'4px'}}>{plan.price}</div>
                  <div style={{color:'#444460',fontSize:'12px',marginBottom:'20px'}}>{plan.period}</div>
                  {plan.features.map(f => (
                    <div key={f} style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'8px',fontSize:'13px',color:'#71767b'}}>
                      <span style={{color:plan.color,flexShrink:0}}>✓</span>{f}
                    </div>
                  ))}
                  <button onClick={()=>setStep('signup')} style={{width:'100%',marginTop:'16px',padding:'10px',background:plan.name==='Pro'?'linear-gradient(135deg,#7c3aed,#d4a300)':'transparent',border:`1px solid ${plan.color}`,borderRadius:'7px',color:plan.name==='Pro'?'#fff':plan.color,cursor:'pointer',fontWeight:'600',fontSize:'13px'}}>
                    {plan.name==='Pro'?'Get Pro':'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Referral */}
          <div style={{maxWidth:'600px',margin:'0 auto',padding:'0 24px 80px',textAlign:'center'}}>
            <div style={{background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'12px',padding:'32px'}}>
              <div style={{fontSize:'32px',marginBottom:'12px'}}>🎁</div>
              <h3 style={{color:'#fbbf24',marginBottom:'12px'}}>Refer & Earn Pro</h3>
              <p style={{color:'#71767b',fontSize:'14px',lineHeight:'1.6',margin:'0 0 16px'}}>
                Refer a friend and earn <b style={{color:'#fbbf24'}}>150 points</b>. Collect <b style={{color:'#fbbf24'}}>1,500 points</b> to get 1 month of Pro free — worth $15.
              </p>
              <p style={{color:'#444460',fontSize:'12px'}}>Your referral code is shown inside the extension after signup.</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{borderTop:'1px solid #111120',padding:'24px',textAlign:'center',color:'#444460',fontSize:'12px'}}>
            <p>Chatter's Inner Circle &copy; 2026 — AI Reply Assistant for Dating Platforms</p>
            <p style={{marginTop:'4px'}}>For support: <a href="mailto:whwva47@gmail.com" style={{color:'#a855f7',textDecoration:'none'}}>whwva47@gmail.com</a></p>
          </div>
        </>
      )}
    </div>
  )
}
