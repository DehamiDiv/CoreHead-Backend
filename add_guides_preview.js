const fs = require('fs');

const component = `"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap, Database, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { resolvePublicSite } from "@/lib/publicSite";

interface Guide {
  title: string;
  description: string;
  link: string;
  category: string;
}

export default function GuidesPreview() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuides() {
      try {
        const site = await resolvePublicSite("guides");
        if (site) {
          const postsData = await api.getPreviewPosts(6, site.id);
          const raw = Array.isArray(postsData?.posts)
            ? postsData.posts
            : Array.isArray(postsData)
            ? postsData
            : [];
          setGuides(
            raw.map((p) => ({
              title: p.title,
              description: p.excerpt || "",
              link: "/guides",
              category: p.category || "quickstart",
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const quickstart = guides.filter((g) =>
    g.category.toLowerCase().includes("quickstart")
  ).slice(0, 3);

  const build = guides.filter((g) =>
    g.category.toLowerCase().includes("build")
  ).slice(0, 3);

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4">
            <BookOpen className="w-4 h-4" />
            Documentation & Guides
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              get started
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Step-by-step guides to help you launch your blog, master the builder,
            and get the most out of CoreHead.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Quickstart Guides</h3>
            </div>
            <div className="space-y-3">
              {loading
                ? [0,1,2].map((i) => <SkeletonRow key={i} />)
                : quickstart.length > 0
                ? quickstart.map((g, i) => <GuideRow key={i} guide={g} />)
                : <EmptyState label="No quickstart guides yet" />}
            </div>
            <Link href="/guides" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group">
              View all quickstart guides
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Build Application</h3>
            </div>
            <div className="space-y-3">
              {loading
                ? [0,1,2].map((i) => <SkeletonRow key={i} />)
                : build.length > 0
                ? build.map((g, i) => <GuideRow key={i} guide={g} />)
                : <EmptyState label="No build guides yet" />}
            </div>
            <Link href="/guides" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group">
              View all build guides
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link href="/guides" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
            <BookOpen className="w-4 h-4" />
            Browse all guides
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function GuideRow({ guide }) {
  return (
    <Link
      href={guide.link}
      className="group flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
        <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug mb-1">
          {guide.title}
        </p>
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {guide.description}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-1 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center text-slate-400 text-sm">
      {label}
    </div>
  );
}
`;

fs.writeFileSync('C:/Users/deham/Desktop/Corehead/frontend/components/GuidesPreview.tsx', component, 'utf8');

// Also update landing page to include GuidesPreview
let page = fs.readFileSync('C:/Users/deham/Desktop/Corehead/frontend/app/page.tsx', 'utf8');

if (!page.includes('GuidesPreview')) {
  page = page.replace(
    'import FAQ from "@/components/FAQ";',
    'import FAQ from "@/components/FAQ";\nimport GuidesPreview from "@/components/GuidesPreview";'
  );
  page = page.replace(
    '<Pricing />',
    '<Pricing />\n      <GuidesPreview />'
  );
  fs.writeFileSync('C:/Users/deham/Desktop/Corehead/frontend/app/page.tsx', page, 'utf8');
  console.log('Landing page updated with GuidesPreview!');
} else {
  console.log('GuidesPreview already in landing page');
}

console.log('Done!');
