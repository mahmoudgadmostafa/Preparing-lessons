const fs = require('fs');
const path = 'src/pages/Preparation.tsx';

try {
  const content = fs.readFileSync(path, 'utf8');
  const lines = content.split(/\r?\n/);

  // We want to replace lines 550 to 594 (1-based) => indices 549 to 593 (0-based)
  // Verify the start line content to be safe
  if (!lines[549].includes('isWatermarkVisible && watermarkText')) {
    console.error('Line 550 does not match expected start content. Aborting to prevent corruption.');
    console.error('Found:', lines[549]);
    process.exit(1);
  }

  // Verify end line content
  // Line 594 should be '          )}'
  if (!lines[593].trim().startsWith(')}')) {
    console.error('Line 594 does not match expected end content. Aborting.');
    console.error('Found:', lines[593]);
    process.exit(1);
  }

  const newBlock = `          {/* Watermark Element */}
          {(showWmName || showWmPhone) && (
            <div className="watermark-container pointer-events-none absolute inset-0 z-50 overflow-hidden">
              {/* Professional Grid Pattern */}
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 grid-rows-3 gap-8 opacity-[0.05] p-8">
                {getWatermarkGridItems().map((type, i) => {
                  let content = "";
                  let label = "";
                  
                  if (type === 'name') {
                       // Name Stamp
                       const nameRaw = wmName.trim();
                       content = nameRaw.startsWith("أ/") ? nameRaw : \`أ/ \${nameRaw}\`;
                       label = "المعلم";
                  } else {
                       // Phone Stamp
                       const phoneRaw = wmPhone.trim();
                       content = phoneRaw.startsWith("ت/") ? phoneRaw : \`ت/ \${phoneRaw}\`;
                       label = "للتواصل";
                  }

                  return (
                    <div key={i} className="flex items-center justify-center">
                      <div className={\`transform \${type === 'name' ? '-rotate-[15deg]' : '-rotate-[25deg]'} border-4 \${type === 'name' ? 'border-slate-900/40' : 'border-slate-800/30'} px-10 py-6 rounded-[2rem] flex flex-col items-center justify-center mix-blend-multiply backdrop-blur-[1px]\`}>
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                          <Shield className="w-6 h-6 text-slate-800" />
                          <span className="text-sm font-bold tracking-[0.3em] text-slate-700 uppercase border-b border-slate-400 pb-1">{label}</span>
                        </div>
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 whitespace-nowrap text-center px-4 leading-tight" style={{ fontFamily: 'serif' }}>
                          {content}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}`;

  // Splice replacement
  // array.splice(start, deleteCount, item1, item2, ...)
  // start index: 549
  // delete count: 593 - 549 + 1 = 45 lines
  lines.splice(549, 45, newBlock);

  const finalContent = lines.join('\n');
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Successfully replaced lines 550-594.');

} catch (err) {
  console.error(err);
  process.exit(1);
}
