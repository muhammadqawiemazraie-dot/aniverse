"use client"

import * as React from "react"
import { ShieldAlert, Users, Film, MessageSquare, LayoutDashboard, Plus, Trash2, CheckCircle2, AlertTriangle, Radio } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FeaturedItem {
  id: string
  title: string
  mal_id: string
  active: boolean
}

interface ModerationComment {
  id: string
  user: string
  text: string
  date: string
  flagged: boolean
}

export default function AdminDashboardPage() {
  const [featuredList, setFeaturedList] = React.useState<FeaturedItem[]>([
    { id: "1", title: "Jujutsu Kaisen", mal_id: "40748", active: true },
    { id: "2", title: "Demon Slayer: Kimetsu no Yaiba", mal_id: "38000", active: true },
    { id: "3", title: "Attack on Titan", mal_id: "16498", active: false },
    { id: "4", title: "Solo Leveling", mal_id: "52299", active: true },
  ])

  const [commentsList, setCommentsList] = React.useState<ModerationComment[]>([
    { id: "c1", user: "otaku_99", text: "Best episode ever! That animation in the fight scene was insane.", date: "10m ago", flagged: false },
    { id: "c2", user: "spoiler_king", text: "Character X dies in episode 12 lol", date: "1h ago", flagged: true },
    { id: "c3", user: "anime_fan", text: "Subtitles are working great on Server 2.", date: "3h ago", flagged: false },
  ])

  const [newTitle, setNewTitle] = React.useState("")
  const [newMalId, setNewMalId] = React.useState("")
  const [announcementText, setAnnouncementText] = React.useState("Welcome to Qverse! Stream your favorite shows in HD free.")
  const [activeTab, setActiveTab] = React.useState("featured")

  const handleAddFeatured = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newMalId.trim()) {
      toast.error("Please provide both title and MAL ID.")
      return
    }
    const newItem: FeaturedItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      mal_id: newMalId.trim(),
      active: true
    }
    setFeaturedList(prev => [newItem, ...prev])
    setNewTitle("")
    setNewMalId("")
    toast.success("Featured title added!")
  }

  const toggleActive = (id: string) => {
    setFeaturedList(prev => prev.map(item => item.id === id ? { ...item, active: !item.active } : item))
    toast.success("Status updated")
  }

  const removeFeatured = (id: string) => {
    setFeaturedList(prev => prev.filter(item => item.id !== id))
    toast.success("Item removed from featured")
  }

  const deleteComment = (id: string) => {
    setCommentsList(prev => prev.filter(c => c.id !== id))
    toast.success("Comment removed")
  }

  const approveComment = (id: string) => {
    setCommentsList(prev => prev.map(c => c.id === id ? { ...c, flagged: false } : c))
    toast.success("Comment approved")
  }

  const saveAnnouncement = () => {
    toast.success("Announcement banner updated globally!")
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 min-h-[75vh]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 font-bold text-xl px-4 py-3 text-primary border-b border-border/50">
          <ShieldAlert className="w-5 h-5" />
          Admin Dashboard
        </div>
        <Button
          variant={activeTab === "featured" ? "secondary" : "ghost"}
          className="justify-start font-semibold"
          onClick={() => setActiveTab("featured")}
        >
          <Film className="w-4 h-4 mr-2 text-primary" />
          Featured Anime
        </Button>
        <Button
          variant={activeTab === "comments" ? "secondary" : "ghost"}
          className="justify-start font-semibold"
          onClick={() => setActiveTab("comments")}
        >
          <MessageSquare className="w-4 h-4 mr-2 text-primary" />
          Comments Moderation
        </Button>
        <Button
          variant={activeTab === "announcements" ? "secondary" : "ghost"}
          className="justify-start font-semibold"
          onClick={() => setActiveTab("announcements")}
        >
          <Radio className="w-4 h-4 mr-2 text-primary" />
          Broadcast Banner
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 border border-border bg-card/60 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Control Panel</h1>
              <p className="text-xs text-muted-foreground">Manage homepage carousels, user comments, and platform broadcasts.</p>
            </div>
            <Badge variant="outline" className="border-primary/40 text-primary px-3 py-1 font-bold">
              Root Access
            </Badge>
          </div>

          {/* TAB 1: FEATURED ANIME */}
          <TabsContent value="featured" className="space-y-6 animate-in fade-in duration-200">
            <form onSubmit={handleAddFeatured} className="bg-secondary/30 border border-border p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title Name</label>
                <Input
                  placeholder="e.g. Chainsaw Man"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-background text-xs"
                />
              </div>
              <div className="w-full sm:w-40 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MAL ID</label>
                <Input
                  placeholder="e.g. 44511"
                  value={newMalId}
                  onChange={(e) => setNewMalId(e.target.value)}
                  className="bg-background text-xs"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto font-bold text-xs">
                <Plus className="w-4 h-4 mr-1" /> Add Featured
              </Button>
            </form>

            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Anime Title</th>
                    <th className="px-6 py-3">MAL ID</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {featuredList.map((item) => (
                    <tr key={item.id} className="bg-card hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{item.title}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">{item.mal_id}</td>
                      <td className="px-6 py-4">
                        {item.active ? (
                          <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none font-bold text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Disabled</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => toggleActive(item.id)} className="h-7 text-[11px]">
                          {item.active ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => removeFeatured(item.id)} className="h-7 text-[11px]">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 2: COMMENTS MODERATION */}
          <TabsContent value="comments" className="space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-sm text-foreground">Recent User Comments & Reports</h3>
            <div className="space-y-3">
              {commentsList.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  comment.flagged ? "bg-red-500/10 border-red-500/30" : "bg-secondary/20 border-border"
                }`}>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-foreground">@{comment.user}</span>
                      <span className="text-[10px] text-muted-foreground">{comment.date}</span>
                      {comment.flagged && (
                        <Badge variant="destructive" className="text-[9px] py-0 px-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged Spoiler
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed truncate">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {comment.flagged && (
                      <Button size="sm" variant="outline" onClick={() => approveComment(comment.id)} className="h-7 text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteComment(comment.id)} className="h-7 text-[10px]">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: ANNOUNCEMENT BROADCAST */}
          <TabsContent value="announcements" className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Global Site Announcement</label>
              <Input
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter announcement text..."
                className="bg-background text-xs h-11"
              />
            </div>
            <Button onClick={saveAnnouncement} className="font-bold text-xs">
              Publish Broadcast Banner
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
