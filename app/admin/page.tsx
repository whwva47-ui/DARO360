'use client'
import { useState, useEffect } from 'react'

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || ''
const API = ''

export default function AdminPanel() {
  const [requests, setRequests] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [tab, setTab] = useState('requests')
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const login = () => {
    if (key === process.env.NEXT_PUBLIC_ADMIN_PASS || key === 'cic_admin_2026') {
      setAuthed(true)
      loadData()
    } else {
      setMsg('Wrong password')
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/data', { headers: { 'X-Admin-Key': 'cic_admin_2026' } })
      const d = await r.json()
      setRequests(d.proRequests || [])
      setUsers(d.users || [])
      setFeedback(d.feedback || [])
    } catch(e) {}
    setLoading(false)
  }

  const handleRequest = async (id: string, action: string, notes?: string) => {
    setLoading(true)
    const r = await fetch('/api/pro/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'cic_admin_2026' },
      body: JSON.stringify({ requestId: id, action, notes })
    })
    const d = await r.json()
    setMsg(d.success ? `${action} successful` : d.error)
    loadData()
    setLoading(false)
  }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:'#0d0d18',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#1a1a2e',padding:'32px',borderRadius:'12px',width:'320px'}}>
        <h2 style={{color:'#a855f7',margin:'0 0 24px',textAlign:'center'}}>CIC Admin</h2>
        <input type="password" placeholder="Admin password" value={key} onChange={e=>setKey(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}
          style={{width:'100%',background:'#0d0d18',border:'1px solid #1e1e32',borderRadius:'6px',padding:'10px',color:'#e2e8f0',boxSizing:'border-box',marginBottom:'12px'}} />
        <button onClick={login} style={{width:'100%',padding:'10px',background:'linear-gradient(135deg,#7c3aed,#d4a300)',border:'none',borderRadius:'6px',color:'#fff',fontWeight:'600',cursor:'pointer'}}>
          Sign In
        </button>
        {msg && <p style={{color:'#f43f5e',marginTop:'12px',textAlign:'center'}}>{msg}</p>}
      </div>
    </div>
  )

  const tabs = ['requests','users','feedback']
  const tabStyle = (t:string) => ({
    padding:'8px 16px',cursor:'pointer',border:'none',
    background: tab===t ? '#7c3aed' : 'transparent',
    color: tab===t ? '#fff' : '#71767b',
    borderRadius:'6px',fontWeight:'600'
  })

  return (
    <div style={{minHeight:'100vh',background:'#0d0d18',color:'#e2e8f0',fontFamily:'sans-serif',padding:'24px'}}>
      <div style={{maxWidth:'900px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
          <h1 style={{color:'#a855f7',margin:0}}>CIC Admin Panel</h1>
          <button onClick={loadData} style={{background:'#1a1a2e',border:'1px solid #1e1e32',color:'#a855f7',padding:'8px 16px',borderRadius:'6px',cursor:'pointer'}}>
            ↻ Refresh
          </button>
        </div>

        {msg && <div style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.3)',padding:'12px',borderRadius:'8px',marginBottom:'16px',color:'#a855f7'}}>{msg}</div>}

        <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>
          {tabs.map(t => <button key={t} style={tabStyle(t)} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
        </div>

        {tab === 'requests' && (
          <div>
            <h2 style={{color:'#fbbf24',marginBottom:'16px'}}>Pro Upgrade Requests ({requests.filter((r:any)=>r.status==='pending').length} pending)</h2>
            {requests.length === 0 && <p style={{color:'#71767b'}}>No requests yet</p>}
            {requests.map((r:any) => (
              <div key={r.id} style={{background:'#1a1a2e',border:`1px solid ${r.status==='pending'?'rgba(234,179,8,0.4)':r.status==='approved'?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:'8px',padding:'16px',marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <p style={{margin:'0 0 4px',fontWeight:'600'}}>{r.email}</p>
                    <p style={{margin:'0 0 4px',color:'#71767b',fontSize:'13px'}}>Phone: {r.phone}</p>
                    <p style={{margin:'0 0 4px',color:'#71767b',fontSize:'13px'}}>Payment: {r.payment_method} — {r.payment_reference}</p>
                    <p style={{margin:'0',color:'#71767b',fontSize:'12px'}}>{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <span style={{padding:'4px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',
                    background:r.status==='pending'?'rgba(234,179,8,0.15)':r.status==='approved'?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)',
                    color:r.status==='pending'?'#fbbf24':r.status==='approved'?'#22c55e':'#f43f5e'}}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                    <button onClick={()=>handleRequest(r.id,'approve')}
                      style={{flex:1,padding:'8px',background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'6px',color:'#22c55e',cursor:'pointer',fontWeight:'600'}}>
                      ✓ Approve
                    </button>
                    <button onClick={()=>handleRequest(r.id,'reject','Payment not verified')}
                      style={{flex:1,padding:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'6px',color:'#f43f5e',cursor:'pointer',fontWeight:'600'}}>
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <h2 style={{color:'#fbbf24',marginBottom:'16px'}}>All Users ({users.length})</h2>
            <div style={{background:'#1a1a2e',borderRadius:'8px',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid #1e1e32'}}>
                    {['Email','Phone','Plan','Change Plan','Usage','Points','Joined'].map(h=>(
                      <th key={h} style={{padding:'10px 12px',textAlign:'left',color:'#71767b',fontWeight:'600'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u:any,i:number) => (
                    <tr key={u.id} style={{borderBottom:'1px solid #111120',background:i%2?'rgba(255,255,255,0.01)':'transparent'}}>
                      <td style={{padding:'10px 12px'}}>{u.email}</td>
                      <td style={{padding:'10px 12px',color:'#71767b'}}>{u.phone||'—'}</td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{padding:'2px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'700',
                          background:u.plan==='pro'?'linear-gradient(135deg,#7c3aed,#d4a300)':u.plan==='expired'?'rgba(239,68,68,0.15)':u.plan==='basic'?'rgba(56,189,248,0.15)':'rgba(255,255,255,0.05)',
                          color:u.plan==='pro'?'#fff':u.plan==='expired'?'#f43f5e':u.plan==='basic'?'#38bdf8':'#e2e8f0'}}>
                          {u.plan?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{padding:'6px 12px'}}>
                        <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                          <select defaultValue="" onChange={async(e)=>{
                            const newPlan = e.target.value
                            if (!newPlan) return
                            if (!confirm(`Change ${u.email} to ${newPlan.toUpperCase()}?`)) { e.target.value=''; return }
                            const r = await fetch('/api/admin/upgrade', {
                              method:'POST',
                              headers:{'Content-Type':'application/json','X-Admin-Key':'cic_admin_2026'},
                              body: JSON.stringify({ userId: u.id, plan: newPlan })
                            })
                            const d = await r.json()
                            if (d.success) { setMsg(`✓ ${u.email} upgraded to ${newPlan}`); loadData() }
                            else { setMsg('Error: ' + d.error) }
                            e.target.value = ''
                          }}
                            style={{background:'#0d0d18',border:'1px solid #1e1e32',borderRadius:'5px',padding:'4px 6px',color:'#e2e8f0',fontSize:'11px',cursor:'pointer',outline:'none'}}>
                            <option value="">Change...</option>
                            <option value="trial">Trial</option>
                            <option value="basic">Basic</option>
                            <option value="pro">Pro</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>
                      </td>
                      <td style={{padding:'10px 12px',color:'#71767b'}}>{u.total_generations||0}</td>
                      <td style={{padding:'10px 12px',color:'#fbbf24'}}>{u.points||0} pts</td>
                      <td style={{padding:'10px 12px',color:'#71767b',fontSize:'12px'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'feedback' && (
          <div>
            <h2 style={{color:'#fbbf24',marginBottom:'16px'}}>Ratings & Feedback ({feedback.length})</h2>
            {feedback.map((f:any) => (
              <div key={f.id} style={{background:'#1a1a2e',border:'1px solid #1e1e32',borderRadius:'8px',padding:'16px',marginBottom:'12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <span style={{fontSize:'18px'}}>{'★'.repeat(f.stars)}{'☆'.repeat(5-f.stars)}</span>
                  <span style={{color:'#71767b',fontSize:'12px'}}>{f.platform} — {new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                {f.message && <p style={{margin:0,color:'#e2e8f0'}}>{f.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
