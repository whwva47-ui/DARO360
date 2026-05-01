"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
  last_login: string
  daily_generations: number
  total_generations: number
  max_daily_generations: number
  plan: string
  plan_status: string
  is_admin: boolean
}

interface UsageLog {
  id: string
  user_id: string
  action: string
  platform: string | null
  response_type: string | null
  created_at: string
}

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"users" | "pending" | "activity">("pending")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndFetchData()
  }, [])

  async function checkAdminAndFetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push("/auth/login")
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (!profile?.is_admin) {
      // Make the first user an admin automatically
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)

      if (allProfiles && allProfiles[0]?.id === user.id) {
        await supabase
          .from("profiles")
          .update({ is_admin: true, plan: 'pro', plan_status: 'approved' })
          .eq("id", user.id)
        setIsAdmin(true)
      } else {
        router.push("/dashboard")
        return
      }
    } else {
      setIsAdmin(true)
    }

    await fetchData()
    setLoading(false)
  }

  async function fetchData() {
    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesData) setProfiles(profilesData)

    // Fetch recent usage logs
    const { data: logsData } = await supabase
      .from("usage_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (logsData) setUsageLogs(logsData)
  }

  async function approveUser(userId: string, plan: string = 'free') {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ 
        plan_status: 'approved',
        plan: plan,
        max_daily_generations: plan === 'pro' ? 999999 : 50
      })
      .eq("id", userId)

    if (!error) {
      await fetchData()
    }
    setActionLoading(null)
  }

  async function rejectUser(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ plan_status: 'rejected' })
      .eq("id", userId)

    if (!error) {
      await fetchData()
    }
    setActionLoading(null)
  }

  async function upgradeToPro(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ 
        plan: 'pro',
        max_daily_generations: 999999
      })
      .eq("id", userId)

    if (!error) {
      await fetchData()
    }
    setActionLoading(null)
  }

  async function downgradeToFree(userId: string) {
    setActionLoading(userId)
    const { error } = await supabase
      .from("profiles")
      .update({ 
        plan: 'free',
        max_daily_generations: 50
      })
      .eq("id", userId)

    if (!error) {
      await fetchData()
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Access denied</div>
      </div>
    )
  }

  const pendingUsers = profiles.filter(p => p.plan_status === 'pending')
  const approvedUsers = profiles.filter(p => p.plan_status === 'approved')
  const proUsers = profiles.filter(p => p.plan === 'pro' && p.plan_status === 'approved')
  const totalGenerations = profiles.reduce((sum, p) => sum + (p.total_generations || 0), 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a3e] bg-[#0f0f14]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500">Chatter&apos;s Inner Circle</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-[#1a1a24] border border-[#2a2a3e] rounded-lg text-sm hover:bg-[#2a2a3e] transition-colors"
          >
            Back to App
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Pending Approval</div>
            <div className="text-3xl font-bold text-orange-400">{pendingUsers.length}</div>
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-white">{approvedUsers.length}</div>
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Pro Users</div>
            <div className="text-3xl font-bold text-amber-400">{proUsers.length}</div>
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Total Generations</div>
            <div className="text-3xl font-bold text-purple-400">{totalGenerations}</div>
          </div>
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Activity Logs</div>
            <div className="text-3xl font-bold text-green-400">{usageLogs.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                : "bg-[#1a1a24] text-gray-400 hover:text-white"
            }`}
          >
            Pending Approval
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-gradient-to-r from-purple-600 to-amber-600 text-white"
                : "bg-[#1a1a24] text-gray-400 hover:text-white"
            }`}
          >
            All Users ({approvedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "activity"
                ? "bg-gradient-to-r from-purple-600 to-amber-600 text-white"
                : "bg-[#1a1a24] text-gray-400 hover:text-white"
            }`}
          >
            Activity Log ({usageLogs.length})
          </button>
        </div>

        {/* Pending Users Table */}
        {activeTab === "pending" && (
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl overflow-hidden">
            <div className="bg-orange-500/10 border-b border-orange-500/20 px-6 py-3">
              <h3 className="text-orange-400 font-medium">Users Waiting for Approval</h3>
            </div>
            <table className="w-full">
              <thead className="bg-[#0f0f14] border-b border-[#2a2a3e]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Requested</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((profile) => (
                  <tr key={profile.id} className="border-b border-[#2a2a3e] hover:bg-[#2a2a3e]/30">
                    <td className="px-6 py-4 text-sm text-white">{profile.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{profile.full_name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveUser(profile.id, 'free')}
                          disabled={actionLoading === profile.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Approve (Free)
                        </button>
                        <button
                          onClick={() => approveUser(profile.id, 'pro')}
                          disabled={actionLoading === profile.id}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Approve (Pro)
                        </button>
                        <button
                          onClick={() => rejectUser(profile.id)}
                          disabled={actionLoading === profile.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No pending users. All caught up!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* All Users Table */}
        {activeTab === "users" && (
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0f0f14] border-b border-[#2a2a3e]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Plan</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Today / Total</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Joined</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.map((profile) => (
                  <tr key={profile.id} className="border-b border-[#2a2a3e] hover:bg-[#2a2a3e]/30">
                    <td className="px-6 py-4 text-sm text-white">
                      {profile.email}
                      {profile.is_admin && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{profile.full_name || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        profile.plan === "pro" 
                          ? "bg-amber-500/20 text-amber-400" 
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {profile.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-purple-400">{profile.daily_generations || 0}</span>
                      <span className="text-gray-600"> / </span>
                      <span className="text-white">{profile.total_generations || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {!profile.is_admin && (
                        <div className="flex items-center gap-2">
                          {profile.plan === 'free' ? (
                            <button
                              onClick={() => upgradeToPro(profile.id)}
                              disabled={actionLoading === profile.id}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-amber-600 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              Upgrade to Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => downgradeToFree(profile.id)}
                              disabled={actionLoading === profile.id}
                              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              Downgrade to Free
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {approvedUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No approved users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Activity Log */}
        {activeTab === "activity" && (
          <div className="bg-[#1a1a24] border border-[#2a2a3e] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0f0f14] border-b border-[#2a2a3e]">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Action</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Platform</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
                </tr>
              </thead>
              <tbody>
                {usageLogs.map((log) => {
                  const user = profiles.find(p => p.id === log.user_id)
                  return (
                    <tr key={log.id} className="border-b border-[#2a2a3e] hover:bg-[#2a2a3e]/30">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{log.action}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                          {log.platform || "unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.response_type === 'thoughtful'
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {log.response_type || "simple"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {user?.email || log.user_id?.slice(0, 8) + "..."}
                      </td>
                    </tr>
                  )
                })}
                {usageLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No activity yet. Users will appear here when they generate replies.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
