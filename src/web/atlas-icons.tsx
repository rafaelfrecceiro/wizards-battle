import React from "react";
/** Iconografia de HUD em vetor; não altera os símbolos das frentes originais. */
export function SchoolIcon({school}:{school:string}) {
  return <svg viewBox="0 0 32 32" className="atlas-school-icon" aria-hidden="true" focusable="false">
    {school==='Chama' && <><path d="M17 2c1 8 8 9 9 17 1 7-4 11-10 11S5 26 6 20c0-5 4-8 5-12 0 5 2 7 4 8 4-4 1-7 2-14Z" fill="currentColor"/><path d="M17 17c1 4 6 6 3 10-3 4-9 0-7-4 1-2 3-3 4-6Z" fill="#ffedb2"/></>}
    {school==='Raiz' && <><path d="M17 27C4 26 3 13 6 7c8 2 10 7 11 12C15 8 23 5 28 3c1 10-2 20-11 24Z" fill="currentColor"/><path d="m16 29 1-11 8-11M16 24 8 12" fill="none" stroke="#203729" strokeWidth="1.5"/></>}
    {school==='Sombra' && <><path d="M23 3C7 2 1 21 13 28c7 5 17-1 17-9-9 7-23-5-7-16Z" fill="currentColor"/><path d="m24 7 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#e4d5fa"/></>}
    {school==='Maré' && <><path d="M16 2C13 9 5 17 6 22c1 13 24 11 20-2-1-5-8-12-10-18Z" fill="currentColor"/><path d="M12 17c-6 10 7 13 9 6-4 2-9 0-9-6Z" fill="#bdedf4" opacity=".75"/></>}
  </svg>;
}
export function AtlasPileIcon({zone}:{zone:string}) {
  return <svg viewBox="0 0 36 42" className="atlas-pile-icon" aria-hidden="true" focusable="false">
    {zone==='deck'?<><path d="m5 5 22-2 5 32-23 4Z" fill="#4b392d"/><path d="M4 6h24v32H4Z" fill="#24323a" stroke="currentColor" strokeWidth="2"/><path d="M8 10h16v23H8Z" fill="none" stroke="currentColor"/><path d="m16 15 4 6-4 6-4-6Z" fill="currentColor"/></>:zone==='ashes'?<><path d="M7 15h22l-3 23H10Z" fill="#8d8172" stroke="currentColor" strokeWidth="2"/><path d="M5 12h26v5H5ZM13 8l3-5 3 7 4-4 2 5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m15 24 4-3 4 4-5 6-5-4" fill="#4d4843"/></>:<><path d="m8 8 22 4-5 27-22-4Z" fill="#77604a" stroke="currentColor"/><path d="M10 3h22v30H10Z" fill="#263239" stroke="currentColor" strokeWidth="2"/><path d="M14 9h14M14 14h14M14 19h10" stroke="currentColor" strokeWidth="1.5"/></>}
  </svg>;
}
