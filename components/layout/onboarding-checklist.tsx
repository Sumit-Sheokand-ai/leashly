"use client";

import { useEffect, useState } from "react";
import { Check, Key, Shield, Zap, X } from "lucide-react";
import Link from "next/link";

interface Step {
  id: string;
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const STEPS: Step[] = [
  { id: "key",   label: "Add an API key",       desc: "Connect your OpenAI, Anthropic, or Gemini key",  href: "/dashboard/keys",   icon: Key,    color: "#00ff88" },
  { id: "rule",  label: "Set a spend cap",       desc: "Protect yourself from surprise bills",            href: "/dashboard/rules",  icon: Shield, color: "#ffaa00" },
  { id: "proxy", label: "Make your first request", desc: "Point your app at the Leashly proxy",          href: "/dashboard/keys",   icon: Zap,    color: "#00aaff" },
];

export function OnboardingChecklist({ hasKey, hasRule, hasRequests }: {
  hasKey: boolean; hasRule: boolean; hasRequests: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("leashly_onboarding_dismissed");
    if (d === "1") setDismissed(true);
  }, []);

  const completedMap = { key: hasKey, rule: hasRule, proxy: hasRequests };
  const completed = STEPS.filter(s => completedMap[s.id as keyof typeof completedMap]).length;
  const allDone = completed === STEPS.length;

  if (dismissed || allDone) return null;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden mb-6">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#111111]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Get started</span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className="h-full bg-[#00ff88] rounded-full transition-all"
                style={{ width: `${(completed / STEPS.length) * 100}%` }} />
            </div>
            <span className="text-xs text-[#444444] font-mono">{completed}/{STEPS.length}</span>
          </div>
        </div>
        <button onClick={() => { setDismissed(true); localStorage.setItem("leashly_onboarding_dismissed", "1"); }}
          className="p-1 text-[#333333] hover:text-[#888888] rounded transition-colors">
          <X size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#111111]">
        {STEPS.map(step => {
          const done = completedMap[step.id as keyof typeof completedMap];
          const Icon = step.icon;
          return (
            <Link key={step.id} href={step.href}
              className={`flex items-start gap-3 px-5 py-4 transition-colors ${done ? "opacity-50" : "hover:bg-[#0d0d0d]"}`}>
              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${done ? "bg-[#00ff88]/10" : ""}`}
                style={done ? {} : { background: `${step.color}12` }}>
                {done
                  ? <Check size={13} className="text-[#00ff88]" />
                  : <Icon size={13} style={{ color: step.color }} />
                }
              </div>
              <div>
                <p className={`text-sm font-medium ${done ? "line-through text-[#444444]" : "text-[#d0d0d0]"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-[#444444] mt-0.5">{step.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
