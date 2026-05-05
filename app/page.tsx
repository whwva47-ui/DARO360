'use client'
import { useState } from 'react'

const SITE = 'https://cic-backend-b1ej.vercel.app'

export default function LandingPage() {
  const [step, setStep] = useState('home')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [referral, setReferral] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSignup() {
    if (!email || !phone) { setMsg('Email and phone are required'); return }
    setLoading(true)
    setMsg('')
    try {
      const r = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, referralCode: referral || undefined })
      })
      const d = await r.json()
      if (d.success) setStep('sent')
      else setMsg(d.error || 'Something went wrong')
    } catch(e) {
      setMsg('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (step === 'sent') return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center',padding:'40px',maxWidth:'440px'}}>
        <div style={{fontSize:'56px',marginBottom:'16px'}}>📧</div>
        <h2 style={{color:'#a855f7',marginBottom:'12px'}}>Check Your Email</h2>
        <p style={{color:'#71767b',lineHeight:'1.6'}}>We sent a magic link to <b style={{color:'#e2e8f0'}}>{email}</b>. Click it to sign in. Expires in 1 hour.</p>
        <button onClick={()=>setStep('home')} style={{marginTop:'24px',padding:'10px 24px',background:'transparent',border:'1px solid #1e1e32',borderRadius:'8px',color:'#71767b',cursor:'pointer',fontFamily:'sans-serif'}}>← Back</button>
      </div>
    </div>
  )

  if (step === 'signup') return (
    <div style={{minHeight:'100vh',background:'#080810',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{width:'100%',maxWidth:'400px',padding:'32px 24px'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'14px',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'24px',marginBottom:'12px'}}>💬</div>
          <h2 style={{color:'#a855f7',margin:'0 0 4px',fontSize:'20px'}}>Create Your Account</h2>
          <p style={{color:'#71767b',margin:0,fontSize:'13px'}}>3 days unlimited free. No credit card.</p>
        </div>

        {[
          {label:'Email Address',type:'email',val:email,set:setEmail,ph:'you@example.com',note:''},
          {label:'Phone Number (with country code)',type:'tel',val:phone,set:setPhone,ph:'+254712345678',note:'Required to prevent duplicate accounts'},
          {label:'Referral Code (optional)',type:'text',val:referral,set:setReferral,ph:'Enter referral code',note:''},
        ].map(f => (
          <div key={f.label} style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'10px',color:'#71767b',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
              style={{width:'100%',background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'7px',padding:'10px 12px',color:'#e2e8f0',fontSize:'13px',boxSizing:'border-box' as any,outline:'none',fontFamily:'sans-serif'}} />
            {f.note && <div style={{fontSize:'10px',color:'#444460',marginTop:'3px'}}>{f.note}</div>}
          </div>
        ))}

        {msg && <div style={{color:'#f43f5e',fontSize:'12px',marginBottom:'12px'}}>{msg}</div>}

        <button onClick={handleSignup} disabled={loading}
          style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#7c3aed,#9333ea,#d4a300)',border:'none',borderRadius:'8px',color:'#fff',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif',opacity:loading?0.7:1}}>
          {loading ? 'Sending...' : 'Send Magic Link →'}
        </button>

        <p style={{textAlign:'center',fontSize:'11px',color:'#444460',marginTop:'14px'}}>One account per person. Phone required.</p>
        <button onClick={()=>setStep('home')} style={{display:'block',margin:'8px auto 0',background:'none',border:'none',color:'#444460',cursor:'pointer',fontSize:'12px',fontFamily:'sans-serif'}}>← Back to home</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#080810',color:'#e2e8f0',fontFamily:'sans-serif'}}>

      {/* Nav */}
      <div style={{padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #1e1e32',position:'sticky',top:0,background:'#080810',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'34px',height:'34px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>💬</div>
          <div>
            <div style={{fontWeight:'700',fontSize:'13px',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Chatter's Inner Circle</div>
            <div style={{fontSize:'10px',color:'#444460'}}>AI Reply Assistant</div>
          </div>
        </div>
        <button onClick={()=>setStep('signup')} style={{padding:'8px 18px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'7px',color:'#fff',fontWeight:'600',cursor:'pointer',fontSize:'12px',fontFamily:'sans-serif'}}>
          Get Started
        </button>
      </div>

      {/* Hero */}
      <div style={{maxWidth:'680px',margin:'0 auto',padding:'70px 24px 40px',textAlign:'center'}}>
        <div style={{display:'inline-block',padding:'5px 14px',background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',borderRadius:'20px',fontSize:'11px',color:'#a855f7',marginBottom:'18px'}}>
          AI Reply Assistant for Dating Platforms
        </div>
        <h1 style={{fontSize:'clamp(26px,5vw,46px)',fontWeight:'800',margin:'0 0 14px',lineHeight:'1.2'}}>
          Replies That Get Him
          <span style={{display:'block',background:'linear-gradient(135deg,#a855f7,#fbbf24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Hooked Every Time
          </span>
        </h1>
        <p style={{fontSize:'15px',color:'#71767b',lineHeight:'1.6',maxWidth:'480px',margin:'0 auto 28px'}}>
          CIC generates smart, warm replies for women on dating platforms. Works on Texting Factory, Alpha.date, OnlyFans, Fansly, and more.
        </p>
        <button onClick={()=>setStep('signup')} style={{padding:'13px 32px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'9px',color:'#fff',fontSize:'15px',fontWeight:'700',cursor:'pointer',boxShadow:'0 4px 20px rgba(124,58,237,0.35)',fontFamily:'sans-serif'}}>
          Start Free — 3 Days Unlimited
        </button>
      </div>

      {/* Extensions */}
      <div style={{maxWidth:'680px',margin:'0 auto',padding:'0 24px 60px'}}>
        <h2 style={{textAlign:'center',color:'#fbbf24',marginBottom:'18px',fontSize:'18px'}}>Download Extensions</h2>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          {[
            {name:'CIC — Texting Factory',desc:'chathomebase.com & Texting Factory',icon:'💬'},
            {name:'CIC — General Platforms',desc:'Alpha.date, OnlyFans, Fansly & more',icon:'🌐'}
          ].map(e => (
            <div key={e.name} style={{background:'#0f0f1a',border:'1px solid #1e1e32',borderRadius:'10px',padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:'28px',marginBottom:'8px'}}>{e.icon}</div>
              <div style={{fontWeight:'600',fontSize:'13px',marginBottom:'5px'}}>{e.name}</div>
              <div style={{color:'#71767b',fontSize:'11px',marginBottom:'12px'}}>{e.desc}</div>
              <button onClick={()=>setStep('signup')} style={{padding:'7px 16px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'6px',color:'#fff',fontSize:'11px',fontWeight:'600',cursor:'pointer',fontFamily:'sans-serif'}}>
                Sign Up to Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{maxWidth:'780px',margin:'0 auto',padding:'0 24px 70px'}}>
        <h2 style={{textAlign:'center',marginBottom:'28px',fontSize:'18px'}}>Simple Pricing</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'14px'}}>
          {[
            {name:'Free Trial',price:'Free',period:'3 days',color:'#71767b',badge:'',features:['Unlimited replies days 1-3','Reducing limits days 4-7','Both extensions included','All platforms supported']},
            {name:'Basic',price:'Free',period:'after trial',color:'#60a5fa',badge:'',features:['50 messages per 4 days','Standard AI quality','Both extensions','Email support']},
            {name:'Pro',price:'$15',period:'per month',color:'#a855f7',badge:'BEST',features:['Unlimited messages','Premium AI quality','Admin approved','Referral rewards','Priority support']},
          ].map(p => (
            <div key={p.name} style={{background:'#0f0f1a',border:`1px solid ${p.name==='Pro'?'rgba(168,85,247,0.4)':'#1e1e32'}`,borderRadius:'10px',padding:'22px',position:'relative'}}>
              {p.badge && <div style={{position:'absolute',top:'10px',right:'10px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',padding:'2px 8px',borderRadius:'10px',fontSize:'9px',fontWeight:'700',color:'#fff'}}>{p.badge}</div>}
              <div style={{color:p.color,fontWeight:'700',marginBottom:'6px',fontSize:'13px'}}>{p.name}</div>
              <div style={{fontSize:'26px',fontWeight:'800',marginBottom:'3px'}}>{p.price}</div>
              <div style={{color:'#444460',fontSize:'11px',marginBottom:'18px'}}>{p.period}</div>
              {p.features.map(f => (
                <div key={f} style={{display:'flex',gap:'7px',marginBottom:'7px',fontSize:'12px',color:'#71767b',alignItems:'flex-start'}}>
                  <span style={{color:p.color,flexShrink:0}}>✓</span>{f}
                </div>
              ))}
              <button onClick={()=>setStep('signup')} style={{width:'100%',marginTop:'14px',padding:'9px',background:p.name==='Pro'?'linear-gradient(135deg,#7c3aed,#d4a300)':'transparent',border:`1px solid ${p.color}`,borderRadius:'6px',color:p.name==='Pro'?'#fff':p.color,cursor:'pointer',fontWeight:'600',fontSize:'12px',fontFamily:'sans-serif'}}>
                {p.name==='Pro'?'Get Pro':'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Referral */}
      <div style={{maxWidth:'560px',margin:'0 auto',padding:'0 24px 70px',textAlign:'center'}}>
        <div style={{background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:'12px',padding:'28px'}}>
          <div style={{fontSize:'30px',marginBottom:'10px'}}>🎁</div>
          <h3 style={{color:'#fbbf24',marginBottom:'10px',fontSize:'16px'}}>Refer Friends, Earn Pro Free</h3>
          <p style={{color:'#71767b',fontSize:'13px',lineHeight:'1.6',margin:'0 0 12px'}}>
            Every referral earns <b style={{color:'#fbbf24'}}>150 points</b>. Collect <b style={{color:'#fbbf24'}}>1,500 points</b> and get 1 month Pro free ($15 value).
          </p>
          <p style={{color:'#444460',fontSize:'11px',margin:0}}>Your referral code appears in the extension after signup.</p>
        </div>
      </div>

      {/* Payment */}
      <div style={{maxWidth:'560px',margin:'0 auto',padding:'0 24px 70px',textAlign:'center'}}>
        <div style={{background:'rgba(124,58,237,0.05)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'12px',padding:'28px'}}>
          <h3 style={{color:'#a855f7',marginBottom:'12px',fontSize:'16px'}}>How to Pay for Pro</h3>
          <p style={{color:'#71767b',fontSize:'13px',lineHeight:'1.6',margin:'0 0 12px'}}>
            Payment details are sent privately to your email when you request a Pro upgrade inside the extension. We support M-Pesa and PayPal.
          </p>
          <p style={{color:'#444460',fontSize:'11px',margin:0}}>Your payment information is kept strictly confidential.</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{borderTop:'1px solid #111120',padding:'20px',textAlign:'center',color:'#444460',fontSize:'11px'}}>
        <p style={{margin:'0 0 4px'}}>Chatter's Inner Circle © 2026 — AI Reply Assistant</p>
        <p style={{margin:0}}>Support: <a href="mailto:whwva47@gmail.com" style={{color:'#a855f7',textDecoration:'none'}}>whwva47@gmail.com</a></p>
      </div>
    </div>
  )
}
