'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { blogsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Save,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
} from 'lucide-react';


function slugifyText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor View State: 'list' | 'editor'
  const [view, setView] = useState('list');
  const [editingPostId, setEditingPostId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [summary, setSummary] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [authorName, setAuthorName] = useState('Sadguru Chenu');
  const [authorRole, setAuthorRole] = useState('Founder & Lead Architect');
  const [tagsInput, setTagsInput] = useState('');
  const [readingTime, setReadingTime] = useState(5);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tiptap Editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#D49A6A] underline',
        },
      }),
    ],
    content: '<p>Write your article content here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-zinc max-w-none min-h-[300px] p-4 focus:outline-none text-xs sm:text-sm text-zinc-200 leading-relaxed',
      },
    },
  });

  useEffect(() => {
    loadPosts();
  }, [statusFilter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await blogsApi.adminList({
        page: 1,
        limit: 50,
        q: search || undefined,
        status_filter: statusFilter === 'all' ? undefined : statusFilter,
      });
      setPosts(res.items || []);
    } catch (err) {
      console.error('Failed to load admin blog posts:', err);
      toast.error('Failed to fetch blog posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPostId(null);
    setTitle('');
    setSlug('');
    setIsSlugManual(false);
    setSummary('');
    setCoverImageUrl('');
    setAuthorName('Sadguru Chenu');
    setAuthorRole('Founder & Lead Architect');
    setTagsInput('ATS Optimization, Technical Resumes');
    setReadingTime(5);
    setIsPublished(false);
    if (editor) {
      editor.commands.setContent('<h2>Introduction</h2><p>Start writing your in-depth guide...</p>');
    }
    setView('editor');
  };

  const handleEdit = async (post) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setSlug(post.slug);
    setIsSlugManual(true);
    setSummary(post.summary);
    setCoverImageUrl(post.cover_image_url || '');
    setAuthorName(post.author_name || 'Sadguru Chenu');
    setAuthorRole(post.author_role || 'Founder & Lead Architect');
    setTagsInput((post.tags || []).join(', '));
    setReadingTime(post.reading_time_minutes || 5);
    setIsPublished(post.is_published);

    try {
      const full = await blogsApi.adminGet(post.id);
      if (editor) {
        editor.commands.setContent(full.content_html || '<p></p>');
      }
    } catch (e) {
      toast.error('Failed to load full post content.');
    }
    setView('editor');
  };

  const handleSave = async (publishImmediately = null) => {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 5) {
      toast.error('Title must be at least 5 characters long.');
      return;
    }
    if (!summary.trim()) {
      toast.error('Summary is required.');
      return;
    }

    // Determine final slug
    let finalSlug = slug.trim();
    if (!finalSlug) {
      finalSlug = slugifyText(cleanTitle);
    } else {
      finalSlug = slugifyText(finalSlug);
    }

    const htmlContent = editor ? editor.getHTML() : '';
    if (!htmlContent || htmlContent === '<p></p>') {
      toast.error('Please write some content in the editor.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const publishState = publishImmediately !== null ? publishImmediately : isPublished;

    setSaving(true);
    try {
      const payload = {
        title: cleanTitle,
        slug: finalSlug || undefined,
        summary,
        content_html: htmlContent,
        cover_image_url: coverImageUrl.trim() || null,
        author_name: authorName.trim() || 'PageWise Editorial',
        author_role: authorRole.trim() || 'Career & Engineering Lead',
        tags: tagsArray,
        reading_time_minutes: parseInt(readingTime, 10) || 5,
        is_published: publishState,
      };

      if (editingPostId) {
        await blogsApi.adminUpdate(editingPostId, payload);
        toast.success(publishState ? 'Post updated & published!' : 'Draft updated!');
      } else {
        await blogsApi.adminCreate(payload);
        toast.success(publishState ? 'Post created & published!' : 'Draft saved!');
      }

      setView('list');
      loadPosts();
    } catch (err) {
      console.error('Save post error:', err);
      toast.error(err.message || 'Failed to save blog post.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await blogsApi.adminTogglePublish(id);
      toast.success(res.is_published ? 'Post published to live site!' : 'Post moved to drafts.');
      loadPosts();
    } catch (err) {
      toast.error('Failed to toggle publish status.');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this blog post?')) return;

    try {
      await blogsApi.adminDelete(id);
      toast.success('Post deleted.');
      loadPosts();
    } catch (err) {
      toast.error('Failed to delete post.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── List View ─── */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0f111a] border border-white/[0.06]">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C88A58]" /> Editorial &amp; Blog Posts
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Author and manage articles for SEO visibility, ATS guides, and organic acquisition.
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              className="py-2 px-4 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-1.5 self-start sm:self-auto shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write New Post</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                placeholder="Search articles..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C88A58]"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-[#C88A58]"
              >
                <option value="all">All ({posts.length})</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-[#0c0e15]">
            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500 font-mono">
                Loading blog posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs text-zinc-400">No blog posts found.</p>
                <button
                  onClick={handleCreateNew}
                  className="text-xs text-[#D49A6A] hover:underline font-mono"
                >
                  Write your first article →
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-mono">
                    <th className="py-3 px-4">Title &amp; Slug</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Views</th>
                    <th className="py-3 px-4">Published Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      onClick={() => handleEdit(post)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-white line-clamp-1">{post.title}</div>
                        <div className="text-[10px] text-zinc-500 font-mono line-clamp-1">
                          /blog/{post.slug}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{post.author_name}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => handleTogglePublish(post.id, e)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors inline-flex items-center gap-1 ${
                            post.is_published
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                              : 'bg-zinc-800/40 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {post.is_published ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" /> Published
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5" /> Draft
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        {post.views_count || 0}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.is_published && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                              title="View on Live Site"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(post);
                            }}
                            className="p-1.5 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                            title="Edit Post"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(post.id, e)}
                            className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Editor View (Tiptap Workspace) ─── */}
      {view === 'editor' && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f111a] border border-white/[0.06]">
            <button
              onClick={() => setView('list')}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 transition-colors font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="py-1.5 px-3.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.1] hover:bg-white/[0.05] transition-all disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="py-1.5 px-4 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all inline-flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editingPostId && isPublished ? 'Update & Publish' : 'Publish Live'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Tiptap Rich Editor */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c0e15] space-y-4">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setTitle(newTitle);
                      if (!isSlugManual) {
                        setSlug(slugifyText(newTitle));
                      }
                    }}
                    placeholder="Article Headline (e.g. The ATS Parser Benchmark)"
                    className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>

                {/* Summary / Meta Description */}
                <div>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Meta description & summary for Google search snippet (1-2 sentences)..."
                    className="w-full bg-black/30 border border-white/[0.06] rounded-xl p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#C88A58] resize-none leading-relaxed"
                  />
                </div>

                {/* Tiptap Toolbar */}
                {editor && (
                  <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-black/40 border border-white/[0.06] text-zinc-400">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('bold') ? 'bg-white/[0.15] text-white font-bold' : ''
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('italic') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('underline') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Underline"
                    >
                      <UnderlineIcon className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/[0.1] mx-1" />
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white text-xs font-bold ${
                        editor.isActive('heading', { level: 2 }) ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="H2 Section Heading"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white text-xs font-bold ${
                        editor.isActive('heading', { level: 3 }) ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="H3 Subheading"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/[0.1] mx-1" />
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('bulletList') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('orderedList') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('blockquote') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Blockquote"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={`p-1.5 rounded hover:bg-white/[0.08] hover:text-white ${
                        editor.isActive('codeBlock') ? 'bg-white/[0.15] text-white' : ''
                      }`}
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().setHorizontalRule().run()}
                      className="p-1.5 rounded hover:bg-white/[0.08] hover:text-white"
                      title="Horizontal Divider"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Editor Content Area */}
                <div className="rounded-xl border border-white/[0.06] bg-black/20 min-h-[400px]">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* Right: Metadata Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#0c0e15] space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                  Post Metadata &amp; SEO
                </h3>

                {/* Slug */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                    URL Slug (auto-derived if empty)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlug(val);
                        if (val.trim()) {
                          setIsSlugManual(true);
                        } else {
                          setIsSlugManual(false);
                          setSlug(slugifyText(title));
                        }
                      }}
                      placeholder="e.g. ats-resume-benchmark"
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                    />
                    {isSlugManual && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSlugManual(false);
                          setSlug(slugifyText(title));
                        }}
                        className="absolute right-2 top-1.5 text-[10px] text-[#D49A6A] hover:underline font-mono"
                        title="Reset to title-based slug"
                      >
                        Reset auto
                      </button>
                    )}
                  </div>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                  />
                  {coverImageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-zinc-900 border border-white/[0.04]">
                      <img
                        src={coverImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Author Name & Role */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                      Author Role
                    </label>
                    <input
                      type="text"
                      value={authorRole}
                      onChange={(e) => setAuthorRole(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="ATS, Career, Resumes"
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                  />
                </div>

                {/* Reading Time */}
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-mono">
                    Estimated Reading Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={readingTime}
                    onChange={(e) => setReadingTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
