import React, { useState } from 'react';
import { FanPost, Team } from '../types';
import { MessageSquare, ThumbsUp, Send, Flame, Users, ShieldAlert, Trash, ToggleLeft, ToggleRight, BadgeCheck } from 'lucide-react';
import { saveToFirebase, deleteFromFirebase } from '../services/storeSync';

interface SocialFeedProps {
  posts: FanPost[];
  setPosts: React.Dispatch<React.SetStateAction<FanPost[]>>;
  teams: Team[];
}

export default function SocialFeed({ posts, setPosts, teams }: SocialFeedProps) {
  const [newPostText, setNewPostText] = useState('');
  const [preferredCheerTeam, setPreferredCheerTeam] = useState<string>('');
  const [authorName, setAuthorName] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  // Moderation and interactive states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});

  const mockIllustrations = [
    { name: '🔥 Crowd Roar', emoji: '🔥', url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400' },
    { name: '🏐 Spiker Smash', emoji: '🏐', url: 'https://images.unsplash.com/photo-1592656094267-764a45023352?auto=format&fit=crop&q=80&w=400' },
    { name: '🏆 Gold Cup', emoji: '🏆', url: 'https://images.unsplash.com/photo-1578269174936-2709b5a5e06e?auto=format&fit=crop&q=80&w=400' }
  ];

  // Profanity dictionary representing typical off-limit discussion words
  const censoredWords = ["idiot", "loser", "stupid", "rigged", "cheat", "scam", "hate", "scoundrel", "blind", "fool", "worst"];

  const applyCensor = (text: string): string => {
    if (!profanityFilter) return text;
    let modified = text;
    censoredWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      modified = modified.replace(regex, "****");
    });
    return modified;
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText) return;

    const finalAuthor = authorName.trim() || 'Anonymous Fan';
    const bgColors = ['bg-emerald-600', 'bg-slate-700', 'bg-teal-600', 'bg-blue-600', 'bg-rose-600', 'bg-indigo-650 bg-indigo-600'];
    const randomAvatarBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    const targetIllustration = mockIllustrations.find((img) => img.name === selectedAttachment);
    const cleanContent = applyCensor(newPostText);
    const isLoggedAdmin = localStorage.getItem('admin_logged') === 'true';

    const post: FanPost = {
      id: `post_${Date.now()}`,
      author: finalAuthor,
      avatar: `${randomAvatarBg} text-white`,
      content: cleanContent,
      image: targetIllustration ? targetIllustration.url : undefined,
      cheeringFor: preferredCheerTeam || undefined,
      likes: 0,
      commentsCount: 0,
      time: new Date().toISOString(), // Use format that orders well
      userLiked: false,
      isAdminPost: isLoggedAdmin || isAdminMode,
      comments: []
    };

    setPosts((prev) => [post, ...prev]);
    try {
      await saveToFirebase('posts', post);
    } catch (err) {
      console.error(err);
    }

    setNewPostText('');
    setPreferredCheerTeam('');
    setSelectedAttachment(null);
  };

  const handleLikePost = async (postId: string) => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    const post = posts[postIndex];
    const liked = !post.userLiked;
    const updatedPost = {
      ...post,
      userLiked: liked,
      likes: liked ? post.likes + 1 : post.likes - 1,
    };
    
    setPosts((prev) => prev.map((p) => p.id === postId ? updatedPost : p));
    
    try {
      await saveToFirebase('posts', updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  // Moderation Tools handlers
  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await deleteFromFirebase('posts', postId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInput[postId] || '';
    if (!text.trim()) return;

    const finalCommenter = authorName.trim() || 'Anonymous Fan';
    const cleanComment = applyCensor(text);
    const isLoggedAdmin = localStorage.getItem('admin_logged') === 'true';

    const postToUpdate = posts.find((p) => p.id === postId);
    if (!postToUpdate) return;

    const currentComments = postToUpdate.comments || [];
    const newComment = {
      id: `comment_${Date.now()}`,
      author: finalCommenter,
      content: cleanComment,
      time: new Date().toISOString(),
      isAdminComment: isLoggedAdmin || isAdminMode
    };

    const updatedPost = {
      ...postToUpdate,
      comments: [...currentComments, newComment],
      commentsCount: currentComments.length + 1
    };

    setPosts((prev) => prev.map((post) => post.id === postId ? updatedPost : post));
    setCommentInput((prev) => ({ ...prev, [postId]: '' }));

    try {
      await saveToFirebase('posts', updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const postToUpdate = posts.find((p) => p.id === postId);
    if (!postToUpdate) return;

    const currentComments = postToUpdate.comments || [];
    const filtered = currentComments.filter((c) => c.id !== commentId);

    const updatedPost = {
      ...postToUpdate,
      comments: filtered,
      commentsCount: filtered.length
    };

    setPosts((prev) => prev.map((post) => post.id === postId ? updatedPost : post));

    try {
      await saveToFirebase('posts', updatedPost);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-slate-800" id="social_feed_container">
      
      {/* Title Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide">
          💬 Fan Stand Social Forum
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          Spectator Social Feed
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Share live comments, view mock sports banners, cheer for your favorite regional volleyball squads, and connect with other fans.
        </p>
      </div>

      {/* Admin Moderation Toolbar */}
      <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-850 rounded-2xl text-white border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-white">
              🛡️ Fan Club Moderation Desk
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
              Apply administrative clean-up, review flagged submissions, and censor offensive content.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-mono">
          {/* Toggle admin clearance */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-bold transition-all ${
              isAdminMode
                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <span>{isAdminMode ? 'Disable Admin privileges' : 'Enable Admin privileges'}</span>
            {isAdminMode ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5 text-slate-500" />}
          </button>

          {/* Toggle profanity autoshield */}
          <button
            onClick={() => setProfanityFilter(!profanityFilter)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-bold transition-all ${
              profanityFilter
                ? 'bg-[#10b981]/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-755'
            }`}
          >
            <span>Auto Censorship: {profanityFilter ? 'ENABLED' : 'OFF'}</span>
            <span className={`w-2 h-2 rounded-full ${profanityFilter ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Create Post & Cheer sidebar (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider flex items-center space-x-1.5">
              <Flame className="h-4.5 w-4.5 text-red-500 animate-pulse" />
              <span>Compose Cheer post</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Author name */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Fan Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Majid_Spikes"
                  maxLength={25}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2.5 px-3 text-slate-850 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Message text */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Cheer Shoutout</label>
                <textarea
                  placeholder="Write your cheer shout-out or discuss tactics... 🏐🔥"
                  required
                  rows={3}
                  maxLength={280}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2.5 px-3 text-slate-850 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Cheer Team Selector */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Cheering For (Optional)</label>
                <select
                  value={preferredCheerTeam}
                  onChange={(e) => setPreferredCheerTeam(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="">-- No specific team preference --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.logo} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mock Banner attachment */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-1">Attach Sports Graphic</label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {mockIllustrations.map((illustration, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedAttachment(
                        selectedAttachment === illustration.name ? null : illustration.name
                      )}
                      className={`p-2.5 rounded-xl text-center border text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedAttachment === illustration.name
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500/10'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{illustration.emoji}</span>
                      <span className="text-[8px] mt-1 leading-none uppercase font-extrabold">{illustration.name.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newPostText}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wide transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Broadcasting to Feed</span>
              </button>
            </form>
          </div>

          {/* Quick rules box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 text-xs text-slate-500 leading-relaxed shadow-sm">
            <h4 className="font-extrabold text-slate-800 mb-2 flex items-center space-x-1.5">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              <span>Forum Conduct Code</span>
            </h4>
            <p>Keep discussions sporting and respectful of opposing teams. Harassment or abusive slang will result in immediate spectator ban flags.</p>
            {profanityFilter && (
              <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200/50 rounded-lg text-emerald-805 text-[10px] leading-snug font-medium">
                🛡️ Auto-Censorship is active. Safe vocabulary filters apply immediately.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Feed Stream list (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 text-sm shadow-sm">
              No fan standing posts logged yet. Be the first to start the rally!
            </div>
          ) : (
            posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-slate-300 transition shadow-sm relative overflow-hidden"
              >
                {/* Header layout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full ${post.avatar} font-black text-xs flex items-center justify-center text-white shadow-xs`}>
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900">{post.author}</h4>
                        {post.isAdminPost && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                            <BadgeCheck className="h-3 w-3 text-white fill-white/10" />
                            Official
                          </span>
                        )}
                        {post.author.includes('WAPDA') || post.author.includes('Army') || post.author.includes('Sarmad') ? (
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ) : null}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-bold">{post.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Cheering badge indicator */}
                    {post.cheeringFor && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        📣 CHEER: {post.cheeringFor.split(' ')[0]}
                      </span>
                    )}

                    {/* Admin Censor Control Button */}
                    {isAdminMode && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded-lg border border-red-200 transition cursor-pointer text-xs flex items-center space-x-1 font-bold"
                        title="Moderate/Remove post"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        <span className="text-[10px] sm:inline">Delete Post</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content area */}
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed mt-4">
                  {post.content}
                </p>

                {/* Attachment graphic */}
                {post.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden max-h-52 w-full border border-slate-100 relative">
                    <img 
                      src={post.image} 
                      alt="Fan Attachment" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-2.5 right-2.5 bg-emerald-950/90 px-2 py-0.5 rounded-lg text-[8px] font-mono font-bold text-white uppercase tracking-widest">
                      🏐 Court snap
                    </div>
                  </div>
                )}

                {/* Interactivity elements */}
                <div className="mt-5 border-t border-slate-100 pt-3.5 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-5">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-1.5 font-extrabold transition cursor-pointer ${
                        post.userLiked ? 'text-emerald-700' : 'hover:text-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${post.userLiked ? 'fill-emerald-600 stroke-emerald-600' : ''}`} />
                      <span>{post.likes} Likes</span>
                    </button>

                    <button
                      onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                      className={`flex items-center space-x-1.5 font-extrabold transition cursor-pointer hover:text-slate-800 ${
                        expandedPostId === post.id ? 'text-emerald-750 font-black' : ''
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      <span>{post.commentsCount || (post.comments ? post.comments.length : 0)} Comments</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="text-[10px] font-extrabold text-[#111827] uppercase tracking-wider hover:underline bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                  >
                    {expandedPostId === post.id ? 'Hide Replies' : 'Join Discussion'}
                  </button>
                </div>

                {/* Expanded Collapsible Comments Thread Section */}
                {expandedPostId === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      💬 Discussion Thread
                    </h5>

                    {/* List of sub comments */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {!post.comments || post.comments.length === 0 ? (
                        <p className="text-[11px] text-slate-450 italic py-2">No comments written yet. Be the first to voice your analysis!</p>
                      ) : (
                        post.comments.map((comment) => (
                          <div 
                            key={comment.id} 
                            className="bg-slate-50 rounded-xl p-2.5 border border-slate-150 relative text-[11px] font-sans"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-900">{comment.author}</span>
                                {comment.isAdminComment && (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-500 text-white text-[8px] font-black px-1 rounded uppercase tracking-wider">
                                    Official
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[8px] text-slate-400 font-mono font-semibold">{comment.time}</span>
                                {isAdminMode && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, comment.id)}
                                    className="text-red-500 hover:text-red-700 bg-white p-0.5 rounded border border-red-100 transition cursor-pointer"
                                    title="Delete this comment"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 text-slate-650 font-medium whitespace-pre-line leading-relaxed text-[11px]">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* New Comment Submission form */}
                    <div className="flex items-center space-x-2 bg-slate-50/50 p-2 rounded-xl text-xs border border-slate-200">
                      <input
                        type="text"
                        placeholder="Say something nice about the play..."
                        value={commentInput[post.id] || ''}
                        onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(post.id);
                          }
                        }}
                        className="flex-1 bg-white border border-slate-205 border-slate-200 rounded-xl text-xs py-2 px-3 text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!(commentInput[post.id] || '').trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2 px-3.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1"
                      >
                        <Send className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase">Send</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
