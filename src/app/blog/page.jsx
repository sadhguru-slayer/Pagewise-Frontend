'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { blogsApi } from '@/lib/api';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  Tag,
  Sparkles,
  Calendar,
} from 'lucide-react';

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
    loadTags();
  }, [selectedTag]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await blogsApi.list({
        page: 1,
        limit: 20,
        tag: selectedTag || undefined,
        q: searchQuery || undefined,
      });
      setBlogs(res.items || []);
    } catch (err) {
      console.warn('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const res = await blogsApi.getPopularTags();
      setTags(res || []);
    } catch (err) {
      console.warn('Failed to load tags:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBlogs();
  };

  const featured = blogs.length > 0 ? blogs[0] : null;
  const standardPosts = blogs.length > 1 ? blogs.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <SiteHeader activePage="blog" />

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-4">
          <BookOpen className="w-3.5 h-3.5" /> Engineering &amp; Career Insights
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          The PageWise Editorial
        </h1>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Technical breakdowns on ATS parsing algorithms, resume typography geometry, factual AI prompts, and hiring benchmark data.
        </p>

        {/* Search & Tags */}
        <div className="mt-8 max-w-xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles on ATS, typography, formatting..."
              className="w-full pl-10 pr-24 py-3 rounded-xl bg-[#0e1017] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C88A58] transition-colors shadow-inner"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <button
              type="submit"
              className="absolute right-2 top-2 py-1.5 px-3 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Tag filter pills */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  !selectedTag
                    ? 'bg-white text-zinc-950 font-semibold border-white'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
                }`}
              >
                All Topics
              </button>
              {tags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => setSelectedTag(selectedTag === t.tag ? null : t.tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTag === t.tag
                      ? 'bg-[#C88A58] text-white font-semibold border-[#C88A58]'
                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  {t.tag} ({t.count})
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 w-full">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 font-mono">
            Loading editorial articles...
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-zinc-400 text-sm">No articles found matching your criteria.</p>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-[#D49A6A] hover:underline font-mono"
              >
                Clear topic filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Hero Article */}
            {featured && (
              <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0d0f17] hover:border-white/[0.15] transition-all group">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {featured.cover_image_url && (
                    <div className="lg:col-span-5 rounded-xl overflow-hidden aspect-video lg:aspect-auto h-full max-h-64 bg-zinc-900 border border-white/[0.04]">
                      <img
                        src={featured.cover_image_url}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className={featured.cover_image_url ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-[#D49A6A] uppercase tracking-wider bg-[#C88A58]/10 px-2 py-0.5 rounded border border-[#C88A58]/20">
                        Featured Deep Dive
                      </span>
                      {featured.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link href={`/blog/${featured.slug}`} className="block group-hover:text-[#F3D5B5] transition-colors">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                        {featured.title}
                      </h2>
                    </Link>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
                      {featured.summary}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-mono">
                      <div className="flex items-center gap-3">
                        <span>{featured.author_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {featured.reading_time_minutes} min read
                        </span>
                      </div>

                      <Link
                        href={`/blog/${featured.slug}`}
                        className="text-xs text-[#D49A6A] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Standard Articles */}
            {standardPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono mb-6">
                  Latest Research &amp; Guides
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {standardPosts.map((post) => (
                    <article
                      key={post.id}
                      className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] flex flex-col justify-between hover:border-white/[0.14] transition-all group"
                    >
                      <div>
                        {post.cover_image_url && (
                          <div className="rounded-xl overflow-hidden aspect-video mb-4 bg-zinc-900 border border-white/[0.04]">
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          {post.tags?.[0] && (
                            <span className="text-[10px] font-mono text-[#D49A6A] bg-[#C88A58]/10 px-2 py-0.5 rounded border border-[#C88A58]/20">
                              {post.tags[0]}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.reading_time_minutes}m
                          </span>
                        </div>

                        <Link href={`/blog/${post.slug}`}>
                          <h4 className="text-base font-bold text-white group-hover:text-[#F3D5B5] transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </Link>

                        <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                          {post.summary}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between text-xs">
                        <span className="text-zinc-500 text-[11px] font-mono">
                          {post.author_name}
                        </span>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-zinc-300 group-hover:text-white inline-flex items-center gap-1 font-medium text-xs transition-colors"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Embedded Workspace CTA banner */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-[#12141f] via-[#0e1017] to-[#12141f] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Ready to apply these principles?</h3>
            <p className="text-xs text-zinc-400">
              Build your resume on our calibrated A4 canvas with deep ATS keyword verification.
            </p>
          </div>
          <Link
            href="/register"
            className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shrink-0 shadow"
          >
            <span>Start Free Pilot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
