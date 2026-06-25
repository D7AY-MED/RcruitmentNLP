'use client';
import React, { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';

export default function CopyLinkButton({ value, className = '', compact = false }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e) => {
    e.stopPropagation(); // Prevent card click
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={`group flex items-center gap-2 rounded-xl border ${
        copied ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600' : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
      } ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${compact ? 'w-auto' : 'w-full'} overflow-hidden ${className}`}
      title={value}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-background/50 shadow-sm">
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600 animate-in zoom-in duration-300" aria-hidden="true" />
        ) : (
          <LinkIcon className="w-3 h-3 group-hover:text-primary transition-colors" aria-hidden="true" />
        )}
      </div>
      
      {compact ? (
        <span className="font-semibold transition-all duration-300">
          {copied ? 'Copied!' : 'Copy link'}
        </span>
      ) : (
        <span className="truncate flex-1 text-left relative">
          <span className={`block transition-transform duration-300 ${copied ? '-translate-y-8 absolute' : 'translate-y-0'}`}>
            {value}
          </span>
          <span className={`block font-semibold tracking-wide transition-transform duration-300 ${copied ? 'translate-y-0' : 'translate-y-8 absolute'}`}>
            Link copied to clipboard!
          </span>
        </span>
      )}

      {!copied && !compact && (
        <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-1 rounded-md ml-2">
          <Copy className="w-3.5 h-3.5" /> Copy
        </span>
      )}
    </button>
  );
}
