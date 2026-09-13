import React from "react";

export function NyayaVaultBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Full-screen unified background asset */}
      <img 
        src="/images/Background01.png" 
        alt="" 
        aria-hidden="true" 
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
    </div>
  );
}
