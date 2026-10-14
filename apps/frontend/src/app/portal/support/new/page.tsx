"use client";

import React from "react";
import { SupportWizard } from "./components/support-wizard";

export default function NewSupportTicketPage() {
  return (
    <div className="flex-1 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Yeni Destek Talebi
          </h1>
          <p className="text-muted-foreground mt-2">
            Sorununuzu çözmek için size en hızlı yolu sunuyoruz.
          </p>
        </div>
      </div>

      <SupportWizard />
    </div>
  );
}
