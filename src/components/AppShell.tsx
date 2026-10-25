"use client";

import Nav from "./Nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "28px 16px 80px",
        }}
      >
        {children}
      </main>
    </>
  );
}
