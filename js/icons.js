// Icônes SVG de l’interface (tracés 24×24) et illustration des box.
// Ce fichier ne contient que des dessins : inutile de le lire pour comprendre le jeu.

export const ICON={
 blaster:'<path d="M3 9h13l2-2h3v6h-4l-1 1H10l-1 6H5.5l1-6H3z"/><path d="M8 9V7"/>',
 shotgun:'<path d="M2 8h19M2 11.5h19"/><path d="M8 11.5l-2.5 8H9l2.5-8"/><path d="M21 8v3.5"/>',
 drones:'<circle cx="12" cy="12" r="2.5"/><path d="M12 2.5l2 3-2 3-2-3z"/><path d="M3.8 16.7l3.6-.3 1.6 3.2-3.6.3z"/><path d="M20.2 16.7l-3.6-.3-1.6 3.2 3.6.3z"/>',
 arc:'<path d="M13 2L4.5 13.5H11L9.5 22l10-12.5H13z"/>',
 disc:'<path d="M12 2.5l1.8 2.6 3-.9.2 3.1 2.9 1.2-1.7 2.5 1.7 2.5-2.9 1.2-.2 3.1-3-.9L12 21.5l-1.8-2.6-3 .9-.2-3.1-2.9-1.2 1.7-2.5-1.7-2.5 2.9-1.2.2-3.1 3 .9z"/><circle cx="12" cy="12" r="3"/>',
 molotov:'<path d="M10 7h4v2.5l2 3V21H8v-8.5l2-3z"/><path d="M10 4.5h4V7h-4z"/><path d="M12 4.5c0-1.5 1.5-1.5 1-3"/><path d="M8 15h8"/>',
 mines:'<path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8z"/><circle cx="12" cy="12" r="2.2"/>',
 rockets:'<path d="M12 2c2.8 2.6 3.8 6.6 3 11.5H9C8.2 8.6 9.2 4.6 12 2z"/><path d="M9 13.5L6.5 16v3L9 17.2M15 13.5l2.5 2.5v3L15 17.2M12 16.5V22"/><circle cx="12" cy="8" r="1.4"/>',
 aura:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" stroke-dasharray="3 2.5"/><circle cx="12" cy="12" r="10"/>',
 laser:'<circle cx="12" cy="12" r="3"/><path d="M14.5 10.5L22 5M9.5 13.5L2 19"/><path d="M12 2v3M12 19v3"/>',
 boots:'<path d="M6 3h5.5v8l6.5 3c2 .9 3 2.2 3 4v2.5H4.5V3z"/><path d="M4.5 16.5H21"/><path d="M11.5 7H14"/>',
 armor:'<path d="M12 2.5l8 3v6c0 5-3.5 8.8-8 10.5-4.5-1.7-8-5.5-8-10.5v-6z"/><path d="M12 6.5v11"/>',
 heart:'<path d="M12 20.5s-8.5-5-8.5-11.2a4.6 4.6 0 0 1 8.5-2.5 4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.2-8.5 11.2z"/><path d="M7 11h2.5l1.5-2.5 2 5 1.5-2.5H17"/>',
 magnet:'<path d="M5.5 3.5V12a6.5 6.5 0 0 0 13 0V3.5h-4.3V12a2.2 2.2 0 0 1-4.4 0V3.5z"/><path d="M5.5 7.5h4.3M14.2 7.5h4.3"/>',
 trigger:'<circle cx="12" cy="12" r="6"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/><circle cx="12" cy="12" r="1"/>',
 dup:'<rect x="3.5" y="8" width="11" height="12.5" rx="1"/><path d="M9 8V3.5h11.5V16H14.5"/>',
 lens:'<path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 powder:'<circle cx="11" cy="14" r="6.5"/><path d="M15.5 9.5L18 7"/><path d="M19 3v2M21 5h-2M17.5 3.5l1 1"/>',
 amp:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/><path d="M4 4l6 6M20 4l-6 6M20 20l-6-6M4 20l6-6"/>',
 hourglass:'<path d="M6 2.5h12M6 21.5h12"/><path d="M7.5 2.5c0 5.5 9 5.5 9 9.5s-9 4-9 9.5M16.5 2.5c0 5.5-9 5.5-9 9.5s9 4 9 9.5"/>',
 regen:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/>',
 clover:'<circle cx="9" cy="9" r="3.5"/><circle cx="15" cy="9" r="3.5"/><circle cx="9" cy="15" r="3.5"/><circle cx="15" cy="15" r="3.5"/><path d="M14 16l5 6"/>',
 heal:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
 gold:'<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9a3 3 0 0 0-5 1.2c0 3 5 1.6 5 4.6a3 3 0 0 1-5 1.2M12 5.5v13"/>',
 core:'<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 flamer:'<path d="M2.5 10h9l2-2h3v6h-3l-2-2h-9z"/><path d="M5 12v5h3"/><path d="M17.5 11c2-.5 3-2 3.5-4 .5 2.5 1 4-1 6.5 1.5-.5 1.5 1.5.5 3-1.5-1-2.5-2-3-5.5"/>',
 cryo:'<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3.5 10.5L6.5 9l-.5-3.3M20.5 13.5L17.5 15l.5 3.3M3.5 13.5L6.5 15l-.5 3.3M20.5 10.5L17.5 9l.5-3.3"/>',
 katana:'<path d="M20.5 3.5L8 16l-1.5-1.5L19 2z"/><path d="M8.5 13l2.5 2.5M5 15l4 4M6.5 17.5L4 20l-1-1 2.5-2.5"/>',
 singular:'<circle cx="12" cy="12" r="2.6"/><path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5M20.5 12a8.5 8.5 0 0 1-8.5 8.5M12 20.5A8.5 8.5 0 0 1 3.5 12M3.5 12A8.5 8.5 0 0 1 12 3.5"/><path d="M12 7a5 5 0 0 1 5 5M12 17a5 5 0 0 1-5-5"/>',
 fuel:'<path d="M6 5h9l3 3v12.5H6z"/><path d="M15 5v3h3M9 3h4v2H9z"/><path d="M9.5 11.5l5 5M14.5 11.5l-5 5"/>',
 chip:'<rect x="6.5" y="6.5" width="11" height="11" rx="1"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 3v3.5M12 3v3.5M15 3v3.5M9 17.5V21M12 17.5V21M15 17.5V21M3 9h3.5M3 12h3.5M3 15h3.5M17.5 9H21M17.5 12H21M17.5 15H21"/>',
 wallet:'<path d="M3.5 7.5h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-15z"/><path d="M3.5 7.5l11-4 1.5 4"/><path d="M15 13.5h5.5v3H15a1.5 1.5 0 0 1 0-3z"/>',
 reroll:'<path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5"/><path d="M5 3.5v4h4M19 20.5v-4h-4"/>',
 turret:'<path d="M4.5 20.5h15"/><path d="M7 20.5l2-5h6l2 5"/><rect x="8" y="9.5" width="8" height="6" rx="1"/><path d="M14 12.5h7"/><circle cx="12" cy="12.5" r="1.2"/><path d="M12 9.5V6"/>',
 servo:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/><circle cx="12" cy="12" r="6.5"/>',
 map:'<path d="M3 6.5l6-3 6 3 6-3v14l-6 3-6-3-6 3z"/><path d="M9 3.5v14M15 6.5v14"/>',
 star:'<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>',
 arsenal:'<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="8" height="7" rx="1"/><path d="M17 14v5M14.5 16.5h5"/>',
 cards:'<rect x="3" y="6" width="10" height="14" rx="1" transform="rotate(-10 8 13)"/><rect x="10" y="4" width="10" height="14" rx="1" transform="rotate(8 15 11)"/>',
 revive:'<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/><path d="M12 8v7M8.5 11.5h7"/>',
 box:'<path d="M12 2l8.6 5v10L12 22l-8.6-5V7z"/><path d="M12 6l5.2 3v6L12 18l-5.2-3V9z" opacity=".55"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M3.4 7l3.4 2M20.6 7l-3.4 2M3.4 17l3.4-2M20.6 17l-3.4-2"/>',
};
// Illustration détaillée d'une box (capsule bio hexagonale) : couleur = currentColor, animée en CSS
export let BXID=0;
export function boxArt(){const id='bx'+(++BXID);return `<svg viewBox="0 0 100 100" class="bxsvg" aria-hidden="true"><defs>
<radialGradient id="${id}g"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="currentColor" stop-opacity=".85"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".32"/><stop offset=".6" stop-color="#0a0e18" stop-opacity=".92"/><stop offset="1" stop-color="currentColor" stop-opacity=".18"/></linearGradient></defs>
<polygon points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5" fill="url(#${id}f)" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"/>
<polygon points="50,15 80,32.5 80,67.5 50,85 20,67.5 20,32.5" fill="none" stroke="currentColor" stroke-opacity=".4" stroke-width="1.4"/>
<path d="M11 27.5l9 5M89 27.5l-9 5M11 72.5l9-5M89 72.5l-9-5M50 5v10M50 95V85" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
<g class="bx-ring"><circle cx="50" cy="50" r="23" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="9 6" stroke-opacity=".85"/></g>
<circle class="bx-core" cx="50" cy="50" r="21" fill="url(#${id}g)"/>
<path class="bx-helix" d="M43 38c9 4 9 8 0 12s-9 8 0 12M57 38c-9 4-9 8 0 12s9 8 0 12" fill="none" stroke="#fff" stroke-width="1.6" stroke-opacity=".75" stroke-linecap="round"/>
<path d="M30 21l6-3.5M64 17.5l6 3.5" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>`;}
export function svg(id,sw=1.8){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]||''}</svg>`;}
