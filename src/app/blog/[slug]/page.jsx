import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { fetchServerBlog } from '@/lib/blog-server';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pagewise.sadguruchenu.in';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await fetchServerBlog(slug);
    if (!post) return { title: 'Article Not Found | PageWise' };

    return {
      title: `${post.title} | PageWise Editorial`,
      description: post.summary,
      alternates: {
        canonical: `/blog/${post.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.summary,
        url: `${APP_URL}/blog/${post.slug}`,
        type: 'article',
        publishedTime: post.published_at,
        authors: [post.author_name],
        images: post.cover_image_url ? [{ url: post.cover_image_url }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.summary,
        images: post.cover_image_url ? [post.cover_image_url] : [],
      },
    };
  } catch (e) {
    return { title: 'Article | PageWise Editorial' };
  }
}

export default async function BlogPostDetailPage({ params }) {
  const { slug } = await params;
  const post = await fetchServerBlog(slug);

  if (!post) {
    notFound();
  }

  // Schema.org BlogPosting metadata
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    image: post.cover_image_url || `${APP_URL}/pagewise_logo.png`,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
      jobTitle: post.author_role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'PageWise Studio',
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/pagewise_logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${APP_URL}/blog/${post.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <SiteHeader activePage="blog" />

      {/* Article Header */}
      <article className="pt-16 pb-20 max-w-4xl mx-auto px-4 sm:px-6 w-full">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-xs text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5 font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all articles</span>
          </Link>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono text-[#D49A6A] bg-[#C88A58]/10 px-2.5 py-0.5 rounded border border-[#C88A58]/25"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.18]">
          {post.title}
        </h1>

        {/* Summary */}
        <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed">
          {post.summary}
        </p>

        {/* Author / Date Meta */}
        <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center font-bold text-zinc-200">
              {post.author_name?.[0] || 'P'}
            </div>
            <div>
              <div className="text-zinc-200 font-medium">{post.author_name}</div>
              <div className="text-zinc-500 text-[11px]">{post.author_role || 'Engineering Lead'}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
          </div>
        </div>

        {/* Cover Image */}
        {post.cover_image_url && (
          <div className="mt-8 rounded-2xl overflow-hidden aspect-video max-h-[460px] bg-zinc-900 border border-white/[0.08]">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article HTML Content */}
        <div
          className="mt-12 prose prose-invert prose-zinc max-w-none 
            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/[0.08] prose-h2:pb-2
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
            prose-li:text-zinc-300 prose-li:text-sm sm:prose-li:text-base
            prose-strong:text-white prose-strong:font-semibold
            prose-code:text-[#D49A6A] prose-code:bg-black/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
            prose-pre:bg-[#0c0e16] prose-pre:border prose-pre:border-white/[0.08] prose-pre:rounded-xl
            prose-blockquote:border-l-[#C88A58] prose-blockquote:bg-white/[0.02] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
          "
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* Embedded PageWise Action Card */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-b from-[#141624] to-[#0c0e15] border border-[#C88A58]/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D49A6A]">
            <Sparkles className="w-4 h-4" /> Try It In The Live Canvas
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Apply these principles to your own resume in PageWise Studio
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
            Test your document against real-time A4 boundaries and evaluate keywords against your target job description. Free vector PDF and Word (.docx) export with zero watermarks.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow"
            >
              <span>Build My Resume Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/builder"
              className="py-2.5 px-4 rounded-xl text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.08] hover:bg-white/[0.05] transition-all"
            >
              Open Live Canvas
            </Link>
          </div>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
