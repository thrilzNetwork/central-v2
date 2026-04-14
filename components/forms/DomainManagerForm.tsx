"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DomainMapping {
  id: string;
  domain: string;
  verified: boolean;
  dns_instructions: unknown;
  created_at: string;
}

interface DomainManagerProps {
  currentSlug: string;
  currentCustomDomain?: string | null;
  domains: DomainMapping[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} type="button"
      className="text-xs text-[#FF7F11] hover:underline shrink-0 ml-2">
      {copied ? "✓" : "Copiar"}
    </button>
  );
}

export function DomainManager({ currentSlug, domains: initial }: DomainManagerProps) {
  const [domains, setDomains] = useState<DomainMapping[]>(initial);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDns, setShowDns] = useState<string | null>(null);

  const subdomainUrl = `https://${currentSlug}.central.bo`;

  async function handleAdd() {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError(null);

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: newDomain.trim().toLowerCase(), action: "add" }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al agregar dominio");
    } else {
      const listRes = await fetch("/api/domains");
      if (listRes.ok) setDomains(await listRes.json());
      setNewDomain("");
      // Show DNS instructions for newly added domain
      setShowDns(newDomain.trim().toLowerCase());
    }
    setAdding(false);
  }

  async function handleRemove(domain: string) {
    await fetch("/api/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, action: "remove" }),
    });
    setDomains((prev) => prev.filter((d) => d.domain !== domain));
    if (showDns === domain) setShowDns(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Free subdomain */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-5">
        <p className="label-caps text-[#6B7565] mb-3">Tu subdominio gratuito</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0 border border-[#EAE7DC] rounded-sm bg-[#F7F5EE] px-3 py-2.5">
            <svg className="w-4 h-4 text-[#ACBFA4] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="font-mono text-sm text-[#262626] truncate">{currentSlug}.central.bo</span>
            <CopyButton text={subdomainUrl} />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-caps text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-sm whitespace-nowrap">Activo</span>
            <a
              href={subdomainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#262626] text-white text-sm font-medium rounded-sm hover:bg-black transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver Portal
            </a>
          </div>
        </div>
      </div>

      {/* Custom domain — Profesional+ */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-[#262626]"
            style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "1.1rem", fontWeight: 500 }}>
            Dominio Personalizado
          </h2>
          <span className="label-caps text-[#FF7F11] bg-[#FF7F11]/10 px-2 py-1 rounded-sm shrink-0">Pro</span>
        </div>
        <p className="text-xs text-[#6B7565] mb-5">
          Conecta tu propio dominio para que tu portal sea accesible en <strong>tumarca.com</strong>.
        </p>

        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="flex-1">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="mirealestate.com"
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button onClick={handleAdd} loading={adding} disabled={!newDomain.trim()}>
            Conectar
          </Button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-2 rounded-sm">
            {error}
          </p>
        )}

        {/* DNS Instructions shown after adding */}
        {showDns && (
          <div className="mt-4 bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-4">
            <p className="label-caps text-[#6B7565] mb-3">
              Configura estos registros DNS en GoDaddy / Namecheap:
            </p>
            <div className="flex flex-col gap-2">
              {[
                { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
                { type: "CNAME", name: "@", value: "cname.vercel-dns.com" },
              ].map((r, i) => (
                <div key={i} className="bg-white border border-[#EAE7DC] rounded-sm px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-mono text-xs">
                      <span className="text-[#FF7F11] font-medium">{r.type}</span>{" "}
                      <span className="text-[#262626]">{r.name}</span>{" → "}
                      <span className="text-[#6B7565]">{r.value}</span>
                    </div>
                    <CopyButton text={r.value} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#6B7565] mt-3 leading-relaxed">
              Después de guardar los registros DNS, la propagación puede tardar hasta <strong>48 horas</strong>. Tu portal estará disponible automáticamente en tu dominio una vez verificado.
            </p>
          </div>
        )}
      </div>

      {/* Existing domains */}
      {domains.length > 0 && (
        <div className="bg-white border border-[#EAE7DC] rounded-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-[#EAE7DC]">
            <p className="label-caps text-[#6B7565]">Dominios Conectados</p>
          </div>
          <div className="divide-y divide-[#EAE7DC]">
            {domains.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-[#262626] truncate">{d.domain}</p>
                  <p className="text-xs text-[#6B7565] mt-0.5">
                    Agregado {new Date(d.created_at).toLocaleDateString("es-BO")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="label-caps px-2 py-1 rounded-sm"
                    style={d.verified
                      ? { backgroundColor: "#DCFCE7", color: "#16A34A" }
                      : { backgroundColor: "#FEF9C3", color: "#CA8A04" }}>
                    {d.verified ? "Verificado" : "Pendiente DNS"}
                  </span>
                  {!d.verified && (
                    <button onClick={() => setShowDns(showDns === d.domain ? null : d.domain)}
                      className="text-xs text-[#FF7F11] hover:underline whitespace-nowrap">
                      Ver DNS
                    </button>
                  )}
                  {d.verified && (
                    <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#6B7565] hover:text-[#262626]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <button onClick={() => handleRemove(d.domain)}
                    className="text-xs text-[#ACBFA4] hover:text-red-500 transition-colors">
                    Eliminar
                  </button>
                </div>
                {/* Inline DNS reminder for pending domains */}
                {showDns === d.domain && !d.verified && (
                  <div className="w-full bg-[#F7F5EE] border border-[#EAE7DC] rounded-sm p-3 mt-1">
                    <p className="text-xs text-[#6B7565] mb-2 label-caps">Registros DNS requeridos:</p>
                    {[
                      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
                      { type: "CNAME", name: "@", value: "cname.vercel-dns.com" },
                    ].map((r, i) => (
                      <div key={i} className="font-mono text-xs bg-white border border-[#EAE7DC] rounded-sm px-2 py-1.5 mb-1 flex items-center justify-between">
                        <span><span className="text-[#FF7F11]">{r.type}</span> {r.name} → {r.value}</span>
                        <CopyButton text={r.value} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
